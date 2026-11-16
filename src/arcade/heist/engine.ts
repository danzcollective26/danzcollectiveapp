import { HEIST_MAPS, type FactionId, type LootKind, type MapId, type MapPoint, type Tile } from './maps.ts'

export type { FactionId, LootKind, MapId, Tile } from './maps.ts'
export { HEIST_MAPS, HEIST_MAP_IDS } from './maps.ts'

export const HEIST_MS = 6 * 60 * 1000
export const LOCKDOWN_GRACE = 25_000
export const EXTRACT_MS = 2_800
export const ALLY_MS = 45_000
export const BLUFF_ALLY_MS = 18_000
export const HIT_IFRAMES = 1_100
export const HANGOVER_AT = 210_000
export const EARLY_OPEN = 40_000
export const LATE_OPEN = 150_000
export const TAXI_MOVE = 180_000
export const RECORD_KEY = 'danz-manager-heist-record-v1'
export const RECORD_CAP = 2_000_000

export const LOOT_VALUE: Record<LootKind, number> = {
  vinyl: 480,
  stems: 320,
  contract: 360,
  merch: 240,
  rescue: 260,
  vip: 300,
}
export const LOOT_NAME: Record<LootKind, string> = {
  vinyl: 'VINILO',
  stems: 'STEM',
  contract: 'CONTRATO',
  merch: 'MERCH',
  rescue: 'RESCATE',
  vip: 'PASE VIP',
}
export const FACTION_NAME: Record<FactionId, string> = {
  tech: 'TÉCNICOS',
  crew: 'CREW RIVAL',
  manager: 'MANAGERS',
  bouncer: 'BOUNCERS',
  hangover: 'RESACAS',
}
export const STAGE_LABEL = ['', 'CALMA', 'SUBE', 'CIERRE', 'HOSTIL'] as const

const PLAYER_RADIUS = 0.28
const PICKUP_REACH = 0.46
const ALLY_REACH = 1.75
const BLUFF_REACH = 2.2
const HIT_REACH: Record<FactionId, number> = { tech: 0.42, crew: 0.42, manager: 0.44, bouncer: 0.58, hangover: 0.4 }
const BASE_SPEED: Record<FactionId, number> = { tech: 1.65, crew: 2.25, manager: 1.85, bouncer: 1.2, hangover: 0.82 }
const BASE_VISION: Record<FactionId, number> = { tech: 4.4, crew: 5, manager: 4.6, bouncer: 3.1, hangover: 3.3 }
const STAGE_SPEED = [1, 1.12, 1.28, 1.48]
const STAGE_VISION = [1, 0.9, 0.75, 0.62]
const SOCIAL: readonly FactionId[] = ['tech', 'crew', 'manager', 'bouncer']

export type HeistPhase = 'ready' | 'playing' | 'paused' | 'extracted' | 'over'
export type Pact = 'open' | 'kept' | 'betrayed' | 'burned'
export type HeistInput = {
  moveX: number
  moveY: number
  holdExtract: boolean
  ally: boolean
  betray: boolean
  bluff: boolean
  smoke: boolean
}
export const HEIST_IDLE: HeistInput = { moveX: 0, moveY: 0, holdExtract: false, ally: false, betray: false, bluff: false, smoke: false }

