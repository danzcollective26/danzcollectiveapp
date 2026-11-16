import { SECURITY_GEAR } from "./security-gear.ts"
import { stationHome } from "./habbo-room.ts"
import { IDLE_CONFIG, stationById, type IdleConfig, type StationConfig, type UnlockRule } from "./idle-config.ts"
import type { IdleProgressEvent } from "./contract.ts"
import {
  PACK_SIZE,
  PRODUCERS,
  SHELF_LIMIT,
  productName,
  productTier,
  productValue,
  unlockedOperators,
  type Good,
} from "./products.ts"
import { orderBonus } from "./orders.ts"
import { musicIdea } from "./music-look.ts"

export type Milestone = IdleProgressEvent["milestone"]

export type StationProgress = {
  unlocked: boolean
  level: number
  jobsCompleted: number
}

export type ActiveJob = {
  stationId: string
  startedAt: number
  durationMs: number
  totalMs: number
  payout: number
  paused: boolean
  remainingMs: number
  /** Cuántos productos se llevan si el trabajo es Envíos. */
  packed?: number
  /** main es la mesa del jugador. tommy es el segundo puesto. */
  slot?: "main" | "side" | "cover"
  who?: string
}

export type IdleState = {
  schemaVersion: 1
  currency: number
  stations: Record<string, StationProgress>
  activeJob: ActiveJob | null
  milestonesEmitted: Milestone[]
  /** Trabajos de los operadores. Solo existen en espacios al nivel máximo. */
  operatorJobs: ActiveJob[]
  /** Producto fabricado, a la espera de Envíos. */
  goods: Good[]
  /** Equipo comprado para Mono. No tiene nivel. */
  gear: string[]
  /** Puestos rotos por la rata. No fabrican hasta pagar el arreglo. */
  smashed: string[]
  /** Encargados que deben volver cuando la mesa deje de estar rota. */
  duty?: string[]
  /** Encargos ya cobrados. No se repiten. */
  ordersDone?: string[]
}

export type EngineResult = {
  state: IdleState
  error: string | null
  completedJob: { stationId: string; payout: number; made: string | null } | null
  newMilestones: Milestone[]
  filledOrders?: string[]
}

const MILESTONES: Milestone[] = ["first-upgrade", "fashion-unlocked"]

