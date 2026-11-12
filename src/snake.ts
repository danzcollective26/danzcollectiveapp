/** Reglas locales de Snake, independientes de React y de la representación. */
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Point = { x: number; y: number }
export type Food = Point & { face: number }
export type GameMode = 'classic' | 'maze'
export type Game = {
  mode: GameMode
  stage: number
  stageGoals: number
  levelUp: boolean
  walls: Point[]
  snake: Point[]
  foods: Food[]
  nextFace: number
  eatenFaces: number[]
  direction: Direction
  queuedDirection: Direction | null
  running: boolean
  over: boolean
  won: boolean
  score: number
  steps: number
  inputLocked: boolean
  seed?: number
  replay?: string
}
export type GameAction =
  | { type: 'ranked'; mode: GameMode; seed: number }
  | { type: 'mode'; mode: GameMode }
  | { type: 'maze-level'; stage: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'turn'; direction: Direction }
  | { type: 'input'; direction: Direction; random: number }
  // La aleatoriedad llega desde fuera: cada acción produce un estado reproducible.
  | { type: 'tick'; random: number }

export const GRID = 19
export const foodCount = (score: number) => Math.min(5, 1 + Math.floor(Math.max(0, score) / 50))
export function gameLevel(score: number): number {
  return Math.min(10, 1 + Math.floor(Math.max(0, score) / 50))
}
export function gameTickMs(score: number): number {
  return 240 - (gameLevel(score) - 1) * 15
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
export const MAZE_STAGES = ['Islas', 'Pasillos', 'Circuito', 'Puentes', 'Órbitas', 'Cruces', 'Columnas', 'Túneles', 'Anillos', 'Zigzag', 'Patchbay', 'Backstage'] as const
const safeStage = (stage: number) => Number.isFinite(stage) ? Math.max(1, Math.min(MAZE_STAGES.length, Math.floor(stage))) : 1
export function mazeWalls(stage: number): Point[] {
  stage=safeStage(stage)
  const walls: Point[] = []
  if (safeStage(stage) === 1) {
    for (const [left, top] of [[3, 3], [GRID - 5, GRID - 5]]) for (let y = top; y < top + 2; y++) for (let x = left; x < left + 2; x++) walls.push({ x, y })
  } else if (safeStage(stage) === 2) {
    for (const x of [5, 13]) for (let y = 3; y <= 15; y++) if (y !== 9 && y !== 12) walls.push({ x, y })
  } else if (safeStage(stage) === 3) {
    for (const y of [4, 14]) for (let x = 3; x <= 15; x++) if (x !== 9) walls.push({ x, y })
    for (const x of [3, 15]) for (let y = 5; y <= 13; y++) if (y !== 9) walls.push({ x, y })
  } else if (safeStage(stage) === 4) {
    for (const [i, y] of [3, 7, 11, 15].entries()) for (let x = 3; x <= 15; x++) if (x !== (i % 2 ? 13 : 5)) walls.push({ x, y })
  } else if (safeStage(stage) === 5) {
    for (const [low, high] of [[3, 15], [6, 12]]) {
      for (let x = low; x <= high; x++) if (x !== 9) walls.push({ x, y: low }, { x, y: high })
      for (let y = low + 1; y < high; y++) if (y !== 9) walls.push({ x: low, y }, { x: high, y })
    }
  } else if (stage === 6) {
    for (const x of [3, 7, 11, 15]) for (let y = 2; y <= 16; y++) if (![5, 9, 13].includes(y)) walls.push({ x, y })
    for (const y of [3, 7, 11, 15]) for (let x = 2; x <= 16; x++) if (![5, 9, 13].includes(x) && !walls.some(p => p.x === x && p.y === y)) walls.push({ x, y })
  }
  if (stage === 7) {
    for (const x of [2,4,6,8,10,12,14,16]) for(let y=2;y<=16;y++) if(y!==9) walls.push({x,y})
  } else if (stage === 8) {
    for(const y of [2,4,6,8,10,12,14,16]) for(let x=0;x<GRID;x++) if(![4,9,14].includes(x)) walls.push({x,y})
  } else if (stage === 9) {
    for(const [low,high] of [[1,17],[3,15],[5,13],[7,11]]) {
      for(let x=low;x<=high;x++) if(x!==9) walls.push({x,y:low},{x,y:high})
      for(let y=low+1;y<high;y++) if(y!==9) walls.push({x:low,y},{x:high,y})
    }
  } else if (stage === 10) {
    for(const [i,y] of [0,2,4,6,8,10,12,14,16,18].entries()) for(let x=0;x<GRID;x++) if(x!==9&&x!==(i%2?3:15)) walls.push({x,y})
  } else if (stage >= 11) {
    const free=new Set<string>(['1,1']),visited=new Set<string>(['1,1']),stack=[{x:1,y:1}];let seed=stage*7919
    while(stack.length){const p=stack[stack.length-1];const options=[{x:p.x+2,y:p.y},{x:p.x,y:p.y+2},{x:p.x-2,y:p.y},{x:p.x,y:p.y-2}].filter(q=>q.x>0&&q.x<18&&q.y>0&&q.y<18&&!visited.has(`${q.x},${q.y}`));if(!options.length){stack.pop();continue}seed=nextSnakeSeed(seed);const q=options[seed%options.length];free.add(`${(q.x+p.x)/2},${(q.y+p.y)/2}`);free.add(`${q.x},${q.y}`);visited.add(`${q.x},${q.y}`);stack.push(q)}
    for(let x=1;x<=17;x++)free.add(`${x},9`)
    if(stage===11)for(let y=1;y<=17;y++){free.add(`9,${y}`);free.add(`5,${y}`)}
    for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++)if(!free.has(`${x},${y}`))walls.push({x,y})
  }
  return walls
}
export const MAX_RANKED_MOVES=20000
export const nextSnakeSeed=(seed:number)=>(seed*48271)%2147483647
export const initialGame = (mode: GameMode = 'classic', stage = 1): Game => ({
  mode, stage: mode === 'maze' ? safeStage(stage) : 1, stageGoals: 0, levelUp: false,
  walls: mode === 'maze' ? mazeWalls(stage) : [],
  snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
  foods: [{ x: 12, y: 9, face: 0 }],
  nextFace: 1,
  eatenFaces: [],
  direction: 'right',
  queuedDirection: null,
  running: false,
  over: false,
  won: false,
  score: 0,
  steps: 0,
  inputLocked: false,
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

function replenish(game: Game, random: number): Game {
  const foods = [...game.foods]
  let nextFace = game.nextFace
  let seed = game.seed
  const fraction = Number.isFinite(random) ? Math.max(0, Math.min(1, random)) : 0
  while (foods.length < foodCount(game.score)) {
    if(seed!==undefined)seed=nextSnakeSeed(seed)
    const point=nextFood(game.snake,seed===undefined?(fraction+foods.length*.61803398875)%1:seed/2147483647,[...game.walls,...foods])
    if (!point) break
    foods.push({ ...point, face: nextFace++ })
  }
  return { ...game, foods, nextFace, ...(seed===undefined?{}:{seed}) }
}

export function gameReducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case 'ranked': return {...initialGame(action.mode),seed:action.seed,replay:'',running:true}
    case 'mode': return initialGame(action.mode)
    case 'maze-level': return initialGame('maze', action.stage)
    case 'start': return game.over ? { ...initialGame(game.mode, game.stage), running: true } : { ...game, running: true, levelUp: false, inputLocked: false }
    case 'pause': return { ...game, running: false }
    case 'reset': return initialGame(game.mode, game.stage)
    case 'turn':
      // Un único giro entre movimientos evita right → up → left en el mismo tick.
      if (game.over || game.queuedDirection || action.direction === game.direction || action.direction === opposite[game.direction]) return game
      return { ...game, queuedDirection: action.direction }
    case 'input': {
      const turned = gameReducer(game, { type: 'turn', direction: action.direction })
      if (turned === game || !game.running || game.inputLocked) return turned
      const moved = gameReducer(turned, { type: 'tick', random: action.random })
      return { ...moved, inputLocked: moved.running }
    }
    case 'tick': {
      if (!game.running || game.over) return game
      const direction = game.queuedDirection ?? game.direction
      if(game.replay!==undefined){if(game.replay.length>=MAX_RANKED_MOVES)return {...game,running:false,over:true};game={...game,replay:game.replay+({up:'U',down:'D',left:'L',right:'R'} as const)[direction]}}
      const head = game.snake[0]
      const delta = move[direction]
      const next = { x: head.x + delta.x, y: head.y + delta.y }
      const picked = game.foods.find(food => food.x === next.x && food.y === next.y)
      const eating = Boolean(picked)
      const body = eating ? game.snake : game.snake.slice(0, -1)
      const collided = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID ||
        body.some((p) => p.x === next.x && p.y === next.y) || game.walls.some(p => p.x === next.x && p.y === next.y)
      if (collided) return { ...game, direction, queuedDirection: null, inputLocked: false, running: false, over: true }
      const snake = [next, ...game.snake.slice(0, eating ? undefined : -1)]
      const score = game.score + (eating ? 10 : 0)
      const stageGoals = game.stageGoals + (eating ? 1 : 0)
      if (game.mode === 'maze' && eating && stageGoals >= 5 && game.stage < MAZE_STAGES.length) {
        // Start the next map at a safe spawn; new walls never appear on the
        // existing snake while it is moving. The player resumes explicitly.
        const nextStage = initialGame('maze', game.stage + 1)
        return replenish({ ...nextStage, ...(game.seed===undefined?{}:{seed:game.seed,replay:game.replay}), score, levelUp: true, foods: [{ ...nextStage.foods[0], face: game.nextFace }], nextFace: game.nextFace + 1 }, action.random)
      }
      const won = snake.length === GRID * GRID - game.walls.length
      const moved: Game = {
        ...game, snake, direction, queuedDirection: null, inputLocked: false, steps: game.steps + 1,
        foods: won ? [] : game.foods.filter(food => food !== picked),
        eatenFaces: picked ? [picked.face, ...game.eatenFaces].slice(0, snake.length - 1) : game.eatenFaces,
        score, stageGoals,
        running: !won, over: won, won,
      }
      return won ? moved : replenish(moved, action.random)
    }
  }
}

/** Un gesto breve no cuenta como dirección y no interfiere al pulsar el tablero. */
export function swipeDirection(dx: number, dy: number): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return null
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
}