export type LootItem = { id: number; kind: LootKind; x: number; y: number; taken: boolean; revealed: boolean; value: number }
export type Agent = {
  id: number
  kind: FactionId
  x: number
  y: number
  homeX: number
  homeY: number
  patrolX: number
  patrolY: number
  toPatrol: boolean
  allyUntil: number
  stunUntil: number
  slowUntil: number
  chaseUntil: number
  enraged: boolean
  turncoat: boolean
}
export type ExtractionPad = {
  id: 'early' | 'late'
  name: string
  x: number
  y: number
  altX: number
  altY: number
  relocates: boolean
  moved: boolean
  opensAt: number
  key: LootKind | null
  announced: boolean
}
export type HeistScore = {
  loot: number
  timeLeft: number
  timeFactor: number
  alliances: number
  betrayals: number
  allianceFactor: number
  total: number
}
export type HeistState = {
  map: MapId
  mapName: string
  phase: HeistPhase
  elapsed: number
  seed: number
  calm: boolean
  cols: number
  rows: number
  tiles: Tile[]
  player: MapPoint
  lives: number
  invulnUntil: number
  agents: Agent[]
  loot: LootItem[]
  inventory: LootItem[]
  smokeAt: MapPoint | null
  smoke: boolean
  hiddenUntil: number
  fakes: number
  channel: number
  merchUntil: number
  feedbackSafeUntil: number
  marked: boolean
  betrayals: number
  pactsKept: number
  pact: Record<FactionId, Pact>
  extractions: ExtractionPad[]
  forcedDoors: { x: number; y: number; until: number }[]
  hangoverSpawns: MapPoint[]
  nextHangoverAt: number
  hangovers: number
  lockdown: boolean
  warn: string
  exitName: string
  message: string
  score: HeistScore | null
  nextId: number
}

export type HeistOptions = { calm?: boolean }

export function heistStage(elapsed: number) {
  if (elapsed >= HEIST_MS) return 4
  if (elapsed >= HANGOVER_AT) return 3
  if (elapsed >= 90_000) return 2
  return 1
}

