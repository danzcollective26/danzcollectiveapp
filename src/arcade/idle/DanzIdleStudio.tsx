import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { DEFAULT_STORAGE_KEY, progressReport, type DanzIdleStudioProps, type IdlePlayer, type IdleProgressEvent } from "./contract.ts"
import {
  CUTS,
  DEFAULT_LOOK,
  HAIRS,
  loadLook,
  saveLook,
  SKINS,
  STAGE_NAME,
  STAGE_NEXT,
  stageIndex,
  type DollLook,
} from "./doll-look.ts"
import { IDLE_CONFIG, stationById } from "./idle-config.ts"
import { DANZFLOR, euros, florByTitle, refreshDanzFlor, type FlorPiece } from "./danzflor.ts"
import { hostLine, quipFor } from "./crew.ts"
import { currentOrder } from "./orders.ts"
import { fashionSheet } from "./fashion-look.ts"
import { musicSeen, musicSheet, musicSoon } from "./music-look.ts"
import { cocinaSheet } from "./cocina-look.ts"
import { printSheet } from "./print-look.ts"
import { selloSheet } from "./sello-look.ts"
import { salaSheet } from "./sala-look.ts"
import { videoSheet } from "./video-look.ts"
import { fashionProduct, printProduct, PRODUCERS, productName, productTier, shelfValue, unlockedOperators } from "./products.ts"
import { CAST_KEY, TEES } from "./tees.ts"
import {
  coachLine,
  createInitialState,
  jobDuration,
  jobPayout,
  jobProgress,
  leaveRoom,
  levelCost,
  levelUp,
  applyRaid,
  buyGear,
  repairStation,
  nextGoal,
  pauseJob,
  raidPlan,
  resumeJob,
  settle,
  startJob,
  takeControls,
  unlockHint,
  type EngineResult,
  type IdleState,
} from "./idle-engine.ts"
import { SECURITY_GEAR } from "./security-gear.ts"
import { loadIdle, saveIdle } from "./idle-storage.ts"
import { SPAWN, SEATS, StudioMap, canWalk } from "./studio-map.tsx"
import { CATALOG, DEFAULT_LOADOUT, FLOOR_COLORS, FLOOR_NAMES, WALL_COLORS, WALL_NAMES, anchorOf, defaultRoomStyle, findPath, frontOf, loadFurni, loadRoomStyle, postAt, roomAt, saveFurni, saveRoomStyle, setClosedRooms, speedFactor, stationHome, tileAt, walkable, type Loadout, type RoomId, type RoomStyle, type Tile } from "./habbo-room.ts"
import "./danz-idle.css"

let sharedAudio: AudioContext | null = null

function blip(enabled: boolean, frequency: number) {
  if (!enabled || typeof window === "undefined") return
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  const audio = sharedAudio ?? new Ctx()
  sharedAudio = audio
  if (audio.state === "suspended") void audio.resume()
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = "square"
  oscillator.frequency.value = frequency
  gain.gain.value = 0.035
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start()
  const end = audio.currentTime + 0.12
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  oscillator.stop(end)
}

function commitSideEffects(
  result: EngineResult,
  now: number,
  storageKey: string,
  canSave: boolean,
  onProgress?: (event: IdleProgressEvent) => void,
  player?: IdlePlayer | null,
) {
  for (const milestone of result.newMilestones) {
    onProgress?.(progressReport(milestone, player))
  }
  if (!canSave) return { ok: true as const }
  return saveIdle(localStorage, storageKey, pauseJob(result.state, now))
}

