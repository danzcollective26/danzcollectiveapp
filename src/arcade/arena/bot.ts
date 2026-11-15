import { ARENA_COLS, ARENA_ROWS, ROUND_MS, cellAt, placeBomb, stepArena, type Arena, type Direction } from './engine.ts'

export type ArenaBot = { nextThink: number }
export type BotDecision = { brain: ArenaBot; direction: Direction | null; drop: boolean }
export const createArenaBot = (): ArenaBot => ({ nextThink: 0 })
const HORIZON = 2800, MOVE = 180, MARGIN = 100
const moves: [Direction | null, number, number][] = [['left', -1, 0], ['up', 0, -1], ['right', 1, 0], ['down', 0, 1], [null, 0, 0]]
type Forecast = { frames: { time: number; state: Arena }[]; danger: number[][]; end: number }
type Route = { cell: number; tick: number; first: Direction | null }

/** Project the actual engine, including chain reactions and destroyed cover.
 * Spectators sit on indestructible corner speakers so a simulated death cannot
 * stop the projection. Their positions do not change the field's physics. */
function forecast(state: Arena): Forecast {
  let future: Arena = { ...state, players: [{ ...state.players[0], x: 0, y: 0, alive: true }, { ...state.players[1], x: ARENA_COLS - 1, y: ARENA_ROWS - 1, alive: true }] }
  const frames = [{ time: state.elapsed, state: future }]
  const danger: number[][] = Array.from({ length: ARENA_COLS * ARENA_ROWS }, () => [])
  const record = () => { for (const blast of future.blasts) danger[blast.cell]?.push(future.elapsed) }
  record()
  const end = Math.min(state.elapsed + HORIZON, ROUND_MS)
  while (future.phase === 'playing' && future.elapsed < end) {
    future = stepArena(future, [null, null], Math.min(100, end - future.elapsed))
    frames.push({ time: future.elapsed, state: future }); record()
  }
  return { frames, danger, end }
}

function safe(f: Forecast, cell: number, from: number, to: number) {
  return f.danger[cell].every(time => time < from - MARGIN || time > to + MARGIN)
}
function at(f: Forecast, time: number) {
  return f.frames[Math.min(f.frames.length - 1, Math.max(0, Math.floor((time - f.frames[0].time) / 100)))].state
}

/** Bounded space/time search: waiting is a move; existing discs block re-entry.
 * Every first step is safe immediately, rather than only at its future ETA. */
function routes(state: Arena, f: Forecast): Route[] {
  const p = state.players[1], start = cellAt(p.x, p.y), rival = cellAt(state.players[0].x, state.players[0].y)
  const queue: Route[] = [{ cell: start, tick: 0, first: null }], settled = new Set([start])
  const result: Route[] = [], maxTick = Math.ceil((f.end - state.elapsed) / MOVE)
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i], arrival = state.elapsed + node.tick * MOVE
    if (safe(f, node.cell, arrival, f.end)) result.push(node)
    if (node.tick >= maxTick) continue
    for (const [direction, dx, dy] of moves) {
      const x = node.cell % ARENA_COLS + dx, y = Math.floor(node.cell / ARENA_COLS) + dy
      if (x < 0 || y < 0 || x >= ARENA_COLS || y >= ARENA_ROWS) continue
      const cell = cellAt(x, y), tick = node.tick + 1, time = state.elapsed + tick * MOVE, field = at(f, time)
      const key = tick * ARENA_COLS * ARENA_ROWS + cell
      if (settled.has(key) || cell === rival || field.tiles[cell] !== 0) continue
      if (field.bombs.some(b => cellAt(b.x, b.y) === cell) && !(cell === node.cell && cell === start)) continue
      // The next movement happens now; it cannot enter a currently blocked tile.
      if (node.tick === 0 && cell !== start && (state.tiles[cell] !== 0 || state.bombs.some(b => cellAt(b.x, b.y) === cell))) continue
      if (!safe(f, cell, node.tick === 0 ? state.elapsed : time - MOVE, time + MOVE)) continue
      settled.add(key); queue.push({ cell, tick, first: node.tick === 0 ? direction : node.first })
    }
  }
  return result
}

function usefulDisc(state: Arena) {
  const p = state.players[1], rival = state.players[0]
  for (const [, dx, dy] of moves.slice(0, 4)) for (let d = 1; d <= p.range; d++) {
    const x = p.x + dx * d, y = p.y + dy * d, tile = state.tiles[cellAt(x, y)]
    if (x < 0 || y < 0 || x >= ARENA_COLS || y >= ARENA_ROWS || tile === 1) break
    if (tile === 2 || (rival.x === x && rival.y === y)) return true
    if (state.bombs.some(b => b.x === x && b.y === y)) break
  }
  return false
}

function routeValue(state: Arena, route: Route) {
  const x = route.cell % ARENA_COLS, y = Math.floor(route.cell / ARENA_COLS), rival = state.players[0]
  const crates = moves.slice(0, 4).filter(([, dx, dy]) => state.tiles[cellAt(x + dx, y + dy)] === 2).length
  const pickup = state.pickups.some(p => p.cell === route.cell && p.readyAt <= state.elapsed + route.tick * MOVE)
  return -3 * (Math.abs(x - rival.x) + Math.abs(y - rival.y)) + crates * 5 + (pickup ? 18 : 0) - route.tick * 1.2
}

/** Local deterministic opponent: no network, hidden inputs or special physics.
 * Re-plan at movement cadence; never run a path search every rendered frame. */
export function thinkArenaBot(state: Arena, brain: ArenaBot, delta = 0): BotDecision {
  const idle = { brain, direction: null, drop: false }
  if (state.phase !== 'playing' || !state.players[1].alive || state.elapsed < brain.nextThink || state.elapsed + delta < state.players[1].nextMove) return idle
  const next = { nextThink: state.elapsed + 140 }
  const f = forecast(state), p = state.players[1], cell = cellAt(p.x, p.y), choices = routes(state, f)
  // Escape takes priority over attacking or collecting an upgrade.
  if (!safe(f, cell, state.elapsed, f.end)) return { brain: next, direction: choices[0]?.first ?? null, drop: false }
  if (usefulDisc(state)) {
    const armed = placeBomb(state, 1)
    if (armed !== state) {
      const escape = routes(armed, forecast(armed)).find(r => r.first !== null && r.tick * MOVE < 1600)
      if (escape) return { brain: next, direction: escape.first, drop: true }
    }
  }
  let best = choices[0]
  for (const choice of choices) if (!best || routeValue(state, choice) > routeValue(state, best)) best = choice
  return { brain: next, direction: best?.first ?? null, drop: false }
}
