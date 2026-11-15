export const CHASE_WIDTH = 880
export const CHASE_HEIGHT = 600
export const CHASE_RADIUS = 24
export const CHASE_DURATION = 60_000
export const DASH_MS = 190
export const DASH_COOLDOWN = 3000
export const TAG_GRACE = 1200
export type PlayerId = 0 | 1
export type Vector = { x: number; y: number }
export type ChasePlayer = Vector & { score: number; dashUntil: number; dashReadyAt: number; facing: Vector; moving: boolean }
export type Chase = {
  phase: 'ready' | 'playing' | 'paused' | 'over'; elapsed: number; match: number
  players: [ChasePlayer, ChasePlayer]; hunter: PlayerId; protectedUntil: number
  tags: number; lastTagAt: number; lastCatcher: PlayerId | null; winner: PlayerId | 'draw' | null
}
export type Obstacle = { x: number; y: number; w: number; h: number; kind: 'booth' | 'speaker' }
/** Symmetric club with two open loops and room for both players to turn. */
export const CHASE_OBSTACLES: readonly Obstacle[] = [
  { x: 360, y: 232, w: 160, h: 136, kind: 'booth' },
  { x: 168, y: 122, w: 128, h: 62, kind: 'speaker' }, { x: 584, y: 122, w: 128, h: 62, kind: 'speaker' },
  { x: 168, y: 416, w: 128, h: 62, kind: 'speaker' }, { x: 584, y: 416, w: 128, h: 62, kind: 'speaker' },
]
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const other = (id: PlayerId): PlayerId => id === 0 ? 1 : 0
function unit(input: Vector): Vector {
  const x = Number.isFinite(input.x) ? input.x : 0, y = Number.isFinite(input.y) ? input.y : 0
  const length = Math.hypot(x, y)
  return length > 1 ? { x: x / length, y: y / length } : { x, y }
}
export function chaseBlocked(p: Vector): boolean {
  return CHASE_OBSTACLES.some(r => (p.x - clamp(p.x, r.x, r.x + r.w)) ** 2 + (p.y - clamp(p.y, r.y, r.y + r.h)) ** 2 < CHASE_RADIUS ** 2 - .0001)
}
/** A capture cannot reach through solid scenery, even at a corner. */
function blockedSight(a: Vector, b: Vector): boolean {
  return CHASE_OBSTACLES.some(r => {
    let enter = 0, leave = 1
    for (const [origin, delta, lo, hi] of [[a.x, b.x - a.x, r.x, r.x + r.w], [a.y, b.y - a.y, r.y, r.y + r.h]]) {
      if (Math.abs(delta) < 1e-8) { if (origin < lo || origin > hi) return false }
      else { const t1 = (lo - origin) / delta, t2 = (hi - origin) / delta; enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2)); if (enter > leave) return false }
    }
    return true
  })
}
export function createChase(match = 1): Chase {
  const player = (x: number, facing: number): ChasePlayer => ({ x, y: 300, score: 0, dashUntil: 0, dashReadyAt: 0, facing: { x: facing, y: 0 }, moving: false })
  return { phase: 'ready', elapsed: 0, match, players: [player(110, 1), player(770, -1)], hunter: match % 2 ? 0 : 1, protectedUntil: 0, tags: 0, lastTagAt: -9999, lastCatcher: null, winner: null }
}
export function startChase(s: Chase): Chase { return s.phase === 'over' ? { ...createChase(s.match + 1), phase: 'playing' } : s.phase === 'playing' ? s : { ...s, phase: 'playing' } }
export const pauseChase = (s: Chase): Chase => s.phase === 'playing' ? { ...s, phase: 'paused' } : s
export function dashChase(s: Chase, id: PlayerId): Chase {
  if (s.phase !== 'playing' || s.players[id].dashReadyAt > s.elapsed) return s
  const players = [...s.players] as Chase['players']
  players[id] = { ...players[id], dashUntil: s.elapsed + DASH_MS, dashReadyAt: s.elapsed + DASH_COOLDOWN }
  return { ...s, players }
}

/** Pure simulation with <=8ms collision steps; no browser, wall clock or network. */
export function stepChase(previous: Chase, input: [Vector, Vector], delta: number): Chase {
  if (previous.phase !== 'playing' || !Number.isFinite(delta) || delta <= 0) return previous
  const state: Chase = { ...previous, players: previous.players.map(p => ({ ...p, facing: { ...p.facing } })) as Chase['players'] }
  const end = Math.min(CHASE_DURATION, state.elapsed + Math.min(1000, delta)), intent = input.map(unit)
  while (state.elapsed < end) {
    const dt = Math.min(8, end - state.elapsed, ...state.players.filter(p => p.dashUntil > state.elapsed).map(p => p.dashUntil - state.elapsed))
    const before = state.elapsed
    state.elapsed += dt
    for (const id of [0, 1] as const) {
      const p = state.players[id], direction = intent[id]
      p.moving = Math.hypot(direction.x, direction.y) > .01
      if (p.moving) p.facing = direction
      const velocity = before < p.dashUntil ? p.facing : direction
      const distance = (id === state.hunter ? 180 : 170) * (before < p.dashUntil ? 1.95 : 1) * dt / 1000
      const x = clamp(p.x + velocity.x * distance, CHASE_RADIUS, CHASE_WIDTH - CHASE_RADIUS)
      if (!chaseBlocked({ x, y: p.y })) p.x = x
      const y = clamp(p.y + velocity.y * distance, CHASE_RADIUS, CHASE_HEIGHT - CHASE_RADIUS)
      if (!chaseBlocked({ x: p.x, y })) p.y = y
    }
    const [a, b] = state.players
    if (state.elapsed >= state.protectedUntil && Math.hypot(a.x - b.x, a.y - b.y) <= CHASE_RADIUS * 2 && !blockedSight(a, b)) {
      state.players[state.hunter].score++
      state.lastCatcher = state.hunter; state.hunter = other(state.hunter)
      state.tags++; state.lastTagAt = state.elapsed; state.protectedUntil = state.elapsed + TAG_GRACE
    }
  }
  if (state.elapsed >= CHASE_DURATION) {
    state.phase = 'over'
    state.winner = state.players[0].score === state.players[1].score ? 'draw' : state.players[0].score > state.players[1].score ? 0 : 1
  }
  return state
}