export default function DanzIdleStudio({
  onExit,
  storageKey = DEFAULT_STORAGE_KEY,
  onProgress,
  player = null,
}: DanzIdleStudioProps) {
  const [ready, setReady] = useState(true)
  const [state, setState] = useState<IdleState>(() => createInitialState())
  const [selectedId, setSelectedId] = useState("music")
  const [notice, setNotice] = useState<string | null>(null)
  const [quip, setQuip] = useState<{ stationId: string; name: string; text: string } | null>(null)
  const [, setWarning] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(false)
  const [percent, setPercent] = useState(0)
  const [gain, setGain] = useState<string | null>(null)
  const [worker, setWorker] = useState({ ...SPAWN, moving: false, face: 1 })
  const [stick] = useState<{ x: number; y: number; kx: number; ky: number } | null>(null)
  const [look, setLook] = useState<DollLook>(DEFAULT_LOOK)
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT)
  const [shopOpen, setShopOpen] = useState(false)
  const [hintOpen] = useState(true)
  const [flor, setFlor] = useState<FlorPiece[]>(DANZFLOR)
  const [cast, setCast] = useState(false)
  const [lookOpen, setLookOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetRoom, setSheetRoom] = useState<"music" | "fashion" | "video" | "print" | "cocina" | "sala" | "sello" | "seguridad">("video")
  const [mug, setMug] = useState(0)
  const [rooms, setRooms] = useState<Record<RoomId, RoomStyle>>(defaultRoomStyle)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("danz-mugs"))
      if (saved === 1 || saved === 2) setMug(saved)
      setRooms(loadRoomStyle(localStorage))
    } catch {
      /* el office sigue con las tazas de siempre */
    }
  }, [])
  const [bloomId, setBloomId] = useState<string | null>(null)
  const stateRef = useRef(state)
  const progressRef = useRef(onProgress)
  const playerRef = useRef(player)
  const soundRef = useRef(soundOn)
  const keyRef = useRef(storageKey)
  const saveRef = useRef(true)
  const selectedRef = useRef(selectedId)
  const spot = useRef({ ...SPAWN })
  const viewRef = useRef<HTMLDivElement>(null)
  const camRef = useRef({ x: 0, y: 0, scale: 1 })
  const destRef = useRef<Tile | null>(null)
  const keysRef = useRef({ x: 0, y: 0 })
  const movingRef = useRef(false)
  const faceRef = useRef(1)
  const nearRef = useRef<string | null>(null)
  const roomRef = useRef<string | null>(null)
  const raidRef = useRef(0)
  const shelfNote = useRef("")
  const intruderRef = useRef<{ start: number; ms: number; path: Tile[]; monoPath: Tile[]; stationId: string; stop: boolean; take: number } | null>(null)
  stateRef.current = state
  progressRef.current = onProgress
  playerRef.current = player
  soundRef.current = soundOn
  keyRef.current = storageKey
  selectedRef.current = selectedId

  const apply = (result: EngineResult, now: number) => {
    if (result.error) {
      setNotice(result.error)
      return
    }
    if (result.state === stateRef.current && result.newMilestones.length === 0 && !result.completedJob) return
    stateRef.current = result.state
    setState(result.state)
    setNotice(null)
    if (result.completedJob) {
      if (result.completedJob?.made) setGain(`${result.completedJob.made} al estante`)
      else if (result.completedJob && result.completedJob.payout > 0) setGain(`+${result.completedJob.payout}`)
      blip(soundRef.current, 640)
      for (const id of result.filledOrders ?? []) {
        progressRef.current?.(progressReport("order-filled", playerRef.current, { stationId: id, loops: result.state.currency }))
      }
      if ((result.filledOrders?.length ?? 0) > 0) setNotice("Encargo cerrado. El extra se avisa a la app y no se canjea aquí.")
      if ((result.state.goods?.length ?? 0) >= 30) {
        progressRef.current?.(progressReport("shelf-full", playerRef.current, { loops: result.state.currency }))
      }
    }
    if (result.newMilestones.includes("fashion-unlocked")) {
      setSelectedId("fashion")
      blip(soundRef.current, 420)
    }
    const saved = commitSideEffects(result, now, keyRef.current, saveRef.current, progressRef.current, playerRef.current)
    if (!saved.ok) {
      saveRef.current = false
      setWarning(saved.message)
    }
  }

  useEffect(() => {
    const loaded = loadIdle(localStorage, storageKey)
    let next = loaded.state
    if (next.activeJob?.paused || next.operatorJobs?.some((job) => job.paused)) next = resumeJob(next, performance.now())
    stateRef.current = next
    setState(next)
    const open = IDLE_CONFIG.stations.find(
      (station) => next.stations[station.id]?.unlocked && next.stations[station.id]?.jobsCompleted === 0 && !station.startsUnlocked,
    )
    if (open) setSelectedId(open.id)
    setWarning(loaded.warning)
    saveRef.current = loaded.saveAvailable
    const savedLook = loadLook(localStorage)
    setLook(savedLook)
    setLoadout(loadFurni(localStorage))
    try {
      const played = next.currency > 0 || (next.stations.music?.level ?? 1) > 1 || (next.goods?.length ?? 0) > 0
      setCast(localStorage.getItem(CAST_KEY) === "1" || played)
    } catch {
      setCast(false)
    }
    setReady(true)
  }, [storageKey])

  useEffect(() => {
    let alive = true
    refreshDanzFlor()
      .then((next) => {
        if (alive && next) setFlor(next)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!ready || !cast) return
    let frame = 0
    let alive = true
    let lastWrite = 0
    const tick = () => {
      if (!alive) return
      const now = performance.now()
      const current = stateRef.current
      const result = settle(current, IDLE_CONFIG, now, speedFactor(loadFurni(localStorage)))
      if (result.state !== current) apply(result, now)
      else if (current.activeJob && !current.activeJob.paused) {
        const nextPercent = Math.round(jobProgress(current, now) * 100)
        setPercent((value) => (value === nextPercent ? value : nextPercent))
        if (saveRef.current && now - lastWrite > 1000) {
          lastWrite = now
          const saved = saveIdle(localStorage, keyRef.current, pauseJob(current, now))
          if (!saved.ok) {
            saveRef.current = false
            setWarning(saved.message)
          }
        }
      }
      frame = window.setTimeout(tick, 250)
    }
    frame = window.setTimeout(tick, 250)
    const onVisibility = () => {
      const now = performance.now()
      if (document.hidden) {
        const settled = settle(stateRef.current, IDLE_CONFIG, now, speedFactor(loadFurni(localStorage)))
        const paused = pauseJob(settled.state, now)
        stateRef.current = paused
        setState(paused)
        if (settled.completedJob?.made) setGain(`${settled.completedJob.made} al estante`)
        else if (settled.completedJob && settled.completedJob.payout > 0) setGain(`+${settled.completedJob.payout}`)
        for (const milestone of settled.newMilestones) {
          progressRef.current?.(progressReport(milestone, playerRef.current))
        }
        if (saveRef.current) {
          const saved = saveIdle(localStorage, keyRef.current, paused)
          if (!saved.ok) {
            saveRef.current = false
            setWarning(saved.message)
          }
        }
        return
      }
      if (stateRef.current.activeJob?.paused || stateRef.current.operatorJobs?.some((job) => job.paused)) {
        const resumed = resumeJob(stateRef.current, now)
        stateRef.current = resumed
        setState(resumed)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      alive = false
      window.clearTimeout(frame)
      document.removeEventListener("visibilitychange", onVisibility)
      const now = performance.now()
      const settled = settle(stateRef.current, IDLE_CONFIG, now, speedFactor(loadFurni(localStorage)))
      const paused = pauseJob(settled.state, now)
      for (const milestone of settled.newMilestones) {
        progressRef.current?.(progressReport(milestone, playerRef.current))
      }
      if (saveRef.current) saveIdle(localStorage, keyRef.current, paused)
    }
  }, [ready, cast])

  useEffect(() => {
    if (!quip) return
    const timer = window.setTimeout(() => setQuip(null), 9000)
    return () => window.clearTimeout(timer)
  }, [quip])

  useEffect(() => {
    if (!ready || !cast) return
    const timer = window.setInterval(() => {
      const near = nearRef.current
      if (!near) return
      const people = unlockedOperators(stateRef.current.stations).filter((operator) => operator.stationId === near)
      const person = people[Math.floor(Math.random() * people.length)]
      if (person) setQuip(quipFor(near, person.name))
      else if (near === "cocina" || near === "sala" || near === "seguridad") {
        const line = hostLine(near)
        if (line) setQuip(line)
      }
    }, 12000)
    return () => window.clearInterval(timer)
  }, [ready, cast])

  useEffect(() => {
    if (gain === null) return
    const timer = window.setTimeout(() => setGain(null), 1400)
    return () => window.clearTimeout(timer)
  }, [gain])

  useEffect(() => {
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const value = down ? 1 : 0
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keysRef.current.x = down ? -1 : keysRef.current.x === -1 ? 0 : keysRef.current.x
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keysRef.current.x = down ? 1 : keysRef.current.x === 1 ? 0 : keysRef.current.x
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") keysRef.current.y = down ? -1 : keysRef.current.y === -1 ? 0 : keysRef.current.y
      if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") keysRef.current.y = down ? value : keysRef.current.y === 1 ? 0 : keysRef.current.y
      if (event.key.startsWith("Arrow")) event.preventDefault()
    }
    const down = (event: KeyboardEvent) => onKey(event, true)
    const up = (event: KeyboardEvent) => onKey(event, false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let alive = true
    let path: Tile[] = []
    const tick = (now: number) => {
      if (!alive || !cast) return
      setClosedRooms(IDLE_CONFIG.stations.filter((station) => !stateRef.current.stations[station.id]?.unlocked).map((station) => station.id))
      if (!canWalk(spot.current.x, spot.current.y)) spot.current = { ...SPAWN }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (destRef.current) {
        const goal = destRef.current
        destRef.current = null
        const here = tileAt(spot.current.x, spot.current.y - 18)
        path = findPath(here, goal).slice(1)
      }
      let nodeAway: string | null = null
      if (path.length) {
        const next = path[0]!
        const goal = frontOf(next.tx, next.ty)
        const ddx = goal.x - spot.current.x
        const ddy = goal.y - spot.current.y
        const dist = Math.hypot(ddx, ddy)
        if (dist < 2) {
          spot.current = canWalk(goal.x, goal.y) ? goal : spot.current
          path.shift()
        } else {
          const step = Math.min(dist, 220 * dt)
          const nextX = spot.current.x + (ddx / dist) * step
          const nextY = spot.current.y + (ddy / dist) * step
          const xOnly = { x: nextX, y: spot.current.y }
          const yOnly = { x: spot.current.x, y: nextY }
          if (canWalk(nextX, nextY)) {
            spot.current = { x: nextX, y: nextY }
          } else if (canWalk(xOnly.x, xOnly.y)) {
            spot.current = xOnly
          } else if (canWalk(yOnly.x, yOnly.y)) {
            spot.current = yOnly
          } else if (dist < 8 && canWalk(goal.x, goal.y)) {
            spot.current = goal
          } else {
            path.shift()
          }
          faceRef.current = Math.abs(ddx) > Math.abs(ddy) ? (ddx >= 0 ? 1 : -1) : faceRef.current
          nodeAway = ddy < -0.5 ? "1" : "0"
        }
        if (!movingRef.current) {
          movingRef.current = true
          setWorker({ x: spot.current.x, y: spot.current.y, moving: true, face: faceRef.current })
        }
      } else if (movingRef.current) {
        movingRef.current = false
        setWorker({ x: spot.current.x, y: spot.current.y, moving: false, face: faceRef.current })
      }
      const postedId = !movingRef.current ? postAt(spot.current.x, spot.current.y) : null
      const posted = postedId ? stationById(IDLE_CONFIG, postedId) : undefined
      const seat = posted ? SEATS[posted.id] : undefined
      const drawX = seat?.drawX ?? seat?.x ?? spot.current.x
      const drawY = seat?.drawY ?? seat?.y ?? spot.current.y
      const node = document.querySelector<HTMLElement>("[data-who='you']")
      if (node) {
        node.style.left = `${drawX}px`
        node.style.top = `${drawY}px`
        node.style.zIndex = String(Math.round(drawY) + (seat ? 36 : 0))
        node.style.setProperty("--face", String(seat?.face ?? faceRef.current))
        const seated = seat?.pose === "sit"
        node.dataset.pose = !seat ? "stand" : seated ? "sit" : seat.pose
        node.dataset.moving = seated || !movingRef.current ? "false" : "true"
        node.dataset.step = String(Math.floor(now / 180) % 2)
        if (seat?.pose === "sit") node.dataset.away = "0"
        else if (typeof nodeAway === "string") node.dataset.away = nodeAway
      }
      const view = viewRef.current
      if (view) {
        const scale = 0.96
        const x = Math.round(view.clientWidth / 2 - drawX * scale)
        const y = Math.round(view.clientHeight * 0.62 - drawY * scale)
        const camNode = view.querySelector<HTMLElement>(".studio-cam")
        if (camNode) {
          const cam = camRef.current
          cam.x += (x - cam.x) * 0.16
          cam.y += (y - cam.y) * 0.16
          cam.scale = scale
          camNode.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})`
        }
      }
      let nearId: string | null = null
      let nearDist = 90
      for (const station of IDLE_CONFIG.stations) {
        const anchor = anchorOf(station.id)
        const dist = Math.hypot(anchor.x - spot.current.x, anchor.y - spot.current.y)
        if (dist < nearDist) {
          nearId = station.id
          nearDist = dist
        }
      }
      if (nearId !== nearRef.current) {
        nearRef.current = nearId
        if (nearId) {
          setSelectedId(nearId)
          const station = stationById(IDLE_CONFIG, nearId)
          const open = Boolean(stateRef.current.stations[nearId]?.unlocked)
          setNotice(open || !station ? null : unlockHint(IDLE_CONFIG, station))
          const present = unlockedOperators(stateRef.current.stations).find((operator) => operator.stationId === nearId)
          if (open && present) setQuip(quipFor(nearId, present.name))
          else if (open && (nearId === "cocina" || nearId === "sala" || nearId === "seguridad")) {
            const line = hostLine(nearId)
            if (line) setQuip(line)
          }
        } else {
          setNotice(null)
        }
      }
      const foot = tileAt(spot.current.x, spot.current.y - 18)
      const room = roomAt(foot)
      const guard = Boolean(stateRef.current.stations.seguridad?.unlocked)
      const lux = (stateRef.current.stations.sala?.level ?? 0) >= 6 && Boolean(stateRef.current.stations.sala?.unlocked)
      if (!(guard && room === null) && room !== roomRef.current) {
        const left = roomRef.current
        roomRef.current = room
        const job = stateRef.current.activeJob
        if (left && job && stationHome(job.stationId) === left) {
          const pass = leaveRoom(stateRef.current, IDLE_CONFIG, left, now)
          stateRef.current = pass.state
          setState(pass.state)
          if (pass.notice) setNotice(pass.notice)
        }
      }
      if (!movingRef.current && posted && stateRef.current.stations[posted.id]?.unlocked) {
        const blocking = stateRef.current.operatorJobs?.some((job) => job.stationId === posted.id && (job.slot ?? "main") !== "side")
        if (blocking) {
          const taken = takeControls(stateRef.current, posted.id)
          if (taken !== stateRef.current) {
            stateRef.current = taken
            setState(taken)
            setNotice("Te pones tú a los mandos.")
          }
        } else if (!stateRef.current.activeJob) {
        const started = startJob(stateRef.current, IDLE_CONFIG, posted.id, now)
        if (!started.error && started.state.activeJob) {
          const factor = speedFactor(loadFurni(localStorage))
          const job = started.state.activeJob
          const durationMs = Math.max(900, Math.round(job.durationMs * factor))
          started.state = {
            ...started.state,
            activeJob: { ...job, durationMs, totalMs: durationMs, remainingMs: durationMs },
          }
        }
        if (!started.error) {
          shelfNote.current = ""
          blip(soundRef.current, 220)
          apply(started, now)
        } else if (shelfNote.current !== started.error) {
          shelfNote.current = started.error
          setNotice(started.error)
        }
        }
      }
      const round = [[5, 4], [5, 3], [3, 4], [8, 3], [13, 3], [18, 3], [13, 8], [8, 10], [2, 7], [5, 5]]
      const nico = document.querySelector<HTMLElement>("[data-who='nico']")
      const thief = document.querySelector<HTMLElement>("[data-who='thief']")
      const tool = document.querySelector<HTMLImageElement>("[data-who='mono-tool']")
      const vest = document.querySelector<HTMLImageElement>("[data-who='mono-vest']")
      const gear = stateRef.current.gear ?? []
      const weapon = ["taser", "confetti", "baton", "spray", "torch"].find((id) => gear.includes(id))
      if (tool) {
        const piece = SECURITY_GEAR.find((item) => item.id === weapon)
        tool.src = piece?.src ?? ""
        tool.style.display = piece ? "" : "none"
      }
      if (vest) {
        vest.src = gear.includes("vest") ? "/idle/habbo/sec-vest.png" : ""
        vest.style.display = gear.includes("vest") ? "" : "none"
      }
      if (raidRef.current === 0) raidRef.current = now + 45000
      if (!intruderRef.current && now >= raidRef.current && stateRef.current.currency > 0) {
        const goals = [
          { id: "music", tx: 3, ty: 4 },
          { id: "fashion", tx: 8, ty: 3 },
          { id: "video", tx: 13, ty: 3 },
          { id: "print", tx: 18, ty: 3 },
          { id: "sello", tx: 8, ty: 10 },
        ].filter((entry) => stateRef.current.stations[entry.id]?.unlocked)
        if (!goals.length) {
          raidRef.current = now + 45000
        } else {
        const goal = goals[Math.floor(Math.random() * goals.length)]!
        const hired = Boolean(stateRef.current.stations.seguridad?.unlocked)
        const plan = raidPlan(hired, gear.length, stateRef.current.currency, Math.random())
        const path = findPath({ tx: 4, ty: 2 }, { tx: goal.tx, ty: goal.ty })
        const route = path.length ? path : [{ tx: 4, ty: 2 }, { tx: goal.tx, ty: goal.ty }]
        const cut = route[Math.max(0, Math.floor(route.length * 0.45))]!
        const chase = findPath({ tx: 5, ty: 5 }, cut)
        intruderRef.current = {
          start: now,
          ms: Math.max(2800, route.length * 280),
          path: route,
          monoPath: chase.length ? chase : [{ tx: 5, ty: 5 }, cut],
          stationId: goal.id,
          stop: plan?.stop ?? false,
          take: plan?.take ?? 1,
        }
        raidRef.current = now + 45000
        setNotice("Alguien se cuela por la puerta.")
        }
      }
      const sneak = intruderRef.current
      if (nico) {
        if (!guard && !sneak) nico.style.display = "none"
        else if (!sneak) {
          const span = 1600
          const t = (now / span) % round.length
          const index = Math.floor(t)
          const hop = t - index
          const from = frontOf(round[index]![0]!, round[index]![1]!)
          const next = round[(index + 1) % round.length]!
          const to = frontOf(next[0]!, next[1]!)
          const x = from.x + (to.x - from.x) * hop
          const y = from.y + (to.y - from.y) * hop
          nico.style.display = ""
          nico.style.left = `${x}px`
          nico.style.top = `${y}px`
          nico.style.zIndex = String(Math.round(y))
          nico.dataset.step = hop > 0.5 ? "1" : "0"
          nico.style.setProperty("--face", to.x >= from.x ? "1" : "-1")
        }
      }
      if (thief && sneak) {
        const p = Math.min(1, (now - sneak.start) / sneak.ms)
        const span = Math.max(1, sneak.path.length - 1)
        const slot = Math.min(span - 1, Math.floor(p * span))
        const hop = p * span - slot
        const from = frontOf(sneak.path[slot]!.tx, sneak.path[slot]!.ty)
        const nextTile = sneak.path[Math.min(sneak.path.length - 1, slot + 1)]!
        const to = frontOf(nextTile.tx, nextTile.ty)
        const x = from.x + (to.x - from.x) * (slot >= span - 1 ? 1 : hop)
        const y = from.y + (to.y - from.y) * (slot >= span - 1 ? 1 : hop)
        thief.style.display = ""
        thief.style.left = `${x}px`
        thief.style.top = `${y}px`
        thief.style.zIndex = String(Math.round(y) + 2)
        thief.dataset.step = p > 0.5 ? "1" : "0"
        thief.style.setProperty("--face", to.x >= from.x ? "1" : "-1")
        thief.classList.toggle("is-pop", sneak.stop && gear.includes("confetti") && p > 0.7)
        if (nico && guard) {
          const chaseSpan = Math.max(1, sneak.monoPath.length - 1)
          const chaseP = Math.min(1, p * 1.15)
          const chaseSlot = Math.min(chaseSpan - 1, Math.floor(chaseP * chaseSpan))
          const chaseHop = chaseP * chaseSpan - chaseSlot
          const chaseFrom = frontOf(sneak.monoPath[chaseSlot]!.tx, sneak.monoPath[chaseSlot]!.ty)
          const chaseNext = sneak.monoPath[Math.min(sneak.monoPath.length - 1, chaseSlot + 1)]!
          const chaseTo = frontOf(chaseNext.tx, chaseNext.ty)
          const arrived = chaseSlot >= chaseSpan - 1
          const mx = chaseFrom.x + (chaseTo.x - chaseFrom.x) * (arrived ? 1 : chaseHop)
          const my = chaseFrom.y + (chaseTo.y - chaseFrom.y) * (arrived ? 1 : chaseHop)
          nico.style.display = ""
          nico.style.left = `${mx}px`
          nico.style.top = `${my}px`
          nico.style.zIndex = String(Math.round(my) + 3)
          nico.dataset.step = arrived ? "0" : "1"
          nico.style.setProperty("--face", chaseTo.x >= chaseFrom.x ? "1" : "-1")
        }
        if (p >= 1) {
          if (sneak.stop) {
            setNotice("Mono los echa. El puesto sigue entero.")
            progressRef.current?.(progressReport("raid-stopped", playerRef.current, { stationId: sneak.stationId, loops: stateRef.current.currency }))
          } else {
            const before = stateRef.current.currency
            const result = applyRaid(stateRef.current, sneak.stationId, sneak.take, false)
            apply(result, now)
            const name = stationById(IDLE_CONFIG, sneak.stationId)?.name ?? "el puesto"
            setNotice(`La rata rompe ${name} y se lleva ${before - result.state.currency} Loops.`)
          }
          thief.style.display = "none"
          intruderRef.current = null
        }
      } else if (thief && !sneak) thief.style.display = "none"
      const luxNode = document.querySelector<HTMLElement>("[data-who='lux']")
      if (luxNode) {
        const cover = stateRef.current.operatorJobs?.find((job) => job.slot === "cover")
        if (!lux) luxNode.style.display = "none"
        else {
          const home = cover ? anchorOf(cover.stationId) : frontOf(13, 9)
          luxNode.style.display = ""
          luxNode.style.left = `${home.x}px`
          luxNode.style.top = `${home.y}px`
          luxNode.style.zIndex = String(Math.round(home.y))
        }
      }
      frame = window.setTimeout(() => tick(performance.now()), path.length ? 32 : 400)
    }
    tick(performance.now())
    frame = window.setTimeout(() => tick(performance.now()), 32)
    return () => {
      alive = false
      window.clearTimeout(frame)
    }
  }, [cast])

  const holdMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const view = viewRef.current
    if (!view) return
    const aim = (clientX: number, clientY: number) => {
      const cam = camRef.current
      const rect = view.getBoundingClientRect()
      const worldX = (clientX - rect.left - cam.x) / cam.scale
      const worldY = (clientY - rect.top - cam.y) / cam.scale
      const tile = tileAt(worldX, worldY)
      if (!walkable(tile)) return
      destRef.current = tile
    }
    aim(event.clientX, event.clientY)
    const move = (ev: PointerEvent) => aim(ev.clientX, ev.clientY)
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  const paint = (patch: Partial<DollLook>) => {
    setLook((current) => {
      const next = { ...current, ...patch }
      saveLook(localStorage, next)
      return next
    })
  }

  const selected = stationById(IDLE_CONFIG, selectedId) ?? IDLE_CONFIG.stations[0]!
  const selectedProgress = state.stations[selected.id]
  const livePercent = state.activeJob?.stationId === selected.id ? Math.round(jobProgress(state, performance.now()) * 100) : percent
  const unlocked = Boolean(selectedProgress?.unlocked)
  const level = selectedProgress?.level ?? 0
  const nextCost = unlocked && level < selected.maxLevel ? levelCost(selected, level) : null
  const payoutNow = unlocked ? jobPayout(IDLE_CONFIG, selected.id, level) : 0
  const stage = stageIndex(level)

  const send = (stationId: string) => {
    setSelectedId(stationId)
    const seat = SEATS[stationId]
    if (!seat) return
    destRef.current = tileAt(seat.x, seat.y)
  }

  const buyFurni = (id: string) => {
    const item = CATALOG.find((entry) => entry.id === id)
    if (!item) return
    setLoadout((current) => {
      const owned = current.owned.includes(item.id) ? current : null
      if (!owned && stateRef.current.currency < item.cost) {
        setNotice(`Te faltan Loops para ${item.name}.`)
        return current
      }
      if (!owned) {
        const nextState = { ...stateRef.current, currency: stateRef.current.currency - item.cost }
        stateRef.current = nextState
        setState(nextState)
        saveIdle(localStorage, storageKey, nextState)
      }
      const next = {
        ...current,
        owned: current.owned.includes(item.id) ? current.owned : [...current.owned, item.id],
        [item.slot]: item.id,
      }
      saveFurni(localStorage, next)
      setNotice(item.blurb)
      return next
    })
  }

  const raise = () => {
    const now = performance.now()
    const result = levelUp(stateRef.current, IDLE_CONFIG, selected.id)
    if (!result.error) {
      blip(soundRef.current, 880)
      setBloomId(selected.id)
      window.setTimeout(() => setBloomId(null), 700)
      const reached = result.state.stations[selected.id]?.level ?? 0
      if (reached >= selected.maxLevel) {
        progressRef.current?.(progressReport("station-maxed", playerRef.current, { stationId: selected.id, loops: result.state.currency }))
      }
    }
    apply(result, now)
  }

  const fix = () => {
    const now = performance.now()
    const result = repairStation(stateRef.current, selected.id)
    if (!result.error) blip(soundRef.current, 520)
    apply(result, now)
  }

  const arm = (id: string) => {
    const now = performance.now()
    const result = buyGear(stateRef.current, id)
    if (!result.error) blip(soundRef.current, 660)
    apply(result, now)
  }

  if (!cast) {
    const preview = look.gender === 1 ? "/idle/f-idle.png" : "/idle/doll-idle.png"
    return (
      <div className="cast-screen">
        <div className="cast-screen-card">
          <p className="cast-kicker">ARCADANZ</p>
          <h1>Crea tu personaje</h1>
          <div className="cast-hero">
            <i style={{ backgroundImage: `url(${preview})` }} />
            <b style={{ backgroundImage: `url(${TEES[look.tee]?.mark ?? TEES[0].mark})` }} />
          </div>
          <div className="gender-row">
            <button type="button" className={look.gender === 0 ? "is-on" : ""} onClick={() => paint({ gender: 0 })}>
              Él
            </button>
            <button type="button" className={look.gender === 1 ? "is-on" : ""} onClick={() => paint({ gender: 1 })}>
              Ella
            </button>
          </div>
          <div className="look-row">
            <span>Piel</span>
            {SKINS.map((color, index) => (
              <button key={color} type="button" className={look.skin === index ? "swatch is-on" : "swatch"} style={{ background: color }} aria-label={`Piel ${index + 1}`} onClick={() => paint({ skin: index })} />
            ))}
          </div>
          <div className="look-row">
            <span>Pelo</span>
            {HAIRS.map((color, index) => (
              <button key={color} type="button" className={look.hair === index ? "swatch is-on" : "swatch"} style={{ background: color }} aria-label={`Pelo ${index + 1}`} onClick={() => paint({ hair: index })} />
            ))}
          </div>
          <div className="look-row">
            <span>Corte</span>
            {CUTS.map((name, index) => (
              <button key={name} type="button" className={look.cut === index ? "cut is-on" : "cut"} onClick={() => paint({ cut: index })}>
                {name}
              </button>
            ))}
          </div>
          <p className="cast-note">Camiseta de danzcollective.com. Se lee igual mirando a un lado o al otro.</p>
          <div className="tee-pick">
            {TEES.map((tee, index) => (
              <button key={tee.id} type="button" className={look.tee === index ? "tee-card is-on" : "tee-card"} aria-pressed={look.tee === index} onClick={() => paint({ tee: index })}>
                <img src={tee.image} alt="" />
                <span>{tee.name}</span>
              </button>
            ))}
          </div>
          <a className="cast-link" href={TEES[look.tee]?.href ?? TEES[0].href} target="_blank" rel="noreferrer">
            Ver esta camiseta en la tienda
          </a>
          <button
            type="button"
            className="danz-idle-go"
            onClick={() => {
              saveLook(localStorage, look)
              localStorage.setItem(CAST_KEY, "1")
              setCast(true)
            }}
          >
            Entrar al estudio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="danz-idle"
      onKeyDown={(event) => {
        const index = Number(event.key) - 1
        const station = IDLE_CONFIG.stations[index]
        if (station) setSelectedId(station.id)
        if (event.key === "Escape") onExit()
      }}
    >
      <header className="danz-idle-top">
        <img className="danz-idle-flower" src="/idle/danz-flower.svg" alt="" />
        <div className="danz-idle-title">
          <p>ARCADANZ</p>
          <h1>Idle Studio</h1>
          {player?.name ? <p>{player.name}</p> : null}
        </div>
        <em className="danz-idle-chip">{state.goods?.length ?? 0} en estante{shelfValue(state.goods ?? []) > 0 ? ` · ${shelfValue(state.goods ?? [])} Loops` : ""}</em>
        {(() => {
          const order = currentOrder(state.stations, state.ordersDone)
          return order ? <em className="danz-idle-chip">Encargo: {order.count} {order.product} · +{order.reward}</em> : null
        })()}
        {(state.smashed?.length ?? 0) > 0 && <em className="danz-idle-chip">{state.smashed.length} rotos</em>}
        <button type="button" className="danz-idle-ghost" onClick={() => setSheetOpen(true)}>
          Catálogo
        </button>
        <button type="button" className="danz-idle-ghost" aria-pressed={soundOn} onClick={() => setSoundOn((value) => !value)}>
          {soundOn ? "Sonido" : "Silencio"}
        </button>
        <button type="button" className="danz-idle-ghost" onClick={onExit}>
          Salir
        </button>
      </header>

      <div className="studio-view" ref={viewRef} onPointerDown={holdMove} aria-label="Toca el suelo para caminar.">
        <div className="studio-cam">
          <StudioMap
            progress={state.stations}
            selectedId={selected.id}
            activeId={state.activeJob?.stationId ?? null}
            percent={livePercent}
            worker={worker}
            footX={spot.current.x}
            footY={spot.current.y}
            quip={quip}
            working={Boolean(state.activeJob)}
            gain={gain}
            jobLabel={state.activeJob ? (stationById(IDLE_CONFIG, state.activeJob.stationId)?.job.verb ?? null) : null}
            bloomId={bloomId}
            busyIds={[
              state.activeJob?.stationId,
              ...(state.operatorJobs ?? []).filter((job) => !job.paused).map((job) => job.stationId),
            ].filter((id): id is string => Boolean(id))}
            look={look}
            loadout={loadout}
            mug={mug}
            rooms={rooms}
            idea={hintOpen ? (nextGoal(state) ?? notice ?? (ready ? coachLine(state) : null)) : null}
            onStation={send}
            sideIds={(state.operatorJobs ?? []).filter((job) => job.slot === "side").map((job) => job.who ?? "")}
            mains={(state.operatorJobs ?? []).filter((job) => (job.slot ?? "main") === "main").map((job) => job.stationId)}
            smashed={state.smashed ?? []}
            goods={(state.goods ?? []).map((item) => item.name)}
          />
        </div>
        {stick && (
          <div className="studio-stick" style={{ left: stick.x, top: stick.y }} aria-hidden="true">
            <b style={{ left: stick.kx - stick.x, top: stick.ky - stick.y }} />
          </div>
        )}
      </div>

      {sheetOpen && (
        <div className="piece-sheet">
          {/* Provisional: al cerrar el juego, esta pestaña sale. Las piezas pasan al gestor de salas y a la tienda de mobiliario. */}
          <header>
            <b>{sheetRoom === "music" ? "Piezas de Música" : sheetRoom === "fashion" ? "Piezas de Moda" : sheetRoom === "video" ? "Piezas de Vídeo" : sheetRoom === "print" ? "Piezas de Impresión" : sheetRoom === "cocina" ? "Piezas de Cocina" : sheetRoom === "sello" ? "Piezas del Sello" : sheetRoom === "seguridad" ? "Seguridad" : "Piezas de Sala"}</b>
            <div className="piece-tabs">
              <button type="button" className={sheetRoom === "music" ? "is-on" : ""} onClick={() => setSheetRoom("music")}>Música</button>
              <button type="button" className={sheetRoom === "fashion" ? "is-on" : ""} onClick={() => setSheetRoom("fashion")}>Moda</button>
              <button type="button" className={sheetRoom === "video" ? "is-on" : ""} onClick={() => setSheetRoom("video")}>Vídeo</button>
              <button type="button" className={sheetRoom === "print" ? "is-on" : ""} onClick={() => setSheetRoom("print")}>Impresión</button>
              <button type="button" className={sheetRoom === "cocina" ? "is-on" : ""} onClick={() => setSheetRoom("cocina")}>Cocina</button>
              <button type="button" className={sheetRoom === "sala" ? "is-on" : ""} onClick={() => setSheetRoom("sala")}>Sala</button>
              <button type="button" className={sheetRoom === "sello" ? "is-on" : ""} onClick={() => setSheetRoom("sello")}>Sello</button>
              <button type="button" className={sheetRoom === "seguridad" ? "is-on" : ""} onClick={() => setSheetRoom("seguridad")}>Seguridad</button>
              <button type="button" onClick={() => setSheetOpen(false)}>Cerrar</button>
            </div>
          </header>
          <div className="piece-grid">
            {sheetRoom === "seguridad" ? (
              <>
                <article className="piece-note">
                  <strong>Plan</strong>
                  <span>La rata entra desde el principio. Mono se contrata al 12 de Música, en la puerta, y recorre el estudio. El equipo se compra y ya vale.</span>
                </article>
                {SECURITY_GEAR.map((item) => (
                  <article key={item.id}>
                    <strong>{item.cost}</strong>
                    <span>{item.name}</span>
                    <div>
                      <img src={item.src} alt="" />
                    </div>
                  </article>
                ))}
              </>
            ) : Array.from({ length: sheetRoom === "cocina" ? 8 : sheetRoom === "sala" ? 10 : 60 }, (_, index) => {
              const level = index + 1
              const piece = sheetRoom === "music" ? musicSheet(level) : sheetRoom === "fashion" ? fashionSheet(level) : sheetRoom === "video" ? videoSheet(level) : sheetRoom === "print" ? printSheet(level) : sheetRoom === "cocina" ? cocinaSheet(level) : sheetRoom === "sello" ? selloSheet(level) : salaSheet(level)
              return (
                <article key={level}>
                  <strong>{level}</strong>
                  <span>{piece?.name ?? "Sin pieza nueva"}</span>
                  <div>
                    {piece?.srcs.map((src, srcIndex) => (
                      <img key={`${level}-${srcIndex}`} src={src} alt="" />
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      <section className="danz-idle-bench" aria-label={lookOpen ? "Aspecto del muñeco" : selected.name}>
        <div className="danz-idle-balance">
          <span>Saldo de prueba</span>
          <strong>
            {state.currency}
            <small> {IDLE_CONFIG.currency.name}</small>
          </strong>
          <span>{state.goods?.length ?? 0} en estante · {unlockedOperators(state.stations).length} operadores</span>
          <button type="button" className="danz-idle-ghost look-open" onClick={() => setShopOpen((value) => !value)}>
            Tienda
          </button>
          <button type="button" className="danz-idle-ghost look-open" onClick={() => setSheetOpen((value) => !value)}>
            {sheetOpen ? "Cerrar piezas" : "Piezas 1–60"}
          </button>
          <button type="button" className="danz-idle-ghost look-open" onClick={() => setLookOpen((value) => !value)}>
            {lookOpen ? "Volver" : "Aspecto"}
          </button>
        </div>
        {shopOpen && (
          <div className="hb-shop">
            <p>La silla y la mesa que compras valen en el puesto donde te sientas tú. Van más rápido.</p>
            {CATALOG.map((item) => {
              const owned = loadout.owned.includes(item.id)
              const equipped = loadout[item.slot] === item.id
              return (
                <button key={item.id} type="button" className={equipped ? "is-on" : ""} onClick={() => buyFurni(item.id)}>
                  <strong>{item.name}</strong>
                  <small>{equipped ? "Puesto en la sala" : owned ? "Poner" : `${item.cost} Loops`}</small>
                </button>
              )
            })}
          </div>
        )}
        {lookOpen ? (
          <div className="look-sheet">
            <div className="look-row">
              <span>Piel</span>
              {SKINS.map((color, index) => (
                <button
                  key={color}
                  type="button"
                  className={look.skin === index ? "swatch is-on" : "swatch"}
                  style={{ background: color }}
                  aria-label={`Piel ${index + 1}`}
                  aria-pressed={look.skin === index}
                  onClick={() => paint({ skin: index })}
                />
              ))}
            </div>
            <div className="look-row">
              <span>Pelo</span>
              {HAIRS.map((color, index) => (
                <button
                  key={color}
                  type="button"
                  className={look.hair === index ? "swatch is-on" : "swatch"}
                  style={{ background: color }}
                  aria-label={`Pelo ${index + 1}`}
                  aria-pressed={look.hair === index}
                  onClick={() => paint({ hair: index })}
                />
              ))}
            </div>
            <div className="look-row">
              <span>Corte</span>
              {CUTS.map((name, index) => (
                <button key={name} type="button" className={look.cut === index ? "cut is-on" : "cut"} aria-pressed={look.cut === index} onClick={() => paint({ cut: index })}>
                  {name}
                </button>
              ))}
            </div>
            <div className="look-row">
              <span>Camiseta</span>
              {TEES.map((tee, index) => (
                <button
                  key={tee.id}
                  type="button"
                  className={look.tee === index ? "tee is-on" : "tee"}
                  aria-label={tee.name}
                  aria-pressed={look.tee === index}
                  onClick={() => paint({ tee: index })}
                >
                  <img src={tee.image} alt="" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h2>
              {selected.name}
              <small> {unlocked ? `nivel ${level}` : "cerrado"}</small>
            </h2>
            <p className="danz-idle-summary">{unlocked ? selected.summary : unlockHint(IDLE_CONFIG, selected)}</p>
            {unlocked && (selected.id === "music" || selected.id === "fashion" || selected.id === "video" || selected.id === "print" || selected.id === "cocina" || selected.id === "sala" || selected.id === "sello" || selected.id === "seguridad") && (
              <div className="room-picks">
                <span>Suelo</span>
                {FLOOR_COLORS.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={rooms[selected.id as RoomId].floor === index ? "swatch is-on" : "swatch"}
                    style={{ background: color }}
                    aria-label={FLOOR_NAMES[index]}
                    aria-pressed={rooms[selected.id as RoomId].floor === index}
                    onClick={() => setRooms((current) => {
                      const id = selected.id as RoomId
                      const next = { ...current, [id]: { ...current[id], floor: index } }
                      try { saveRoomStyle(localStorage, next) } catch { /* sigue en memoria */ }
                      return next
                    })}
                  />
                ))}
                <span>Pared</span>
                {WALL_COLORS.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={rooms[selected.id as RoomId].wall === index ? "swatch is-on" : "swatch"}
                    style={{ background: color }}
                    aria-label={WALL_NAMES[index]}
                    aria-pressed={rooms[selected.id as RoomId].wall === index}
                    onClick={() => setRooms((current) => {
                      const id = selected.id as RoomId
                      const next = { ...current, [id]: { ...current[id], wall: index } }
                      try { saveRoomStyle(localStorage, next) } catch { /* sigue en memoria */ }
                      return next
                    })}
                  />
                ))}
              </div>
            )}
            {unlocked && selected.id === "music" && (
              <p className="danz-idle-summary">
                Se ve: {musicSeen(level)}. {musicSoon(level)} Cada nivel resta 0,2 s, hasta un suelo de 1,4 s. Los Loops se cobran en Envíos.{nextCost !== null ? ` El siguiente cuesta ${nextCost} Loops.` : ""} Producto: {productName("music", level)}. USB hasta el 20, vinilo hasta el 40, vinilo de platino desde el 41. Luitzmi entra al 30 y Chicharro al 60.
              </p>
            )}
            {unlocked && selected.id === "video" && (
              <p className="danz-idle-summary">
                Tareas: maldito StoryBoard, que frío hacía grabando, Edita idiota, Color, Exportando (7semanas) y Maldito cliente. Producto: {productName("video", level)}. Clip hasta el 20, vídeo hasta el 40, campaña desde el 41.
              </p>
            )}
            {unlocked && selected.id === "fashion" && (
              <p className="danz-idle-summary">
                Producto: {fashionProduct(level)}. Club House Tee hasta el 12, Disco Culture Tee hasta el 24, Tracks & Cocktails Tee hasta el 36, Yepo Bag hasta el 48 y YEPO SWIM SHORT desde el 49.
                {(() => {
                  const piece = florByTitle(flor, fashionProduct(level))
                  if (!piece) return null
                  return (
                    <>
                      {" "}
                      <a href={piece.href} target="_blank" rel="noreferrer">
                        {piece.available ? `${euros(piece.priceCents)} en la tienda` : "Agotada en la tienda"}
                      </a>
                    </>
                  )
                })()}
              </p>
            )}
            {unlocked && selected.id === "print" && (
              <p className="danz-idle-summary">
                Los Primos Brothers venden {printProduct(level)}. Mechero sin llama, papel doblado, el perro del vecino, un prototipo de encargo y, al final, el trofeo al segundo puesto.
              </p>
            )}
            {unlocked && selected.id === "cocina" && (
              <p className="danz-idle-summary">
                Ocho niveles. No deja producto en el estante. Al 4 se abre la Sala.
                <button type="button" className="danz-idle-ghost" onClick={() => setMug((value) => {
                  const next = (value + 1) % 3
                  try { localStorage.setItem("danz-mugs", String(next)) } catch { /* sigue en memoria */ }
                  return next
                })}>Cambiar tazas</button>
              </p>
            )}
            {unlocked && selected.id === "sala" && (
              <p className="danz-idle-summary">
                Diez niveles. Sofá, pista y consola. Al 6, Lux sale de la sala y termina la toma que dejas a medias.
              </p>
            )}
            {unlocked && selected.id === "sello" && (
              <p className="danz-idle-summary">
                Single hasta el 20, EP hasta el 40, disco desde el 41. León se queda al 30. Tomy abre el otro puesto al 60.
              </p>
            )}
            {(state.smashed ?? []).includes(selected.id) && (
              <button type="button" className="danz-idle-go" disabled={state.currency < 20} onClick={fix}>
                Arreglar {selected.name}
                <small>20 {IDLE_CONFIG.currency.name}</small>
              </button>
            )}
            {unlocked && selected.id === "seguridad" && (
              <div className="gear-shop">
                <p className="danz-idle-summary">
                  Mono se contrata al abrir esta sala y ronda el estudio. Cada pieza se compra una vez. No sube de nivel. Mientras está, el pasillo no corta la toma.
                </p>
                {SECURITY_GEAR.map((item) => {
                  const owned = (state.gear ?? []).includes(item.id)
                  return (
                    <button key={item.id} type="button" className="gear-buy" disabled={owned || state.currency < item.cost} onClick={() => arm(item.id)}>
                      <img src={item.src} alt="" />
                      <span>{item.name}</span>
                      <small>{owned ? "Lo lleva" : `${item.cost} Loops`}</small>
                    </button>
                  )
                })}
              </div>
            )}
            {unlocked && selected.id !== "envios" && selected.id !== "music" && selected.id !== "fashion" && selected.id !== "print" && selected.id !== "cocina" && selected.id !== "sala" && selected.id !== "sello" && selected.id !== "seguridad" && (
              <p className="danz-idle-summary">
                Ahora fabrica {productName(selected.id, level)} (tramo {productTier(level)} de 3). Cambia en los niveles 21 y 41. Cada nivel añade una pieza al puesto.
              </p>
            )}
            {unlocked && selected.id === "envios" && (
              <p className="danz-idle-summary">
                Estante: {state.goods?.length ?? 0}. Empaquetar cobra Loops.
              </p>
            )}
            {unlocked && selected.id !== "envios" && selected.id !== "music" && selected.id !== "fashion" && selected.id !== "video" && selected.id !== "print" && selected.id !== "cocina" && selected.id !== "sala" && selected.id !== "sello" && selected.id !== "seguridad" && (
              <p className="danz-idle-summary">
                Se ve: {STAGE_NAME[selected.id]?.[Math.min(stage, (STAGE_NAME[selected.id]?.length ?? 1) - 1)]}. +{payoutNow} cada {(jobDuration(IDLE_CONFIG, selected.id, level) / 1000).toFixed(1)} s. {STAGE_NEXT[selected.id]?.[Math.min(stage, (STAGE_NEXT[selected.id]?.length ?? 1) - 1)]}
              </p>
            )}
            {nextCost !== null ? (
              <button type="button" className="danz-idle-go" disabled={!ready || state.currency < nextCost} onClick={raise}>
                Subir a nivel {level + 1}
                <small>
                  {nextCost} {IDLE_CONFIG.currency.name}
                  {selected.id === "envios" ? " · empaquetas más rápido" : !PRODUCERS.has(selected.id) ? " · no fabrica, solo mejora la sala" : selected.id === "music" ? ((level + 1) % 2 === 0 ? " · entra una pieza" : " · la sala no cambia") : " · el puesto gana una pieza más"}
                </small>
              </button>
            ) : (
              <button type="button" className="danz-idle-go" disabled>
                {unlocked ? (PRODUCERS.has(selected.id) ? "Puesto al máximo" : "Sala al máximo") : "Cerrado"}
              </button>
            )}
            {state.activeJob?.stationId === selected.id && (
              <span className="bench-meter" aria-hidden="true">
                <i style={{ width: `${livePercent}%` }} />
              </span>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export { DanzIdleStudio }
