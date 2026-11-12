import assert from 'node:assert/strict'
import test from 'node:test'
import { GRID, foodCount, MAZE_STAGES, mazeWalls, gameLevel, gameTickMs, gameReducer, initialGame, nextFood, swipeDirection, type Game } from '../src/snake.ts'

const HX = 8, HY = 9
const tick = (game: Game) => gameReducer(game, { type: 'tick', random: 0.4 })
const running = () => gameReducer(initialGame(), { type: 'start' })

test('mueve un paso, conserva longitud y no modifica el estado anterior', () => {
  const before = running()
  const after = tick(before)
  assert.deepEqual(after.snake[0], { x: HX + 1, y: HY })
  assert.equal(after.snake.length, before.snake.length)
  assert.deepEqual(before.snake[0], { x: HX, y: HY })
})

test('rechaza giro inverso y solo admite un giro por tick', () => {
  const before = running()
  assert.equal(gameReducer(before, { type: 'turn', direction: 'left' }), before)
  const up = gameReducer(before, { type: 'turn', direction: 'up' })
  const double = gameReducer(up, { type: 'turn', direction: 'left' })
  const after = tick(double)
  assert.deepEqual(after.snake[0], { x: HX, y: HY - 1 })
  assert.equal(after.direction, 'up')
  assert.equal(after.queuedDirection, null)
  const next = tick(gameReducer(after, { type: 'turn', direction: 'left' }))
  assert.deepEqual(next.snake[0], { x: HX - 1, y: HY - 1 })
})

test('el primer giro de entrada mueve al instante y conserva una segunda esquina hasta el siguiente paso', () => {
  const game = running()
  const up = gameReducer(game, { type: 'input', direction: 'up', random: .4 })
  assert.deepEqual(up.snake[0], { x: HX, y: HY - 1 })
  assert.equal(up.steps, 1)
  assert.equal(up.inputLocked, true)
  assert.equal(gameReducer(up, { type: 'input', direction: 'down', random: .4 }), up)
  const queued = gameReducer(up, { type: 'input', direction: 'left', random: .4 })
  assert.deepEqual(queued.snake, up.snake)
  assert.equal(queued.queuedDirection, 'left')
  const next = tick(queued)
  assert.deepEqual(next.snake[0], { x: HX - 1, y: HY - 1 })
  assert.equal(next.inputLocked, false)
  const paused = gameReducer(next, { type: 'pause' })
  assert.deepEqual(gameReducer(paused, { type: 'input', direction: 'up', random: .4 }).snake, paused.snake)
})

test('come, crece, suma puntos y el nuevo objetivo está libre', () => {
  const before = { ...running(), foods: [{ x: HX + 1, y: HY, face: 0 }] }
  const after = tick(before)
  assert.equal(after.snake.length, 4)
  assert.equal(after.score, 10)
  assert.ok(after.foods.length)
  assert.ok(!after.snake.some(p => p.x === after.foods[0]?.x && p.y === after.foods[0]?.y))
})

test('choque contra pared termina partida y reiniciar limpia el estado', () => {
  const atWall = { ...running(), snake: [{ x: GRID - 1, y: 6 }], score: 20 }
  const after = tick(atWall)
  assert.equal(after.over, true)
  assert.equal(after.running, false)
  assert.equal(tick(after), after)
  assert.deepEqual(gameReducer(after, { type: 'reset' }), initialGame())
  assert.deepEqual(gameReducer(after, { type: 'start' }), running())
})

