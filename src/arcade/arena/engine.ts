export const ARENA_COLS = 11
export const ARENA_ROWS = 9
export const ROUND_MS = 60_000
export const FUSE_MS = 1900
export const BLAST_MS = 550
export type PlayerId = 0 | 1
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Phase = 'ready' | 'playing' | 'paused' | 'round-over' | 'match-over'
export type Tile = 0 | 1 | 2 // floor, speaker, flight case
export type Player = { x: number; y: number; alive: boolean; nextMove: number; range: number; capacity: number }
export type Bomb = { id: number; x: number; y: number; owner: PlayerId; range: number; due: number }
export type Blast = { cell: number; until: number }
export type Pickup = { cell: number; kind: 'range' | 'stock'; readyAt: number }
export type Arena = {
  seed: number; round: number; phase: Phase; elapsed: number; tiles: Tile[]
  players: [Player, Player]; scores: [number, number]; bombs: Bomb[]; blasts: Blast[]
  pickups: Pickup[]; winner: PlayerId | 'draw' | null; nextBomb: number
}
export type ArenaInput = [Direction | null, Direction | null]
export const cellAt = (x: number, y: number) => y * ARENA_COLS + x
const offsets: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const same = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x === b.x && a.y === b.y
const hash = (seed: number, n: number) => { let x = (seed ^ Math.imul(n + 1, 0x45d9f3b)) >>> 0; x = Math.imul(x ^ x >>> 16, 0x45d9f3b); return (x ^ x >>> 16) >>> 0 }

export function createArena(seed = 1, round = 1, scores: [number, number] = [0, 0]): Arena {
  const tiles: Tile[] = Array.from({ length: ARENA_COLS * ARENA_ROWS }, (_, i) => {
    const x = i % ARENA_COLS, y = Math.floor(i / ARENA_COLS)
    if (x === 0 || y === 0 || x === 10 || y === 8 || (x % 2 === 0 && y % 2 === 0)) return 1
    // Symmetric cover and open perimeter lanes give both players an escape.
    if (x === 1 || x === 9 || y === 1 || y === 7) return 0
    return hash(seed + round * 7919, Math.min(i, 98 - i)) % 5 ? 2 : 0
  })
  const player = (x: number, y: number): Player => ({ x, y, alive: true, nextMove: 0, range: 2, capacity: 2 })
  return { seed, round, phase: 'ready', elapsed: 0, tiles, players: [player(1, 1), player(9, 7)], scores: [...scores], bombs: [], blasts: [], pickups: [], winner: null, nextBomb: 1 }
}

export function startArena(state: Arena): Arena {
  if (state.phase === 'playing') return state
  if (state.phase === 'match-over') return { ...createArena(state.seed + 1), phase: 'playing' }
  if (state.phase === 'round-over') return { ...createArena(state.seed, state.round + 1, state.scores), phase: 'playing' }
  return { ...state, phase: 'playing' }
}
export const pauseArena = (state: Arena): Arena => state.phase === 'playing' ? { ...state, phase: 'paused' } : state

export function placeBomb(state: Arena, owner: PlayerId): Arena {
  const p = state.players[owner]
  if (state.phase !== 'playing' || !p.alive || state.bombs.some(b => same(b, p)) || state.bombs.filter(b => b.owner === owner).length >= p.capacity) return state
  return { ...state, nextBomb: state.nextBomb + 1, bombs: [...state.bombs, { id: state.nextBomb, x: p.x, y: p.y, owner, range: p.range, due: state.elapsed + FUSE_MS }] }
}

/** Deterministic grid simulation, independent of the renderer and browser clocks. */
export function stepArena(state: Arena, input: ArenaInput, delta: number): Arena {
  if (state.phase !== 'playing') return state
  const elapsed = state.elapsed + Math.max(0, Math.min(100, Number.isFinite(delta) ? delta : 0))
  const players = state.players.map(p => ({ ...p })) as [Player, Player]
  const candidates = players.map((p, id) => {
    const direction = input[id]
    if (!direction || !p.alive || elapsed < p.nextMove) return { x: p.x, y: p.y }
    const [dx, dy] = offsets[direction], x = p.x + dx, y = p.y + dy
    if (x < 0 || y < 0 || x >= ARENA_COLS || y >= ARENA_ROWS || state.tiles[cellAt(x, y)] !== 0 || state.bombs.some(b => b.x === x && b.y === y)) return { x: p.x, y: p.y }
    return { x, y }
  })
  const conflict = same(candidates[0], candidates[1])
  players.forEach((p, id) => {
    if (!conflict && !same(p, candidates[id])) { p.x = candidates[id].x; p.y = candidates[id].y; p.nextMove = elapsed + 160 }
  })
  // An owner may walk off their newly placed disc, but cannot re-enter it.
  let bombs = state.bombs
  let tiles = state.tiles
  let pickups = [...state.pickups]
  const blasts = state.blasts.filter(b => b.until > elapsed)
  const lit = new Set(blasts.map(b => b.cell))
  const queue = bombs.filter(b => b.due <= elapsed || lit.has(cellAt(b.x, b.y)))
  const detonated = new Set<number>(), fresh = new Set<number>(), broken = new Set<number>()
  while (queue.length) {
    const bomb = queue.shift()!
    if (detonated.has(bomb.id)) continue
    detonated.add(bomb.id)
    fresh.add(cellAt(bomb.x, bomb.y))
    for (const [dx, dy] of Object.values(offsets)) for (let distance = 1; distance <= bomb.range; distance++) {
      const x = bomb.x + dx * distance, y = bomb.y + dy * distance, cell = cellAt(x, y)
      if (x < 0 || y < 0 || x >= ARENA_COLS || y >= ARENA_ROWS || state.tiles[cell] === 1) break
      fresh.add(cell)
      if (state.tiles[cell] === 2) { broken.add(cell); break }
      const chain = bombs.find(b => b.x === x && b.y === y && !detonated.has(b.id))
      if (chain) { queue.push(chain); break }
    }
  }
  if (fresh.size) {
    bombs = bombs.filter(b => !detonated.has(b.id))
    pickups = pickups.filter(p => !fresh.has(p.cell))
    for (const cell of fresh) { lit.add(cell); blasts.push({ cell, until: elapsed + BLAST_MS }) }
    if (broken.size) {
      tiles = [...state.tiles]
      for (const cell of broken) {
        tiles[cell] = 0
        const reward = hash(state.seed + state.round, cell)
        if (reward % 3 === 0) pickups.push({ cell, kind: reward % 2 ? 'stock' : 'range', readyAt: elapsed + BLAST_MS })
      }
    }
  }
  players.forEach(p => { if (lit.has(cellAt(p.x, p.y))) p.alive = false })
  pickups = pickups.filter(pickup => {
    const p = players.find(p => p.alive && pickup.readyAt <= elapsed && cellAt(p.x, p.y) === pickup.cell)
    if (!p) return true
    if (pickup.kind === 'range') p.range = Math.min(4, p.range + 1)
    else p.capacity = Math.min(3, p.capacity + 1)
    return false
  })
  let phase: Phase = 'playing', winner: Arena['winner'] = null
  const scores: [number, number] = [...state.scores]
  if (!players[0].alive || !players[1].alive || elapsed >= ROUND_MS) {
    winner = players[0].alive === players[1].alive ? 'draw' : players[0].alive ? 0 : 1
    if (winner !== 'draw') scores[winner]++
    phase = Math.max(...scores) >= 3 ? 'match-over' : 'round-over'
  }
  return { ...state, elapsed, players, bombs, tiles, blasts, pickups, phase, winner, scores }
}
