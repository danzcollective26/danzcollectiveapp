import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceGroove, cutGroove, discPosition, GROOVE_DURATION, grooveStage, initialGroove, keyCutGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, segmentDistance, setGroovePlaying } from '../src/arcade/groove.ts'

function atVinyl() { let state = setGroovePlaying(initialGroove(), true); for (let i = 0; i < 12; i++) state = advanceGroove(state, 50); return state }
test('a fast swipe intersects the whole segment, awards once and advances a streak', () => {
  const state = atVinyl(), disc = state.discs[0], p = discPosition(disc, state.elapsed)
  const next = cutGroove(state, { x: p.x - 100, y: p.y }, { x: p.x + 100, y: p.y })
  assert.equal(next.hits, 1); assert.equal(next.score, 100); assert.equal(next.combo, 1)
  assert.equal(cutGroove(next, { x: p.x - 100, y: p.y }, { x: p.x + 100, y: p.y }).score, 100)
  assert.equal(state.score, 0); assert.equal(state.discs.length, 1)
  assert.equal(next.sparks[0].angle, 0)
  assert.deepEqual(next.sparks[0].velocity, { x: disc.drift, y: -disc.launch + 570 * (state.elapsed - disc.born) / 1000 })
  assert.equal(next.sparks[0].rotation, (state.elapsed - disc.born) * .035 + disc.spin * 40)
  assert.equal(segmentDistance({ x: 40, y: 12 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 12)
})
test('keyboard cuts share hit validation; a tap or invalid coordinates cannot score', () => {
  const state = atVinyl(), p = discPosition(state.discs[0], state.elapsed)
  assert.equal(keyCutGroove(state, state.discs[0].layer).hits, 1)
  assert.equal(cutGroove(state, p, p), state)
  assert.equal(cutGroove(state, p, { x: NaN, y: 0 }), state)
})
test('feedback resets combo, takes one life, and is removed', () => {
  const state = atVinyl(); state.combo = 8; state.discs[0] = { ...state.discs[0], kind: 'feedback' }
  const p = discPosition(state.discs[0], state.elapsed), next = cutGroove(state, { x: p.x - 70, y: p.y }, { x: p.x + 70, y: p.y })
  assert.equal(next.combo, 0); assert.equal(next.lives, 4); assert.equal(next.score, 0); assert.equal(next.discs.length, 0)
})
test('missing a vinyl counts once, ends at zero lives and paused time is frozen', () => {
  let state = atVinyl(); state.lives = 1
  for (let i = 0; i < 80; i++) state = advanceGroove(state, 50)
  assert.equal(state.status, 'over'); assert.equal(state.lives, 0); assert.equal(state.misses, 1)
  const paused = setGroovePlaying(atVinyl(), false)
  assert.equal(advanceGroove(paused, 100), paused)
})
test('scratch requires three real reversals, rewards once and release cannot manufacture a reversal', () => {
  let state = { ...setGroovePlaying(initialGroove(27, 'scratch'), true), scratch: { id: 1, until: 4000, turns: 0, direction: 0, anchor: null as number | null } }
  for (const x of [200, 280, 200, 280]) state = scratchGroove(state, x) as typeof state
  assert.equal(state.scratch?.turns, 2); assert.equal(state.scratches, 0)
  state = scratchGroove(state, 200) as typeof state
  assert.equal(state.scratches, 1); assert.equal(state.scratch, null); assert.equal(state.score, 400)
  assert.equal(scratchGroove(state, 280).score, 400)
  const started = { ...setGroovePlaying(initialGroove(27, 'scratch'), true), scratch: { id: 1, until: 4000, turns: 1, direction: 1, anchor: 250 as number | null } }
  const released = scratchGroove(started, 250, true)
  assert.equal(released.scratch?.turns, 1); assert.equal(scratchGroove(released, 180).scratch?.turns, 1)
})
test('scratch windows are deterministic, do not overlap vinyls, and expire once', () => {
  let a = setGroovePlaying(initialGroove(82, 'scratch'), true), b = setGroovePlaying(initialGroove(82, 'scratch'), true)
  for (let i = 0; i < 20; i++) { a = advanceGroove({ ...a, lives: 100 }, 50); b = advanceGroove({ ...b, lives: 100 }, 50) }
  assert.deepEqual(a, b); assert.ok(a.scratch); assert.equal(a.discs.length, 0)
  const misses = a.misses
  for (let i = 0; i < 61; i++) a = advanceGroove(a, 50)
  assert.equal(a.misses, misses + 1); assert.equal(a.scratch, null)
})
test('three stages finish at one minute and over/complete do not keep moving', () => {
  let state = setGroovePlaying(initialGroove(), true)
  for (let i = 0; i < GROOVE_DURATION / 100; i++) state = advanceGroove({ ...state, lives: 1000 }, 100)
  assert.equal(state.status, 'complete'); assert.equal(state.elapsed, GROOVE_DURATION)
  assert.equal(advanceGroove(state, 100), state)
  assert.equal(grooveStage(0), 1); assert.equal(grooveStage(20000), 2); assert.equal(grooveStage(40000), 3)
})
test('vinyl and scratch sessions have separate challenges without song reconstruction', () => {
  let cut = setGroovePlaying(initialGroove(), true), scratch = setGroovePlaying(initialGroove(27, 'scratch'), true)
  for (let i = 0; i < 200; i++) {
    cut = advanceGroove({ ...cut, lives: 100 }, 50); scratch = advanceGroove({ ...scratch, lives: 100 }, 50)
    assert.equal(cut.scratch, null); assert.equal(scratch.discs.length, 0)
  }
  assert.equal(cut.mode, 'cut'); assert.equal(scratch.mode, 'scratch')
  assert.equal('levels' in cut, false)
})
test('practice records are distinct for both modes and reject invalid values', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } })
  try {
    saveGrooveRecord(100, 'cut'); saveGrooveRecord(400, 'scratch')
    assert.equal(readGrooveRecord('cut'), 100); assert.equal(readGrooveRecord('scratch'), 400)
    assert.equal(saveGrooveRecord(NaN, 'cut'), 100); assert.equal(saveGrooveRecord(-1, 'scratch'), 400)
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage') }
})