export function heistClock(elapsed: number) {
  const left = Math.max(0, HEIST_MS - elapsed)
  const total = Math.ceil(left / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function tileIndex(state: HeistState, x: number, y: number) {
  return y * state.cols + x
}

export function heistTileBlocked(state: HeistState, x: number, y: number) {
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return true
  const tile = state.tiles[tileIndex(state, x, y)]
  if (tile === 'wall' || tile === 'cover') return true
  if (tile === 'door' || tile === 'vip') return !doorOpen(state, x, y)
  return false
}

function doorOpen(state: HeistState, x: number, y: number) {
  const tile = state.tiles[tileIndex(state, x, y)]
  if (tile !== 'door' && tile !== 'vip') return true
  if (state.forcedDoors.some(door => door.x === x && door.y === y && door.until > state.elapsed)) return true
  if (tile === 'door') return state.inventory.some(item => item.kind === 'contract')
  return state.inventory.some(item => item.kind === 'vip')
}

function blockedCircle(state: HeistState, x: number, y: number, radius: number) {
  const minX = Math.floor(x - radius), maxX = Math.floor(x + radius)
  const minY = Math.floor(y - radius), maxY = Math.floor(y + radius)
  for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
    if (!heistTileBlocked(state, tx, ty)) continue
    const nearestX = Math.max(tx, Math.min(x, tx + 1))
    const nearestY = Math.max(ty, Math.min(y, ty + 1))
    if ((nearestX - x) ** 2 + (nearestY - y) ** 2 < radius * radius) return true
  }
  return false
}

function slide(state: HeistState, x: number, y: number, dx: number, dy: number, radius: number) {
  if (!blockedCircle(state, x + dx, y + dy, radius)) return { x: x + dx, y: y + dy }
  if (!blockedCircle(state, x + dx, y, radius)) return { x: x + dx, y }
  if (!blockedCircle(state, x, y + dy, radius)) return { x, y: y + dy }
  return { x, y }
}

function clearLine(state: HeistState, ax: number, ay: number, bx: number, by: number) {
  const distance = Math.hypot(bx - ax, by - ay)
  const steps = Math.max(1, Math.ceil(distance * 6))
  for (let i = 1; i < steps; i++) {
    const x = ax + (bx - ax) * i / steps
    const y = ay + (by - ay) * i / steps
    const tx = Math.floor(x), ty = Math.floor(y)
    if (heistTileBlocked(state, tx, ty) && state.tiles[tileIndex(state, tx, ty)] !== 'feedback') return false
  }
  return true
}

function patrolPoint(stateTiles: Tile[], cols: number, rows: number, x: number, y: number, seed: number, id: number) {
  const order = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  if ((seed + id) % 2) order.reverse()
  const open = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < cols && ty < rows && stateTiles[ty * cols + tx] !== 'wall' && stateTiles[ty * cols + tx] !== 'cover' && stateTiles[ty * cols + tx] !== 'door' && stateTiles[ty * cols + tx] !== 'vip'
  for (const [dx, dy] of order) {
    let cx = x, cy = y
    for (let step = 0; step < 4; step++) {
      if (!open(cx + dx, cy + dy)) break
      cx += dx
      cy += dy
    }
    if (cx !== x || cy !== y) return { x: cx + 0.5, y: cy + 0.5 }
  }
  return { x: x + 0.5, y: y + 0.5 }
}

function clone(state: HeistState): HeistState {
  return {
    ...state,
    player: { ...state.player },
    agents: state.agents.map(agent => ({ ...agent })),
    loot: state.loot.map(item => ({ ...item })),
    inventory: state.inventory.map(item => ({ ...item })),
    smokeAt: state.smokeAt ? { ...state.smokeAt } : null,
    extractions: state.extractions.map(pad => ({ ...pad })),
    forcedDoors: state.forcedDoors.map(door => ({ ...door })),
    hangoverSpawns: state.hangoverSpawns.map(spot => ({ ...spot })),
    pact: { ...state.pact },
    score: state.score ? { ...state.score } : null,
  }
}

export function createHeist(map: MapId, seed = 1, options: HeistOptions = {}): HeistState {
  const layout = HEIST_MAPS[map]
  const safeSeed = Math.max(1, Math.floor(seed) || 1) % 2147483647
  let nextId = 1
  const loot = layout.loot.map(item => ({ id: nextId++, kind: item.kind, x: item.x + 0.5, y: item.y + 0.5, taken: false, revealed: false, value: LOOT_VALUE[item.kind] }))
  const agents = layout.agents.map(agent => {
    const patrol = patrolPoint(layout.tiles, layout.cols, layout.rows, agent.x, agent.y, safeSeed, nextId)
    return {
      id: nextId++, kind: agent.kind, x: agent.x + 0.5, y: agent.y + 0.5,
      homeX: agent.x + 0.5, homeY: agent.y + 0.5, patrolX: patrol.x, patrolY: patrol.y, toPatrol: true,
      allyUntil: 0, stunUntil: 0, slowUntil: 0, chaseUntil: 0, enraged: false, turncoat: false,
    }
  })
  const names = map === 'studio'
    ? { early: 'PUERTA TRASERA', late: 'FURGONETA' }
    : { early: 'TAXI', late: 'ROOFTOP' }
  return {
    map, mapName: layout.name, phase: 'ready', elapsed: 0, seed: safeSeed, calm: options.calm === true,
    cols: layout.cols, rows: layout.rows, tiles: layout.tiles,
    player: { x: layout.player.x + 0.5, y: layout.player.y + 0.5 },
    lives: 3, invulnUntil: 1_200, agents, loot, inventory: [],
    smokeAt: layout.smoke ? { x: layout.smoke.x + 0.5, y: layout.smoke.y + 0.5 } : null,
    smoke: false, hiddenUntil: 0, fakes: 1, channel: 0, merchUntil: 0, feedbackSafeUntil: 0,
    marked: false, betrayals: 0, pactsKept: 0,
    pact: { tech: 'open', crew: 'open', manager: 'open', bouncer: 'open', hangover: 'open' },
    extractions: [
      { id: 'early', name: names.early, x: layout.early.x + 0.5, y: layout.early.y + 0.5, altX: (layout.taxiAlt?.x ?? layout.early.x) + 0.5, altY: (layout.taxiAlt?.y ?? layout.early.y) + 0.5, relocates: layout.taxiAlt !== null, moved: false, opensAt: EARLY_OPEN, key: null, announced: false },
      { id: 'late', name: names.late, x: layout.late.x + 0.5, y: layout.late.y + 0.5, altX: layout.late.x + 0.5, altY: layout.late.y + 0.5, relocates: false, moved: false, opensAt: LATE_OPEN, key: layout.lateKey, announced: false },
    ],
    forcedDoors: [], hangoverSpawns: layout.hangovers, nextHangoverAt: HANGOVER_AT, hangovers: 0, lockdown: false,
    warn: '', exitName: '', message: 'EL AFTER ESTÁ ABIERTO. NO TE FÍES DE NADIE.', score: null, nextId,
  }
}

export function startHeist(state: HeistState): HeistState {
  if (state.phase === 'playing') return state
  if (state.phase === 'paused') return { ...state, phase: 'playing' }
  if (state.phase === 'ready') return { ...state, phase: 'playing', message: 'ENTRA BAJO. EL AFTER NO ES TUYO.' }
  return state
}

export function pauseHeist(state: HeistState): HeistState {
  if (state.phase !== 'playing') return state
  return { ...state, phase: 'paused', channel: 0, message: 'PAUSA. EL AFTER SIGUE, TÚ NO.' }
}

export function extractionOpen(state: HeistState, pad: ExtractionPad) {
  if (state.elapsed >= HEIST_MS + LOCKDOWN_GRACE) return false
  if (state.elapsed >= pad.opensAt) return true
  return pad.key !== null && state.inventory.some(item => item.kind === pad.key)
}

export function activeAllies(state: HeistState) {
  const kinds = new Set<FactionId>()
  for (const agent of state.agents) if (SOCIAL.includes(agent.kind) && agent.allyUntil > state.elapsed && !state.lockdown) kinds.add(agent.kind)
  return kinds.size
}

export function scoreHeist(state: HeistState): HeistScore {
  const loot = state.inventory.reduce((sum, item) => sum + item.value, 0)
  const timeLeft = Math.max(0, Math.min(1, (HEIST_MS - state.elapsed) / HEIST_MS))
  const risk = Math.max(0, Math.min(1, state.elapsed / HEIST_MS))
  const timeFactor = 1 + timeLeft * 0.9 + risk * 0.7
  const alliances = state.pactsKept + activeAllies(state)
  const allianceFactor = 1 + state.pactsKept * 0.2 + activeAllies(state) * 0.25 + state.betrayals * 0.55
  return { loot, timeLeft, timeFactor, alliances, betrayals: state.betrayals, allianceFactor, total: Math.round(loot * timeFactor * allianceFactor) }
}

function nearest(state: HeistState, reach: number, accept: (agent: Agent) => boolean) {
  let best: Agent | null = null
  let distance = reach
  for (const agent of state.agents) {
    if (!accept(agent)) continue
    const gap = Math.hypot(agent.x - state.player.x, agent.y - state.player.y)
    if (gap <= distance) { best = agent; distance = gap }
  }
  return best
}

function factionAgents(state: HeistState, kind: FactionId) {
  return state.agents.filter(agent => agent.kind === kind)
}

function allyFaction(state: HeistState, kind: FactionId, until: number, turncoat: boolean) {
  for (const agent of factionAgents(state, kind)) {
    agent.allyUntil = until
    agent.stunUntil = 0
    agent.chaseUntil = 0
    agent.turncoat = turncoat
  }
}

function revealNearestLoot(state: HeistState) {
  let best: LootItem | null = null
  let distance = Infinity
  for (const item of state.loot) {
    if (item.taken) continue
    const gap = Math.hypot(item.x - state.player.x, item.y - state.player.y)
    if (gap < distance) { best = item; distance = gap }
  }
  if (best) best.revealed = true
}

function onFeedback(state: HeistState) {
  const tile = state.tiles[tileIndex(state, Math.floor(state.player.x), Math.floor(state.player.y))]
  return tile === 'feedback'
}

function feedbackHot(state: HeistState) {
  if (state.feedbackSafeUntil > state.elapsed) return false
  return state.agents.some(agent => agent.kind === 'tech' && agent.allyUntil <= state.elapsed && agent.stunUntil <= state.elapsed)
}

function playerSpeed(state: HeistState) {
  let speed = state.merchUntil > state.elapsed ? 4.15 : 3.15
  if (onFeedback(state) && feedbackHot(state)) speed *= 0.58
  return speed
}

function sees(state: HeistState, agent: Agent) {
  if (state.hiddenUntil > state.elapsed) return false
  const stage = heistStage(state.elapsed)
  let vision = BASE_VISION[agent.kind] * STAGE_VISION[stage - 1]
  if (state.inventory.some(item => item.kind === 'vinyl')) vision += 1.15
  if (state.marked) vision += 1.3
  if (agent.enraged) vision += 0.8
  const distance = Math.hypot(agent.x - state.player.x, agent.y - state.player.y)
  if (distance > vision) return false
  return clearLine(state, agent.x, agent.y, state.player.x, state.player.y)
}

function hostile(state: HeistState, agent: Agent) {
  if (state.lockdown) return agent.stunUntil <= state.elapsed
  return agent.allyUntil <= state.elapsed && agent.stunUntil <= state.elapsed
}

function moveAgent(state: HeistState, agent: Agent, dt: number) {
  if (state.calm || agent.stunUntil > state.elapsed) return
  const allied = !state.lockdown && agent.allyUntil > state.elapsed
  const chasing = !allied && agent.chaseUntil > state.elapsed
  const target = chasing
    ? state.player
    : agent.toPatrol
      ? { x: agent.patrolX, y: agent.patrolY }
      : { x: agent.homeX, y: agent.homeY }
  let speed = BASE_SPEED[agent.kind] * STAGE_SPEED[heistStage(state.elapsed) - 1]
  if (agent.enraged || state.lockdown) speed *= 1.22
  if (agent.slowUntil > state.elapsed) speed *= 0.35
  if (allied) speed *= 0.45
  const dx = target.x - agent.x, dy = target.y - agent.y
  const length = Math.hypot(dx, dy)
  if (length < 0.08) { agent.toPatrol = !agent.toPatrol; return }
  const step = speed * dt / 1000
  const next = slide(state, agent.x, agent.y, dx / length * step, dy / length * step, 0.22)
  agent.x = next.x
  agent.y = next.y
}

function expirePacts(state: HeistState) {
  for (const kind of SOCIAL) {
    const members = factionAgents(state, kind)
    if (!members.length || state.pact[kind] !== 'open') continue
    if (members.some(agent => agent.allyUntil > state.elapsed)) continue
    const until = Math.max(...members.map(agent => agent.allyUntil))
    if (until <= 0) continue
    if (members.some(agent => agent.turncoat)) {
      for (const agent of members) { agent.enraged = true; agent.turncoat = false; agent.allyUntil = 0 }
      state.pact[kind] = 'betrayed'
      state.message = 'LA CREW SE QUEDA EL SAMPLE Y TE SUELTA.'
    } else {
      state.pactsKept += 1
      state.pact[kind] = 'kept'
      state.message = 'EL PACTO SE ENFRÍA. NADIE TE DEBE NADA.'
    }
  }
}

function tryAlly(state: HeistState) {
  const target = nearest(state, ALLY_REACH, agent => SOCIAL.includes(agent.kind))
  if (!target) { state.message = 'NADIE LO BASTANTE CERCA PARA UN PACTO.'; return }
  if (target.enraged || state.pact[target.kind] === 'betrayed' || state.lockdown) {
    state.message = 'ESTA GENTE YA TE TIENE FICHADO.'
    return
  }
  allyFaction(state, target.kind, state.elapsed + ALLY_MS, false)
  revealNearestLoot(state)
  state.message = target.kind === 'bouncer'
    ? 'EL BOUNCER MIRA A OTRO LADO. UN RATO.'
    : `PACTO CON ${FACTION_NAME[target.kind]}. 45 SEGUNDOS. NO TE EMOCIONES.`
}

function tryBetray(state: HeistState) {
  const allied = SOCIAL.filter(kind => factionAgents(state, kind).some(agent => agent.allyUntil > state.elapsed) && state.pact[kind] !== 'betrayed')
  if (!allied.length) { state.message = 'NO HAY PACTO QUE ROMPER.'; return }
  const close = nearest(state, 3, agent => allied.includes(agent.kind))
  const kind = close?.kind ?? allied[0]
  for (const agent of factionAgents(state, kind)) {
    agent.allyUntil = 0
    agent.turncoat = false
    agent.enraged = true
    agent.chaseUntil = state.elapsed + 2_400
  }
  state.pact[kind] = 'betrayed'
  state.betrayals += 1
  state.marked = true
  state.message = 'TRAICIÓN. TE LLEVAS MÁS Y TODO EL AFTER TE MARCA.'
}

function tryBluff(state: HeistState) {
  if (state.fakes < 1) { state.message = 'NO TE QUEDA NADA QUE ENSEÑAR.'; return }
  const target = nearest(state, BLUFF_REACH, agent => SOCIAL.includes(agent.kind))
  if (!target) { state.message = 'NO HAY NADIE QUE SE LO CREA.'; return }
  if (target.allyUntil > state.elapsed && !state.lockdown) { state.message = 'YA ESTÁIS DEL MISMO LADO.'; return }
  if (target.enraged || state.pact[target.kind] === 'betrayed') { state.message = 'YA NO SE TRAGAN NADA TUYO.'; return }
  state.fakes -= 1
  if (target.kind === 'tech') {
    target.stunUntil = state.elapsed + 5_000
    target.chaseUntil = 0
    state.feedbackSafeUntil = state.elapsed + 8_000
    state.message = 'EL TÉCNICO SE CREE EL EQUIPO. LA ZONA CALLA.'
  } else if (target.kind === 'crew') {
    allyFaction(state, 'crew', state.elapsed + BLUFF_ALLY_MS, true)
    state.message = 'LES DEJAS UN SAMPLE. SONRÍEN. NO DURARÁ.'
  } else if (target.kind === 'manager') {
    target.stunUntil = state.elapsed + 4_000
    target.chaseUntil = 0
    let best: { x: number; y: number; distance: number } | null = null
    for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
      const tile = state.tiles[tileIndex(state, x, y)]
      if ((tile !== 'door' && tile !== 'vip') || doorOpen(state, x, y)) continue
      const distance = Math.hypot(x + 0.5 - state.player.x, y + 0.5 - state.player.y)
      if (!best || distance < best.distance) best = { x, y, distance }
    }
    if (best) state.forcedDoors.push({ x: best.x, y: best.y, until: state.elapsed + 10_000 })
    state.message = best ? 'TRATO FALSO. UNA PUERTA SE ABRE. LUEGO TE BUSCA.' : 'EL MANAGER FIRMA AL AIRE. NO HAY PUERTA, PERO SE CALLA.'
  } else {
    target.slowUntil = state.elapsed + 1_000
    state.message = 'EL BOUNCER NI PESTAÑEA. UN SEGUNDO, NADA MÁS.'
  }
}

