/** Reglas locales de Snake, independientes de React y de la representación. */
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Point = { x: number; y: number }
export type Game = {
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
export function readSnakeRecord(): number {
  try {
    const value = Number(localStorage.getItem(RECORD_KEY))
    return Number.isSafeInteger(value) && value >= 0 && value <= GRID * GRID * 10 ? value : 0
  } catch { return 0 }
}
export function saveSnakeRecord(score: number): number {
  const best = Math.max(readSnakeRecord(), Number.isSafeInteger(score) && score >= 0 && score <= GRID * GRID * 10 ? score : 0)
  try { localStorage.setItem(RECORD_KEY, String(best)) } catch { /* The current game remains playable. */ }
  return best
}
export const initialGame = (): Game => ({
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

export function nextFood(snake: Point[], random: number): Point | null {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`))
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
    case 'start': return game.over ? { ...initialGame(), running: true } : { ...game, running: true }
    case 'pause': return { ...game, running: false }
    case 'reset': return initialGame()
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
        body.some((p) => p.x === next.x && p.y === next.y)
      if (collided) return { ...game, direction, queuedDirection: null, running: false, over: true }
      const snake = [next, ...game.snake.slice(0, eating ? undefined : -1)]
      const won = snake.length === GRID * GRID
      return {
        ...game, snake, direction, queuedDirection: null,
        food: won ? null : eating ? nextFood(snake, action.random) : game.food,
        score: game.score + (eating ? 10 : 0),
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
