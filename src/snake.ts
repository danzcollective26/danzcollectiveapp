/** Reglas locales de Snake, independientes de React y de la representación. */
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Point = { x: number; y: number }
export type GameMode = 'classic' | 'maze'
export type Game = {
  mode: GameMode
  stage: number
  stageGoals: number
  levelUp: boolean
  walls: Point[]
  snake: Point[]
  food: Point | null
  direction: Direction
  queuedDirection: Direction | null
  running: boolean
  over: boolean
  won: boolean
  score: number
}
export type GameAction =
  | { type: 'mode'; mode: GameMode }
  | { type: 'maze-level'; stage: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'turn'; direction: Direction }
  // La aleatoriedad llega desde fuera: cada acción produce un estado reproducible.
  | { type: 'tick'; random: number }

export const GRID = 13
export function gameLevel(score: number): number {
  return Math.min(10, 1 + Math.floor(Math.max(0, score) / 50))
}
export function gameTickMs(score: number): number {
  return 150 - (gameLevel(score) - 1) * 8
}

const RECORD_KEY = 'danz-snake-best-v1'
const recordKey = (mode: GameMode) => mode === 'maze' ? 'danz-snake-maze-best-v1' : RECORD_KEY
export function readSnakeRecord(mode: GameMode = 'classic'): number {
  try {
    const value = Number(localStorage.getItem(recordKey(mode)))
    return Number.isSafeInteger(value) && value >= 0 && value <= GRID * GRID * 10 ? value : 0
  } catch { return 0 }
}
export function saveSnakeRecord(score: number, mode: GameMode = 'classic'): number {
  const best = Math.max(readSnakeRecord(mode), Number.isSafeInteger(score) && score >= 0 && score <= GRID * GRID * 10 ? score : 0)
  try { localStorage.setItem(recordKey(mode), String(best)) } catch { /* The current game remains playable. */ }
  return best
}
export const MAZE_STAGES = ['Islas', 'Pasillos', 'Circuito'] as const
const safeStage = (stage: number) => Number.isFinite(stage) ? Math.max(1, Math.min(MAZE_STAGES.length, Math.floor(stage))) : 1
export function mazeWalls(stage: number): Point[] {
  const walls: Point[] = []
  if (safeStage(stage) === 1) {
    for (const [left, top] of [[3, 3], [8, 8]]) for (let y = top; y < top + 2; y++) for (let x = left; x < left + 2; x++) walls.push({ x, y })
  } else if (safeStage(stage) === 2) {
    for (const x of [3, 9]) for (let y = 2; y <= 10; y++) if (y !== 6 && y !== 9) walls.push({ x, y })
  } else {
    for (const y of [3, 9]) for (let x = 2; x <= 10; x++) if (x !== 6) walls.push({ x, y })
    for (const x of [2, 10]) for (let y = 4; y <= 8; y++) if (y !== 6) walls.push({ x, y })
  }
  return walls
}
export const initialGame = (mode: GameMode = 'classic', stage = 1): Game => ({
  mode, stage: mode === 'maze' ? safeStage(stage) : 1, stageGoals: 0, levelUp: false,
  walls: mode === 'maze' ? mazeWalls(stage) : [],
  snake: [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }],
  food: { x: 9, y: 6 },
  direction: 'right',
  queuedDirection: null,
  running: false,
  over: false,
  won: false,
  score: 0,
})

const move: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
}
const opposite: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
}

export function nextFood(snake: Point[], random: number, walls: Point[] = []): Point | null {
  const occupied = new Set([...snake, ...walls].map(({ x, y }) => `${x},${y}`))
  const available: Point[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y })
    }
  }
  if (!available.length) return null
  const fraction = Number.isFinite(random) ? Math.max(0, Math.min(random, 1)) : 0
  return available[Math.min(available.length - 1, Math.floor(fraction * available.length))]
}

export function gameReducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case 'mode': return initialGame(action.mode)
    case 'maze-level': return initialGame('maze', action.stage)
    case 'start': return game.over ? { ...initialGame(game.mode, game.stage), running: true } : { ...game, running: true, levelUp: false }
    case 'pause': return { ...game, running: false }
    case 'reset': return initialGame(game.mode, game.stage)
    case 'turn':
      // Un único giro entre movimientos evita right → up → left en el mismo tick.
      if (game.over || game.queuedDirection || action.direction === game.direction || action.direction === opposite[game.direction]) return game
      return { ...game, queuedDirection: action.direction }
    case 'tick': {
      if (!game.running || game.over) return game
      const direction = game.queuedDirection ?? game.direction
      const head = game.snake[0]
      const delta = move[direction]
      const next = { x: head.x + delta.x, y: head.y + delta.y }
      const eating = game.food !== null && next.x === game.food.x && next.y === game.food.y
      const body = eating ? game.snake : game.snake.slice(0, -1)
      const collided = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID ||
        body.some((p) => p.x === next.x && p.y === next.y) || game.walls.some(p => p.x === next.x && p.y === next.y)
      if (collided) return { ...game, direction, queuedDirection: null, running: false, over: true }
      const snake = [next, ...game.snake.slice(0, eating ? undefined : -1)]
      const score = game.score + (eating ? 10 : 0)
      const stageGoals = game.stageGoals + (eating ? 1 : 0)
      if (game.mode === 'maze' && eating && stageGoals >= 5 && game.stage < MAZE_STAGES.length) {
        // Start the next map at a safe spawn; new walls never appear on the
        // existing snake while it is moving. The player resumes explicitly.
        return { ...initialGame('maze', game.stage + 1), score, levelUp: true }
      }
      const won = snake.length === GRID * GRID - game.walls.length
      return {
        ...game, snake, direction, queuedDirection: null,
        food: won ? null : eating ? nextFood(snake, action.random, game.walls) : game.food,
        score, stageGoals,
        running: !won, over: won, won,
      }
    }
  }
}

/** Un gesto breve no cuenta como dirección y no interfiere al pulsar el tablero. */
export function swipeDirection(dx: number, dy: number): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return null
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
}