function unchanged(state: IdleState, error: string | null = null): EngineResult {
  return { state, error, completedJob: null, newMilestones: [] }
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function ruleMet(state: IdleState, rule: UnlockRule): boolean {
  const station = state.stations[rule.stationId]
  return Boolean(station && station.level >= rule.level)
}

export function isStationUnlocked(_config: IdleConfig, state: IdleState, station: StationConfig): boolean {
  if (!station.playable) return false
  if (station.startsUnlocked) return true
  return station.unlock.every((rule) => ruleMet(state, rule))
}

export function recomputeUnlocks(state: IdleState, config: IdleConfig = IDLE_CONFIG): IdleState {
  const stations: Record<string, StationProgress> = {}
  for (const station of config.stations) {
    const current = state.stations[station.id]
    if (!current) continue
    const unlocked = isStationUnlocked(config, state, station)
    stations[station.id] = {
      jobsCompleted: current.jobsCompleted,
      unlocked,
      level: unlocked ? Math.max(1, Math.min(station.maxLevel, current.level)) : 0,
    }
  }
  let activeJob = state.activeJob
  if (activeJob && !stations[activeJob.stationId]?.unlocked) activeJob = null
  const operatorJobs = (state.operatorJobs ?? []).filter((job) => {
    const station = stationById(config, job.stationId)
    const progress = stations[job.stationId]
    return Boolean(station && progress?.unlocked && progress.level >= 1)
  })
  return { ...state, stations, activeJob, operatorJobs, goods: state.goods ?? [] }
}

function qualifies(state: IdleState, milestone: Milestone): boolean {
  if (milestone === "first-upgrade") return Object.values(state.stations).some((station) => station.level >= 2)
  return Boolean(state.stations.fashion?.unlocked)
}

function applyMilestoneFlags(state: IdleState): { state: IdleState; fresh: Milestone[] } {
  const fresh = MILESTONES.filter(
    (milestone) => qualifies(state, milestone) && !state.milestonesEmitted.includes(milestone),
  )
  if (fresh.length === 0) return { state, fresh }
  return { state: { ...state, milestonesEmitted: [...state.milestonesEmitted, ...fresh] }, fresh }
}

export function createInitialState(config: IdleConfig = IDLE_CONFIG): IdleState {
  const stations: Record<string, StationProgress> = {}
  for (const station of config.stations) {
    const unlocked = station.playable && station.startsUnlocked
    stations[station.id] = { unlocked, level: unlocked ? 1 : 0, jobsCompleted: 0 }
  }
  return { schemaVersion: 1, currency: 0, stations, activeJob: null, operatorJobs: [], goods: [], gear: [], smashed: [], duty: [], ordersDone: [], milestonesEmitted: [] }
}

export function levelCost(station: StationConfig, level: number): number {
  return station.baseCost * Math.max(1, level)
}

export function jobPayout(config: IdleConfig, stationId: string, level: number): number {
  const station = stationById(config, stationId)
  if (!station || level < 1) return 0
  return station.payout + (level - 1) * station.payoutPerLevel
}

export function jobDuration(config: IdleConfig, stationId: string, level: number): number {
  const station = stationById(config, stationId)
  if (!station || level < 1) return 0
  return Math.max(config.minimumJobMs, station.durationMs - (level - 1) * station.durationCutMs)
}

export function unlockHint(config: IdleConfig, station: StationConfig): string {
  if (!station.playable) return station.summary
  if (station.startsUnlocked || station.unlock.length === 0) return ""
  const parts = station.unlock.map((rule) => {
    const name = stationById(config, rule.stationId)?.name ?? rule.stationId
    return `${name} llegue al nivel ${rule.level}`
  })
  return `Se abre cuando ${parts.join(" y ")}.`
}

export function coachLine(state: IdleState, config: IdleConfig = IDLE_CONFIG): string {
  const music = stationById(config, "music")
  const musicState = state.stations.music
  const name = config.currency.name
  if (!music || !musicState) return "Toca una mesa del taller."
  if (state.activeJob) {
    const working = stationById(config, state.activeJob.stationId)
    return working ? `Trabaja en ${working.name}.` : "El trabajo sigue en marcha."
  }
  if ((state.goods?.length ?? 0) > 0) return "Hay producto en el estante. Acércalo a Envíos para cobrar."
  const operator = state.operatorJobs?.find((job) => !job.paused)
  if (operator) {
    const name = stationById(config, operator.stationId)?.name ?? "ese espacio"
    return `El operador de ${name} sigue en su puesto. Puedes ir a otro espacio.`
  }
  if (musicState.level < 2) {
    const cost = levelCost(music, musicState.level)
    if (state.currency >= cost) return `Ya puedes subir Música al nivel 2 por ${cost} ${name}.`
    return "Toca una baldosa y el muñeco camina hasta ella. La silla roja es Música."
  }
  const locked = config.stations.find((station) => !state.stations[station.id]?.unlocked)
  if (locked) {
    const rule = locked.unlock[0]
    if (rule) {
      const host = state.stations[rule.stationId]
      const hostName = stationById(config, rule.stationId)?.name ?? rule.stationId
      const left = Math.max(0, rule.level - (host?.level ?? 0))
      if (left > 0) return `Sube ${hostName} al nivel ${rule.level} para abrir ${locked.name}.`
    }
  }
  return "Toca una mesa libre. El personaje va solo."
}

/** Una sola pista, corta. No se repite sola ni tapa el juego. */
export function nextGoal(state: IdleState, config: IdleConfig = IDLE_CONFIG): string | null {
  const broken = state.smashed?.[0]
  if (broken) {
    const name = stationById(config, broken)?.name ?? "Un puesto"
    return `Pista: ${name} está roto. Arréglalo por 20.`
  }
  const waiting = state.goods?.length ?? 0
  if (waiting >= SHELF_LIMIT) return "Pista: el estante está lleno. Sin Envíos, dejas de fabricar."
  const musicLevel = state.stations.music?.level ?? 1
  const door = config.stations.find((station) => station.playable && !station.startsUnlocked && !state.stations[station.id]?.unlocked && station.unlock[0])
  const rule = door?.unlock[0]
  const host = rule ? stationById(config, rule.stationId) : undefined
  const hostProgress = rule ? state.stations[rule.stationId] : undefined
  const doorOpen = Boolean(door && host && hostProgress?.unlocked && hostProgress.level < rule!.level && hostProgress.level < host.maxLevel)
  if (doorOpen && host && hostProgress && rule && state.currency >= levelCost(host, hostProgress.level)) {
    return `Pista: subir ${host.name} al ${hostProgress.level + 1}. Al ${rule.level} se abre ${door!.name}.`
  }
  const gateCost = doorOpen && host && hostProgress ? levelCost(host, hostProgress.level) : 0
  if (waiting > 0 && state.currency < gateCost) {
    if (waiting >= 4) return `Pista: hay ${waiting} en el estante. Envíos está al fondo de Música.`
    return `Pista: faltan ${4 - waiting} para una caja. Luego cobras en Envíos.`
  }
  const fresh = config.stations.find((station) => {
    if (station.startsUnlocked) return false
    const progress = state.stations[station.id]
    return Boolean(progress?.unlocked && progress.level === 1 && progress.jobsCompleted === 0)
  })
  if (fresh) return `Pista: ${fresh.name} ya está abierta.`
  if (doorOpen && host && rule && host.id !== "music") {
    return `Pista: subir ${host.name} al ${rule.level} y se abre ${door!.name}.`
  }
  const idea = musicIdea(musicLevel)
  if (idea) return idea
  if (door && rule) {
    return `Pista: subir ${host?.name ?? "el puesto"} al ${rule.level} y se abre ${door.name}.`
  }
  const growing = config.stations.find((station) => {
    const progress = state.stations[station.id]
    return progress?.unlocked && progress.level < station.maxLevel
  })
  if (growing) return `Pista: lleva ${growing.name} al máximo y entra quien lo lleva.`
  return null
}

/** Sin Mono siempre entran. Con Mono, cada pieza comprada sube la probabilidad de echarlos. */
export function raidPlan(hired: boolean, gearCount: number, currency: number, roll: number): { stop: boolean; take: number } | null {
  if (currency <= 0) return null
  const chance = Math.min(0.9, 0.35 + Math.max(0, gearCount) * 0.08)
  const stop = hired && roll < chance
  const take = Math.max(1, Math.floor(currency * (hired ? 0.04 : 0.1)))
  return { stop, take }
}

export function jobProgress(state: IdleState, now: number): number {
  const job = state.activeJob
  if (!job || job.totalMs <= 0) return 0
  if (job.paused) return clamp01(1 - job.remainingMs / job.totalMs)
  if (!Number.isFinite(now)) return 0
  return clamp01((now - job.startedAt) / job.durationMs)
}

export function handoff(state: IdleState, stationId: string): { covered: boolean; slot: "main" | "cover"; notice: string } {
  const crew = unlockedOperators(state.stations).filter((operator) => operator.stationId === stationId)
  const lead = crew.find((operator) => operator.post === "main")
  const sides = crew.filter((operator) => operator.post === "side")
  const lux = (state.stations.sala?.level ?? 0) >= 6 && Boolean(state.stations.sala?.unlocked)
  if (lead) {
    const extra = sides.length
      ? ` ${sides.map((operator) => operator.name).join(" y ")} ${sides.length > 1 ? "siguen" : "sigue"} en la suya.`
      : ""
    return { covered: true, slot: "main", notice: `${lead.name} se queda a los mandos.${extra}` }
  }
  if (lux) return { covered: true, slot: "cover", notice: "Lux termina esta toma." }
  return { covered: false, slot: "main", notice: "Sales de la sala. La mesa para." }
}

export function releaseStation(state: IdleState, covered: boolean, slot: "main" | "cover" = "main"): IdleState {
  const job = state.activeJob
  if (!job) return state
  if (!covered) return { ...state, activeJob: null }
  if (state.operatorJobs?.some((running) => running.stationId === job.stationId && (running.slot ?? "main") === slot)) {
    return { ...state, activeJob: null }
  }
  const duty = slot === "main" ? Array.from(new Set([...(state.duty ?? []), job.stationId])) : state.duty
  return { ...state, activeJob: null, operatorJobs: [...(state.operatorJobs ?? []), { ...job, slot }], ...(duty ? { duty } : {}) }
}

export function leaveRoom(state: IdleState, config: IdleConfig, roomId: string, now: number): { state: IdleState; notice: string | null } {
  const job = state.activeJob
  if (!job || stationHome(job.stationId) !== roomId) return { state, notice: null }
  if (job.stationId === "envios") {
    let next = releaseStation(state, true, "cover")
    const lead = unlockedOperators(next.stations).find((operator) => operator.stationId === roomId && operator.post === "main")
    if (!lead) return { state: next, notice: "La caja termina sola." }
    const seated = startJob(next, config, roomId, now)
    if (seated.error || !seated.state.activeJob) return { state: next, notice: "La caja termina sola." }
    next = releaseStation(seated.state, true, "main")
    return { state: next, notice: `${lead.name} sigue grabando. La caja termina sola.` }
  }
  const pass = handoff(state, job.stationId)
  return { state: releaseStation(state, pass.covered, pass.slot), notice: pass.notice }
}

export function takeControls(state: IdleState, stationId: string): IdleState {
  const running = state.operatorJobs?.find((job) => job.stationId === stationId && (job.slot ?? "main") !== "side")
  if (!running || state.activeJob) return state
  return {
    ...state,
    activeJob: running,
    operatorJobs: (state.operatorJobs ?? []).filter((job) => job !== running),
    duty: (state.duty ?? []).filter((id) => id !== stationId),
  }
}

export function startJob(state: IdleState, config: IdleConfig, stationId: string, now: number): EngineResult {
  if (!Number.isFinite(now)) return unchanged(state, "El reloj del trabajo no es válido.")
  if (state.activeJob) return unchanged(state, "Termina el trabajo en curso antes de mandarlo a otra mesa.")
  if (state.operatorJobs?.some((job) => job.stationId === stationId && (job.slot ?? "main") !== "side")) return unchanged(state)
  const station = stationById(config, stationId)
  const progress = state.stations[stationId]
  if (!station || !progress?.unlocked || !station.playable) return unchanged(state, "Esa mesa no está abierta.")
  if ((state.smashed ?? []).includes(stationId)) {
    return unchanged(state, "Está roto. Arréglalo por 20 Loops.")
  }
  if (station.id === "envios" && (state.goods?.length ?? 0) === 0) {
    return unchanged(state, "No hay producto para empaquetar.")
  }
  if (PRODUCERS.has(station.id) && (state.goods?.length ?? 0) >= SHELF_LIMIT) {
    return unchanged(state, "El estante está lleno. Cobra en Envíos.")
  }
  const packed = station.id === "envios" ? Math.min(PACK_SIZE, state.goods.length) : 0
  const payout = station.id === "envios"
    ? state.goods.slice(0, packed).reduce((sum, good) => sum + productValue(good.tier), 0)
    : 0
  const durationMs = jobDuration(config, stationId, Math.max(1, progress.level)) * ((state.smashed ?? []).includes(stationId) ? 2 : 1)
  return {
    state: {
      ...state,
      activeJob: {
        stationId,
        startedAt: now,
        durationMs,
        totalMs: durationMs,
        payout,
        paused: false,
        remainingMs: durationMs,
        packed,
      },
    },
    error: null,
    completedJob: null,
    newMilestones: [],
  }
}

function makeJob(config: IdleConfig, stationId: string, level: number, now: number, goods: Good[], smashed: string[] = []): ActiveJob {
  const packed = stationId === "envios" ? Math.min(PACK_SIZE, goods.length) : 0
  const payout = stationId === "envios"
    ? goods.slice(0, packed).reduce((sum, good) => sum + productValue(good.tier), 0)
    : 0
  const durationMs = jobDuration(config, stationId, Math.max(1, level)) * (smashed.includes(stationId) ? 2 : 1)
  return {
    stationId,
    startedAt: now,
    durationMs,
    totalMs: durationMs,
    payout,
    paused: false,
    remainingMs: durationMs,
    packed,
  }
}

function finishCraft(goods: Good[], stationId: string, level: number): { goods: Good[]; made: string | null } {
  if (stationId === "envios") return { goods, made: null }
  const made = productName(stationId, level)
  if (goods.length >= SHELF_LIMIT) return { goods, made: null }
  return { goods: [...goods, { stationId, tier: productTier(level), name: made }], made }
}

export function settle(state: IdleState, config: IdleConfig, now: number, speed = 1): EngineResult {
  const job = state.activeJob
  let currency = state.currency
  let stations = state.stations
  let goods = state.goods ?? []
  let ordersDone = [...(state.ordersDone ?? [])]
  const filledOrders: string[] = []
  let activeJob = job
  let changed = false
  const completed: { stationId: string; payout: number; made: string | null }[] = []
  const resumeAt = new Map<string, number>()

  const close = (running: ActiveJob) => {
    const progress = stations[running.stationId]
    const level = progress?.level ?? 1
    if (progress) {
      stations = { ...stations, [running.stationId]: { ...progress, jobsCompleted: progress.jobsCompleted + 1 } }
    }
    if (running.stationId === "envios") {
      const shipped = goods.slice(0, running.packed || 0)
      const bonus = orderBonus(stations, ordersDone, shipped)
      if (bonus) {
        currency += bonus.reward
        ordersDone = [...ordersDone, bonus.id]
        filledOrders.push(bonus.id)
      }
      currency += running.payout
      goods = goods.slice(running.packed || 0)
      completed.push({ stationId: running.stationId, payout: running.payout + (bonus?.reward ?? 0), made: null })
    } else if (!PRODUCERS.has(running.stationId)) {
      completed.push({ stationId: running.stationId, payout: 0, made: null })
    } else if ((state.smashed ?? []).includes(running.stationId)) {
      completed.push({ stationId: running.stationId, payout: 0, made: null })
    } else {
      const crafted = finishCraft(goods, running.stationId, level)
      goods = crafted.goods
      completed.push({ stationId: running.stationId, payout: 0, made: crafted.made })
    }
    resumeAt.set(running.stationId, running.startedAt + running.durationMs)
    changed = true
  }

  const finished = (running: ActiveJob) => !running.paused && Number.isFinite(now) && now >= running.startedAt + running.durationMs

  if (job && finished(job)) {
    close(job)
    activeJob = null
  }

  let operatorJobs: ActiveJob[] = [...(state.operatorJobs ?? [])]
  const onDuty = new Set([
    ...(state.duty ?? []),
    ...operatorJobs.filter((item) => (item.slot ?? "main") === "main").map((item) => item.stationId),
  ])
  let guard = 0
  while (guard < 8) {
    guard += 1
    let closed = false
    const kept: ActiveJob[] = []
    for (const running of operatorJobs) {
      if ((state.smashed ?? []).includes(running.stationId)) {
        changed = true
        continue
      }
      if (!finished(running)) {
        kept.push(running)
        continue
      }
      close(running)
      closed = true
    }
    operatorJobs = kept
    if (!closed && guard > 1) break

    const pace = (next: ActiveJob): ActiveJob => {
      if (speed === 1) return next
      const durationMs = Math.max(900, Math.round(next.durationMs * speed))
      return { ...next, durationMs, totalMs: durationMs, remainingMs: durationMs }
    }
    const clock = (stationId: string) => resumeAt.get(stationId) ?? (Number.isFinite(now) ? now : 0)
    const busy = new Set(operatorJobs.filter((item) => (item.slot ?? "main") === "main").map((item) => item.stationId))
    if (activeJob) busy.add(activeJob.stationId)
    const roster = unlockedOperators(stations)
    let spawned = false
    for (const operator of roster) {
      if (operator.post === "side") continue
      if (!onDuty.has(operator.stationId)) continue
      if (busy.has(operator.stationId)) continue
      const progress = stations[operator.stationId]
      if (!progress?.unlocked || progress.level < 1) continue
      if ((state.smashed ?? []).includes(operator.stationId)) continue
      if (operator.role === "pack") {
        if (goods.length === 0) continue
        operatorJobs.push(pace(makeJob(config, operator.stationId, progress.level, clock(operator.stationId), goods, state.smashed ?? [])))
        busy.add(operator.stationId)
        spawned = true
        changed = true
        continue
      }
      if (goods.length >= SHELF_LIMIT) continue
      if (!PRODUCERS.has(operator.stationId)) continue
      operatorJobs.push(pace(makeJob(config, operator.stationId, progress.level, clock(operator.stationId), goods, state.smashed ?? [])))
      busy.add(operator.stationId)
      spawned = true
      changed = true
    }
    for (const operator of roster) {
      if (operator.post !== "side") continue
      if (!PRODUCERS.has(operator.stationId)) continue
      if ((state.smashed ?? []).includes(operator.stationId)) continue
      const sideOn = operatorJobs.some((running) => running.slot === "side" && running.who === operator.name)
      if (sideOn || goods.length >= SHELF_LIMIT) continue
      const progress = stations[operator.stationId]
      operatorJobs.push({
        ...pace(makeJob(config, operator.stationId, progress?.level ?? 1, clock(operator.stationId), goods, state.smashed ?? [])),
        slot: "side",
        who: operator.name,
      })
      spawned = true
      changed = true
    }
    if (!closed || !spawned) break
  }

  const payout = completed.reduce((sum, item) => sum + item.payout, 0)
  const made = completed.map((item) => item.made).filter((name): name is string => Boolean(name))
  if (!changed) return unchanged(state)
  const unlocked = recomputeUnlocks({ ...state, currency, stations, activeJob, operatorJobs, goods, ordersDone }, config)
  const flagged = applyMilestoneFlags(unlocked)
  return {
    state: flagged.state,
    error: null,
    completedJob: completed.length
      ? { stationId: completed[0]!.stationId, payout, made: made.length ? made.join(" · ") : null }
      : null,
    newMilestones: flagged.fresh,
    filledOrders,
  }
}

export function applyRaid(state: IdleState, stationId: string, take: number, stopped: boolean): EngineResult {
  if (stopped) return unchanged(state)
  const stolen = Math.max(0, Math.min(Math.floor(take), state.currency))
  const smashed = state.smashed ?? []
  return {
    state: {
      ...state,
      currency: state.currency - stolen,
      smashed: smashed.includes(stationId) ? smashed : [...smashed, stationId],
    },
    error: null,
    completedJob: null,
    newMilestones: [],
  }
}

export function repairStation(state: IdleState, stationId: string): EngineResult {
  if (!(state.smashed ?? []).includes(stationId)) return unchanged(state, "Ese puesto no está roto.")
  const cost = 20
  if (state.currency < cost) return unchanged(state, `No llegan los ${IDLE_CONFIG.currency.name}.`)
  return {
    state: { ...state, currency: state.currency - cost, smashed: state.smashed.filter((id) => id !== stationId) },
    error: null,
    completedJob: null,
    newMilestones: [],
  }
}

export function buyGear(state: IdleState, id: string): EngineResult {
  const item = SECURITY_GEAR.find((piece) => piece.id === id)
  if (!item) return unchanged(state, "Eso no está en la tienda.")
  if (!state.stations.seguridad?.unlocked) return unchanged(state, "Primero contrata a Mono.")
  if ((state.gear ?? []).includes(id)) return unchanged(state, "Mono ya lo lleva.")
  if (state.currency < item.cost) return unchanged(state, `No llegan los ${IDLE_CONFIG.currency.name}.`)
  return {
    state: { ...state, currency: state.currency - item.cost, gear: [...(state.gear ?? []), id] },
    error: null,
    completedJob: null,
    newMilestones: [],
  }
}

export function levelUp(state: IdleState, config: IdleConfig, stationId: string): EngineResult {
  const station = stationById(config, stationId)
  const progress = state.stations[stationId]
  if (!station || !progress?.unlocked || !station.playable) return unchanged(state, "Esa mesa no está abierta.")
  if (progress.level >= station.maxLevel) return unchanged(state, "Esa mesa ya está al máximo.")
  const cost = levelCost(station, progress.level)
  if (state.currency < cost) return unchanged(state, `No llegan los ${config.currency.name}.`)
  const stations = {
    ...state.stations,
    [stationId]: { ...progress, level: progress.level + 1 },
  }
  const unlocked = recomputeUnlocks({ ...state, currency: state.currency - cost, stations }, config)
  const flagged = applyMilestoneFlags(unlocked)
  return { state: flagged.state, error: null, completedJob: null, newMilestones: flagged.fresh }
}

function pauseOne(job: ActiveJob, now: number): ActiveJob {
  if (job.paused || !Number.isFinite(now)) return job
  const elapsed = Math.min(job.durationMs, Math.max(0, now - job.startedAt))
  const remainingMs = Math.max(0, job.durationMs - elapsed)
  return { ...job, paused: true, remainingMs }
}

export function pauseJob(state: IdleState, now: number): IdleState {
  return {
    ...state,
    activeJob: state.activeJob ? pauseOne(state.activeJob, now) : null,
    operatorJobs: (state.operatorJobs ?? []).map((job) => pauseOne(job, now)),
  }
}

export function resumeJob(state: IdleState, now: number): IdleState {
  if (!Number.isFinite(now)) return state
  const resumeOne = (job: ActiveJob): ActiveJob =>
    job.paused
      ? { ...job, paused: false, startedAt: now, durationMs: job.remainingMs, remainingMs: job.remainingMs }
      : job
  return {
    ...state,
    activeJob: state.activeJob ? resumeOne(state.activeJob) : null,
    operatorJobs: (state.operatorJobs ?? []).map(resumeOne),
  }
}

export function capture(state: IdleState, config: IdleConfig, now: number): IdleState {
  return pauseJob(settle(state, config, now).state, now)
}
