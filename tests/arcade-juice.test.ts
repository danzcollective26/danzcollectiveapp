import assert from 'node:assert/strict'
import { test } from 'node:test'
import { burstOffsets } from '../src/arcade/feel/juice.ts'
import { snakeJuiceEvents } from '../src/arcade/snakeJuice.ts'

const base = { score: 0, over: false, won: false, levelUp: false, running: true, mode: 'classic' as const, steps: 10 }

test('burst offsets are bounded, deterministic and spread around the origin', () => {
  assert.equal(burstOffsets(0, 30).length, 1)
  assert.equal(burstOffsets(500, 30).length, 48)
  const ring = burstOffsets(8, 40)
  assert.deepEqual(ring, burstOffsets(8, 40))
  assert.ok(ring.some(p => p.x > 0) && ring.some(p => p.x < 0) && ring.some(p => p.y > 0) && ring.some(p => p.y < 0))
  for (const p of ring) assert.ok(Math.hypot(p.x, p.y) <= 40 * 1.01)
})

test('Snake feedback follows real state changes only', () => {
  assert.deepEqual(snakeJuiceEvents(null, base), [])
  assert.deepEqual(snakeJuiceEvents(base, { ...base, steps: 11 }), [])
  assert.deepEqual(snakeJuiceEvents(base, { ...base, score: 10, steps: 11 }), ['eat'])
  assert.deepEqual(snakeJuiceEvents({ ...base, score: 40 }, { ...base, score: 50, steps: 11 }), ['eat', 'level'])
  assert.deepEqual(snakeJuiceEvents({ ...base, mode: 'maze', score: 40 }, { ...base, mode: 'maze', score: 50, levelUp: true, running: false, steps: 11 }), ['eat', 'stage'])
  assert.deepEqual(snakeJuiceEvents(base, { ...base, over: true, running: false, steps: 11 }), ['crash'])
  assert.deepEqual(snakeJuiceEvents({ ...base, mode: 'maze' }, { ...base, mode: 'maze', score: 10, won: true, levelUp: true, steps: 11 }), ['eat', 'won'])
})

test('a reset or new run never replays old celebrations', () => {
  assert.deepEqual(snakeJuiceEvents({ ...base, score: 90, steps: 300 }, { ...base, score: 0, steps: 0 }), [])
  assert.deepEqual(snakeJuiceEvents({ ...base, over: true, steps: 40 }, { ...base, over: true, steps: 40 }), [])
})