test('choque contra cuerpo termina la partida', () => {
  const game: Game = { ...running(), direction: 'down', snake: [
    { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
  ] }
  assert.equal(tick(game).over, true)
})

test('entrar en la casilla liberada por la cola es legal cuando no come', () => {
  const game: Game = { ...running(), direction: 'down', snake: [
    { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 },
  ] }
  const after = tick(game)
  assert.equal(after.over, false)
  assert.deepEqual(after.snake[0], { x: 1, y: 2 })
})

test('pausa impide movimiento y continuar conserva la partida', () => {
  const game = tick(running())
  const paused = gameReducer(game, { type: 'pause' })
  assert.equal(tick(paused), paused)
  const resumed = gameReducer(paused, { type: 'start' })
  assert.deepEqual(resumed.snake, game.snake)
  assert.equal(resumed.running, true)
})

test('tablero lleno termina con victoria, sin comida sobre el cuerpo', () => {
  const snake = []
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    if (!(x === 1 && y === 0)) snake.push({ x, y })
  }
  const before = { ...running(), snake, foods: [{ x: 1, y: 0, face: 0 }] }
  const after = tick(before)
  assert.equal(after.snake.length, GRID * GRID)
  assert.equal(after.won, true)
  assert.equal(after.over, true)
  assert.equal(after.running, false)
  assert.deepEqual(after.foods, [])
  assert.equal(nextFood(after.snake, 0.8), null)
})

test('generación de comida con única casilla libre y extremos aleatorios', () => {
  const snake = []
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    if (!(x === 7 && y === 8)) snake.push({ x, y })
  }
  for (const random of [-1, 0, 0.5, 1, Infinity, NaN]) assert.deepEqual(nextFood(snake, random), { x: 7, y: 8 })
})

test('gestos: cuatro direcciones y rechazo de pulsaciones cortas', () => {
  assert.equal(swipeDirection(70, 5), 'right')
  assert.equal(swipeDirection(-70, 5), 'left')
  assert.equal(swipeDirection(5, 70), 'down')
  assert.equal(swipeDirection(5, -70), 'up')
  assert.equal(swipeDirection(5, -8), null)
})

test('la progresión sube cada cinco objetivos y limita la velocidad máxima', () => {
  assert.equal(gameLevel(0), 1)
  assert.equal(gameLevel(40), 1)
  assert.equal(gameLevel(50), 2)
  assert.equal(gameTickMs(0), 150)
  assert.equal(gameTickMs(50), 142)
  assert.equal(gameLevel(1500), 10)
  assert.equal(gameTickMs(1500), 78)
})

test('los doce laberintos tienen dificultad creciente, salida segura y todas las casillas conectadas', () => {
  let previous = 0
  for (let stage = 1; stage <= MAZE_STAGES.length; stage++) {
    const game = initialGame('maze', stage)
    const walls = new Set(game.walls.map(p => `${p.x},${p.y}`))
    assert.equal(walls.size, game.walls.length)
    assert.ok(walls.size > previous); previous = walls.size
    for (const p of [...game.snake, ...game.foods]) assert.ok(!walls.has(`${p.x},${p.y}`))
    const seen = new Set<string>(), queue = [game.snake[0]]
    while (queue.length) {
      const p = queue.shift()!, key = `${p.x},${p.y}`
      if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID || walls.has(key) || seen.has(key)) continue
      seen.add(key)
      queue.push({x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1})
    }
    assert.equal(seen.size, GRID * GRID - walls.size)
    for (const random of [-1, 0, .3, .9, 1, Infinity, NaN]) {
      const food = nextFood(game.snake, random, game.walls)!
      assert.ok(seen.has(`${food.x},${food.y}`))
      assert.ok(!game.snake.some(p => p.x === food.x && p.y === food.y))
    }
  }
})

test('chocar con un obstáculo termina el laberinto y reiniciar conserva el recorrido elegido', () => {
  const game = {...initialGame('maze', 2), running:true, snake:[{x:4,y:3}]}
  const after = tick(game)
  assert.equal(after.over, true)
  assert.equal(after.running, false)
  assert.equal(after.score, 0)
  assert.deepEqual(gameReducer(after,{type:'reset'}),initialGame('maze',2))
  assert.deepEqual(gameReducer(after,{type:'start'}),{...initialGame('maze',2),running:true})
})

