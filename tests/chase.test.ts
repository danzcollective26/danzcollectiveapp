import test from 'node:test'
import assert from 'node:assert/strict'
import { CHASE_WIDTH, CHASE_HEIGHT, CHASE_RADIUS, CHASE_OBSTACLES, CHASE_DURATION, DASH_COOLDOWN, TAG_GRACE, createChase, startChase, pauseChase, dashChase, stepChase, chaseBlocked, type Chase, type Vector } from '../src/arcade/chase/engine.ts'
import { worldDirection } from '../src/arcade/versusView.ts'
const idle: [Vector, Vector] = [{ x: 0, y: 0 }, { x: 0, y: 0 }]
const begin = () => startChase(createChase())

test('a new chase has two safe symmetric starts and an original symmetric obstacle layout', () => {
  const s = createChase()
  assert.equal(s.phase, 'ready'); assert.equal(s.players[0].x + s.players[1].x, CHASE_WIDTH)
  for (const p of s.players) { assert.equal(chaseBlocked(p), false); assert.equal(p.score, 0) }
  for (const r of CHASE_OBSTACLES) assert.ok(CHASE_OBSTACLES.some(q => q.x === CHASE_WIDTH - r.x - r.w && q.y === CHASE_HEIGHT - r.y - r.h && q.w === r.w && q.h === r.h))
})
test('diagonal movement is normalized, including opposing keys and invalid coordinates', () => {
  const base = begin(), x = base.players[0].x, y = base.players[0].y
  const straight = stepChase(base, [{ x: 0, y: -1 }, idle[1]], 100)
  const diagonal = stepChase(base, [{ x: -1, y: -1 }, idle[1]], 100)
  assert.ok(Math.abs(Math.hypot(diagonal.players[0].x - x, diagonal.players[0].y - y) - (y - straight.players[0].y)) < .0001)
  const invalid = stepChase(base, [{ x: NaN, y: Infinity }, idle[1]], 100)
  assert.deepEqual([invalid.players[0].x, invalid.players[0].y], [x, y])
})
test('long or boosted movement cannot cross a speaker or the boundary', () => {
  let s = begin()
  s.players[0] = { ...s.players[0], x: 232, y: 220 }
  s = dashChase(s, 0)
  s = stepChase(s, [{ x: 0, y: -1 }, idle[1]], 1000)
  assert.ok(s.players[0].y >= 184 + CHASE_RADIUS - .001)
  assert.equal(chaseBlocked(s.players[0]), false)
  for (let i = 0; i < 10; i++) s = stepChase(s, [{ x: -1, y: 0 }, { x: 1, y: 0 }], 1000)
  assert.equal(s.players[0].x, CHASE_RADIUS); assert.equal(s.players[1].x, CHASE_WIDTH - CHASE_RADIUS)
})
test('a player slides along scenery instead of freezing both movement axes', () => {
  const s = begin(); s.players[0] = { ...s.players[0], x: 232, y: 184 + CHASE_RADIUS }
  const next = stepChase(s, [{ x: 1, y: -1 }, idle[1]], 100)
  assert.ok(next.players[0].x > s.players[0].x); assert.equal(next.players[0].y, s.players[0].y)
})
test('a capture gives exactly one point, switches roles and protects against instant recapture', () => {
  const s = begin(); s.players[0] = { ...s.players[0], x: 100, y: 300 }; s.players[1] = { ...s.players[1], x: 140, y: 300 }
  const caught = stepChase(s, idle, 16)
  assert.equal(caught.tags, 1); assert.equal(caught.hunter, 1); assert.equal(caught.players[0].score, 1); assert.equal(caught.players[1].score, 0)
  assert.equal(caught.protectedUntil, caught.lastTagAt + TAG_GRACE)
  const protectedState = stepChase(caught, idle, 1000)
  assert.equal(protectedState.tags, 1)
  const returned = stepChase(protectedState, idle, 250)
  assert.equal(returned.tags, 2); assert.equal(returned.players[1].score, 1); assert.equal(returned.hunter, 0)
})
test('capture detection remains active during a fast sprint', () => {
  const s = begin(); s.players[0] = { ...s.players[0], x: 100, y: 70 }; s.players[1] = { ...s.players[1], x: 190, y: 70 }
  const next = stepChase(dashChase(s, 0), [{ x: 1, y: 0 }, idle[1]], 300)
  assert.equal(next.tags, 1); assert.equal(next.players[0].score, 1)
})
test('sprint cooldown rejects repeat presses and recharges only with active time', () => {
  const base = begin(), boosted = dashChase(base, 0)
  assert.equal(boosted.players[0].dashReadyAt, DASH_COOLDOWN); assert.equal(dashChase(boosted, 0), boosted)
  const fast = stepChase(boosted, [{ x: 0, y: -1 }, idle[1]], 100)
  const slow = stepChase(base, [{ x: 0, y: -1 }, idle[1]], 100)
  assert.ok(fast.players[0].y < slow.players[0].y)
  const paused = pauseChase(boosted)
  assert.equal(stepChase(paused, idle, 1000), paused); assert.equal(dashChase(paused, 1), paused)
  let active = startChase(paused)
  for (let i = 0; i < 3; i++) active = stepChase(active, idle, 1000)
  assert.ok(dashChase(active, 0).players[0].dashReadyAt > active.elapsed)
})
test('the match ends at exactly one minute and its winner uses captures only', () => {
  let s = begin(); s.players[1] = { ...s.players[1], score: 3 }
  for (let i = 0; i < 60; i++) s = stepChase(s, idle, 1000)
  assert.equal(s.phase, 'over'); assert.equal(s.elapsed, CHASE_DURATION); assert.equal(s.winner, 1)
  assert.equal(stepChase(s, idle, 1000), s); assert.equal(dashChase(s, 0), s)
  const replay = startChase(s)
  assert.equal(replay.phase, 'playing'); assert.equal(replay.elapsed, 0); assert.equal(replay.hunter, 1); assert.deepEqual(replay.players.map(p => p.score), [0, 0])
})
test('a no-capture match is a draw and invalid deltas never move its clock', () => {
  const s = begin()
  for (const dt of [0, -1, NaN, Infinity]) assert.equal(stepChase(s, idle, dt), s)
  const last: Chase = { ...s, elapsed: CHASE_DURATION - 9 }
  assert.equal(stepChase(last, idle, 50).winner, 'draw')
})
test('simulation never mutates previous players or its input', () => {
  const s = begin(), frozen = JSON.stringify(s), input: [Vector, Vector] = [{ x: 1, y: -1 }, { x: -1, y: 1 }]
  const oldInput = JSON.stringify(input)
  stepChase(dashChase(s, 0), input, 400)
  assert.equal(JSON.stringify(s), frozen); assert.equal(JSON.stringify(input), oldInput)
})
test('opposite viewpoints send both forward buttons toward the board center', () => {
  assert.equal(worldDirection('up', 0, true), 'right'); assert.equal(worldDirection('up', 1, true), 'left')
  assert.equal(worldDirection('up', 0, false), 'up'); assert.equal(worldDirection('up', 1, false), 'down')
  assert.equal(worldDirection('right', 0, true), 'down'); assert.equal(worldDirection('right', 1, true), 'up')
  assert.equal(worldDirection('left', 1, false), 'right')
})
