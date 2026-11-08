import assert from 'node:assert/strict'
import test from 'node:test'
import { GRID, gameReducer, initialGame, nextFood, swipeDirection, type Game } from '../src/snake.ts'

const tick = (game: Game) => gameReducer(game, { type: 'tick', random: 0.4 })
const running = () => gameReducer(initialGame(), { type: 'start' })

test('mueve un paso, conserva longitud y no modifica el estado anterior', () => {
  const before = running()
  const after = tick(before)
  assert.deepEqual(after.snake[0], { x: 6, y: 6 })
  assert.equal(after.snake.length, before.snake.length)
  assert.deepEqual(before.snake[0], { x: 5, y: 6 })
})

test('rechaza giro inverso y solo admite un giro por tick', () => {
  const before = running()
  assert.equal(gameReducer(before, { type: 'turn', direction: 'left' }), before)
  const up = gameReducer(before, { type: 'turn', direction: 'up' })
  const double = gameReducer(up, { type: 'turn', direction: 'left' })
  const after = tick(double)
  assert.deepEqual(after.snake[0], { x: 5, y: 5 })
  assert.equal(after.direction, 'up')
  assert.equal(after.queuedDirection, null)
  const next = tick(gameReducer(after, { type: 'turn', direction: 'left' }))
  assert.deepEqual(next.snake[0], { x: 4, y: 5 })
})

test('come, crece, suma puntos y el nuevo objetivo está libre', () => {
  const before = { ...running(), food: { x: 6, y: 6 } }
  const after = tick(before)
  assert.equal(after.snake.length, 4)
  assert.equal(after.score, 10)
  assert.ok(after.food)
  assert.ok(!after.snake.some(p => p.x === after.food?.x && p.y === after.food?.y))
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
  const before = { ...running(), snake, food: { x: 1, y: 0 } }
  const after = tick(before)
  assert.equal(after.snake.length, GRID * GRID)
  assert.equal(after.won, true)
  assert.equal(after.over, true)
  assert.equal(after.running, false)
  assert.equal(after.food, null)
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