test('cinco objetivos cambian el mapa entre niveles con pausa, puntuación conservada y salida libre', () => {
  const before = {...initialGame('maze'),running:true,score:40,stageGoals:4,foods:[{x:HX+1,y:HY,face:4}]}
  const after = tick(before)
  assert.equal(after.stage,2);assert.equal(after.score,50);assert.equal(after.running,false)
  assert.equal(after.levelUp,true);assert.equal(after.stageGoals,0);assert.equal(after.over,false)
  assert.deepEqual(after.snake,initialGame('maze',2).snake)
  assert.deepEqual(after.walls,mazeWalls(2))
  assert.equal(gameReducer(after,{type:'start'}).levelUp,false)
  assert.equal(gameReducer(after,{type:'start'}).running,true)
})

test('el último laberinto continúa sin reiniciar y puede completarse llenando solo las casillas libres', () => {
  const final=initialGame('maze',MAZE_STAGES.length)
  const onward=tick({...final,running:true,score:140,stageGoals:4,foods:[{x:HX+1,y:HY,face:4}]})
  assert.equal(onward.stage,MAZE_STAGES.length);assert.equal(onward.running,true);assert.equal(onward.score,150)
  assert.equal(onward.snake.length,4)
  const walls=new Set(final.walls.map(p=>`${p.x},${p.y}`)),snake=[{x:8,y:9}]
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++)if((x!==8||y!==9)&&(x!==9||y!==9)&&!walls.has(`${x},${y}`))snake.push({x,y})
  const won=tick({...final,running:true,snake,foods:[{x:9,y:9,face:0}]})
  assert.equal(won.won,true);assert.deepEqual(won.foods,[])
  assert.equal(won.snake.length,GRID*GRID-final.walls.length)
})

test('cambiar de modo o recorrido reinicia la partida sin mezclar reglas de clásico y laberinto', () => {
  const game={...initialGame('maze',2),running:true,score:70,stageGoals:2}
  assert.deepEqual(gameReducer(game,{type:'mode',mode:'classic'}),initialGame())
  assert.deepEqual(gameReducer(game,{type:'maze-level',stage:3}),initialGame('maze',3))
  assert.equal(initialGame('maze',NaN).stage,1)
  assert.equal(initialGame('maze',999).stage,MAZE_STAGES.length)
})


test('los objetivos crecen hasta cinco, son distintos y reaparecen sin perder la cara recogida', () => {
  assert.deepEqual([0, 40, 50, 100, 150, 200, 900].map(foodCount),[1,1,2,3,4,5,5])
  const before = { ...running(), score:40, nextFace:5, foods:[{x:HX+1,y:HY,face:4}] }
  const after = tick(before)
  assert.equal(after.foods.length,2)
  assert.deepEqual(after.eatenFaces,[4])
  assert.deepEqual(after.foods.map(f=>f.face),[5,6])
  assert.equal(new Set(after.foods.map(f=>`${f.x},${f.y}`)).size,2)
  for(const f of after.foods)assert.ok(!after.snake.some(p=>p.x===f.x&&p.y===f.y))
  const collectSecond = tick({...running(),score:50,nextFace:12,foods:[{x:0,y:0,face:10},{x:HX+1,y:HY,face:11}]})
  assert.deepEqual(collectSecond.eatenFaces,[11])
  assert.equal(collectSecond.foods[0].face,10)
  assert.equal(collectSecond.foods[1].face,12)
})

test('al pasar de laberinto se conservan la secuencia de caras y el número de objetivos seguro', () => {
  const after=tick({...initialGame('maze'),running:true,score:40,stageGoals:4,nextFace:15,foods:[{x:HX+1,y:HY,face:14}]})
  assert.equal(after.stage,2)
  assert.equal(after.foods.length,2)
  assert.deepEqual(after.foods.map(f=>f.face),[15,16])
  assert.deepEqual(after.eatenFaces,[])
  for(const f of after.foods)assert.ok(![...after.snake,...after.walls].some(p=>p.x===f.x&&p.y===f.y))
})