function trySmoke(state: HeistState) {
  if (!state.smoke) { state.message = 'NO LLEVAS HUMO.'; return }
  state.smoke = false
  state.hiddenUntil = state.elapsed + 4_000
  for (const agent of state.agents) agent.chaseUntil = 0
  state.message = 'HUMO. UNOS SEGUNDOS SIN CARA.'
}

function onPad(state: HeistState, pad: ExtractionPad) {
  return Math.hypot(state.player.x - pad.x, state.player.y - pad.y) < 0.62
}

function finishExtract(state: HeistState, pad: ExtractionPad) {
  state.phase = 'extracted'
  state.channel = EXTRACT_MS
  state.score = scoreHeist(state)
  state.exitName = pad.name
  state.message = state.inventory.some(item => item.kind === 'vinyl')
    ? 'SALES CON EL VINILO. VINYL SURVIVORS LO ESPERARÁ.'
    : 'ESTÁS FUERA. CUENTA EL BOTÍN Y NO MIRES ATRÁS.'
}

export function stepHeist(previous: HeistState, input: HeistInput, dt: number): HeistState {
  if (previous.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return previous
  const state = clone(previous)
  const step = Math.min(50, dt)
  state.elapsed += step
  state.forcedDoors = state.forcedDoors.filter(door => door.until > state.elapsed)
  expirePacts(state)

  if (!state.lockdown && state.elapsed >= HEIST_MS) {
    state.lockdown = true
    state.invulnUntil = Math.max(state.invulnUntil, state.elapsed + 800)
    state.message = 'SE APAGA LA MÚSICA. TODO EL MUNDO TE QUIERE FUERA.'
    for (const kind of SOCIAL) {
      if (state.pact[kind] === 'open' && factionAgents(state, kind).some(agent => agent.allyUntil > state.elapsed)) state.pact[kind] = 'burned'
    }
    for (const agent of state.agents) {
      agent.allyUntil = state.elapsed
      agent.turncoat = false
      agent.enraged = true
    }
  }

  for (const pad of state.extractions) {
    if (!pad.announced && extractionOpen(state, pad)) {
      pad.announced = true
      state.message = pad.id === 'early' ? `${pad.name} ABIERTA. SI TE DA EL AIRE, VETE.` : `${pad.name} ABIERTA. ALLÁ TÚ.`
    }
  }
  const early = state.extractions.find(pad => pad.id === 'early')
  if (early && early.relocates && !early.moved && state.elapsed >= TAXI_MOVE && !(state.channel > 0 && onPad(state, early))) {
    early.x = early.altX
    early.y = early.altY
    early.moved = true
    state.message = 'EL TAXI CAMBIA DE ESQUINA. CORRE O PIERDE EL SITIO.'
  }

  if (state.elapsed >= state.nextHangoverAt && state.hangovers < state.hangoverSpawns.length && state.elapsed >= HANGOVER_AT) {
    const spot = state.hangoverSpawns[state.hangovers]
    state.nextHangoverAt = state.elapsed + 18_000
    if (spot && Math.hypot(spot.x + 0.5 - state.player.x, spot.y + 0.5 - state.player.y) > 2) {
      const patrol = patrolPoint(state.tiles, state.cols, state.rows, spot.x, spot.y, state.seed, state.nextId)
      state.agents.push({
        id: state.nextId++, kind: 'hangover', x: spot.x + 0.5, y: spot.y + 0.5,
        homeX: spot.x + 0.5, homeY: spot.y + 0.5, patrolX: patrol.x, patrolY: patrol.y, toPatrol: true,
        allyUntil: 0, stunUntil: 0, slowUntil: 0, chaseUntil: 0, enraged: state.lockdown, turncoat: false,
      })
      state.hangovers += 1
      state.message = 'BAJA LA MÚSICA. SALEN LAS RESACAS.'
    }
  }

  const moveX = Number.isFinite(input.moveX) ? input.moveX : 0
  const moveY = Number.isFinite(input.moveY) ? input.moveY : 0
  const length = Math.hypot(moveX, moveY)
  if (length > 0.001) {
    const scale = Math.min(1, length)
    const speed = playerSpeed(state) * step / 1000
    const next = slide(state, state.player.x, state.player.y, moveX / length * scale * speed, moveY / length * scale * speed, PLAYER_RADIUS)
    state.player = next
  }

  for (const item of state.loot) {
    if (item.taken || state.inventory.length >= 3) continue
    if (Math.hypot(item.x - state.player.x, item.y - state.player.y) > PICKUP_REACH) continue
    item.taken = true
    state.inventory.push({ ...item })
    if (item.kind === 'merch') state.merchUntil = state.elapsed + 8_000
    state.message = item.kind === 'vinyl'
      ? 'VINILO LEGENDARIO. AHORA TE VEN DE LEJOS.'
      : item.kind === 'stems'
        ? 'STEM RARO. ESTO VALE MÁS FUERA QUE AQUÍ.'
        : item.kind === 'contract'
          ? 'CONTRATO. CON ESTO SE ABREN PUERTAS Y LA FURGONETA.'
          : item.kind === 'merch'
            ? 'MERCH QUE CORRE. UN RATO MÁS RÁPIDO.'
            : item.kind === 'vip'
              ? 'PASE VIP. EL ROOFTOP YA NO PREGUNTA.'
              : 'ALGUIEN DEL COLECTIVO. SÁCALO DE AQUÍ.'
  }
  if (state.smokeAt && Math.hypot(state.smokeAt.x - state.player.x, state.smokeAt.y - state.player.y) <= PICKUP_REACH) {
    state.smokeAt = null
    state.smoke = true
    state.message = 'BOTE DE HUMO. GUÁRDALO PARA CUANDO TE MIRAN.'
  }

  if (input.smoke) trySmoke(state)
  if (input.bluff) tryBluff(state)
  if (input.ally) tryAlly(state)
  if (input.betray) tryBetray(state)

  for (const agent of state.agents) {
    if (sees(state, agent) && hostile(state, agent)) agent.chaseUntil = state.elapsed + 900
    moveAgent(state, agent, step)
  }

  let hit = false
  if (state.invulnUntil <= state.elapsed && state.hiddenUntil <= state.elapsed) {
    for (const agent of state.agents) {
      if (!hostile(state, agent)) continue
      if (Math.hypot(agent.x - state.player.x, agent.y - state.player.y) <= HIT_REACH[agent.kind]) { hit = true; break }
    }
  }
  if (hit) {
    state.lives = Math.max(0, state.lives - 1)
    state.invulnUntil = state.elapsed + HIT_IFRAMES
    state.channel = 0
    state.warn = ''
    if (state.lives === 0) {
      state.phase = 'over'
      state.score = null
      state.message = 'PARTY OVER. EL AFTER SE QUEDA CON TODO.'
      return state
    }
    state.message = `TE MARCAN EL CUERPO. AGUANTE ${state.lives}.`
  } else if (input.holdExtract) {
    const pad = state.extractions.find(item => onPad(state, item))
    if (!pad) {
      state.channel = 0
      if (state.warn !== 'none') { state.warn = 'none'; state.message = 'AQUÍ NO HAY SALIDA.' }
    } else if (!extractionOpen(state, pad)) {
      state.channel = 0
      if (state.warn !== pad.id) { state.warn = pad.id; state.message = `${pad.name} SIGUE CERRADA.` }
    } else {
      state.warn = ''
      state.channel += step
      if (state.channel >= EXTRACT_MS) finishExtract(state, pad)
      else state.message = `EXTRAYENDO POR ${pad.name}…`
    }
  } else {
    state.channel = 0
    state.warn = ''
  }

  if (state.phase === 'playing' && state.elapsed >= HEIST_MS + LOCKDOWN_GRACE) {
    state.phase = 'over'
    state.channel = 0
    state.score = null
    state.message = 'EL AFTER ECHA EL CIERRE. PARTY OVER.'
  }
  return state
}

function storage() {
  try { return globalThis.localStorage } catch { return null }
}

export function readHeistRecord() {
  try {
    const value = Number(storage()?.getItem(RECORD_KEY))
    return Number.isSafeInteger(value) && value >= 0 && value <= RECORD_CAP ? value : 0
  } catch { return 0 }
}

export function saveHeistRecord(score: number) {
  const safe = Number.isSafeInteger(score) && score >= 0 && score <= RECORD_CAP ? score : 0
  const record = Math.max(readHeistRecord(), safe)
  try { storage()?.setItem(RECORD_KEY, String(record)) } catch { /* The run still shows its result. */ }
  return record
}
