import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceGroove, beginGrooveCut, cutGroove, discPosition, GROOVE_DIRECTIONS, GROOVE_DURATION, initialGroove, keyCutGroove, setGroovePlaying, type GrooveCutDirection, type GrooveState } from '../src/arcade/groove.ts'

function sequenceAt(elapsed = 0): GrooveState {
  let state = advanceGroove({ ...setGroovePlaying(initialGroove(), true), wave: 3, elapsed }, 50)
  state = { ...state, nextWaveAt: Infinity }
  for (let i = 0; i < 12; i++) state = advanceGroove(state, 50)
  return state
}

test('directional discs validate all four senses, not only their axes', () => {
  for (const direction of Object.keys(GROOVE_DIRECTIONS) as GrooveCutDirection[]) {
    const source = sequenceAt(), v = GROOVE_DIRECTIONS[direction]
    const disc = { ...source.discs[0], direction, axis: v.x ? 'x' as const : 'y' as const, sequence: undefined, step: undefined }
    const state = { ...source, discs: [disc], cutSequence: null }, p = discPosition(disc, state.flightTime)
    const from = { x: p.x - v.x * 80, y: p.y - v.y * 80 }, to = { x: p.x + v.x * 80, y: p.y + v.y * 80 }
    const wrong = cutGroove(state, to, from)
    assert.equal(wrong.score, 0); assert.equal(wrong.hits, 0); assert.equal(wrong.lives, 5); assert.equal(wrong.discs.length, 1)
    assert.match(wrong.message, new RegExp(v.label))
    const correct = cutGroove(wrong, from, to)
    assert.equal(correct.score, 200); assert.equal(correct.hits, 1); assert.equal(correct.discs.length, 0)
    assert.equal(state.score, 0); assert.equal(state.discs.length, 1)
    assert.equal(keyCutGroove(state, disc.layer, direction).score, correct.score)
    assert.equal(cutGroove(state, { x: p.x - v.y * 80, y: p.y + v.x * 80 }, { x: p.x + v.y * 80, y: p.y - v.x * 80 }).score, 0)
  }
})

test('a numbered sequence rejects out-of-order cuts and awards its bonus exactly once', () => {
  const state = sequenceAt(), [first, second] = state.discs
  assert.deepEqual(state.cutSequence?.directions, ['up', 'down'])
  const wrong = keyCutGroove(state, second.layer, 'down')
  assert.equal(wrong.hits, 0); assert.equal(wrong.lives, 5); assert.equal(wrong.cutSequence?.next, 0)
  assert.match(wrong.message, /PRIMERO EL DISCO 1/)
  const one = keyCutGroove(wrong, first.layer, 'up')
  assert.equal(one.score, 200); assert.equal(one.cutSequence?.next, 1); assert.equal(state.cutSequence?.next, 0)
  const two = keyCutGroove(one, second.layer, 'down')
  assert.equal(two.score, 700); assert.equal(two.cutSequence, null); assert.equal(two.sequences, 1)
  assert.equal(keyCutGroove(two, second.layer, 'down').score, 700)
})

test('one swipe processes intersections in physical order, even when discs are stored backwards', () => {
  const base = sequenceAt(), id = base.cutSequence!.id
  const first = { ...base.discs[0], direction: 'left' as const, axis: 'x' as const, x: 250, step: 0 }
  const second = { ...base.discs[1], direction: 'left' as const, axis: 'x' as const, x: 400, step: 1 }
  const state = { ...base, discs: [first, second], cutSequence: { id, next: 0, directions: ['left', 'left'] as GrooveCutDirection[] } }
  const y = discPosition(first, state.flightTime).y
  const reverse = cutGroove(beginGrooveCut(state), { x: 490, y }, { x: 150, y })
  assert.equal(reverse.hits, 1); assert.equal(reverse.sequences, 0); assert.equal(reverse.cutSequence?.next, 1)
  const forward = cutGroove(beginGrooveCut({ ...state, discs: [{ ...second, step: 0 }, { ...first, step: 1 }] }), { x: 490, y }, { x: 150, y })
  assert.equal(forward.hits, 2); assert.equal(forward.sequences, 1); assert.equal(forward.multiCuts, 1); assert.equal(forward.score, 800)
})

test('a failed sequence costs one life in total and cannot leave an unreachable next target', () => {
  let state = sequenceAt()
  const original = state
  for (let i = 0; i < 60; i++) state = advanceGroove(state, 50)
  assert.equal(state.lives, 4); assert.equal(state.misses, 1); assert.equal(state.score, 0); assert.equal(state.sequences, 0)
  assert.equal(state.cutSequence, null); assert.equal(state.discs.length, 0)
  assert.notEqual(original.cutSequence, null)
  assert.equal(advanceGroove(state, 100).misses, 1)
  let partial = keyCutGroove(original, original.discs[0].layer, 'up')
  for (let i = 0; i < 60; i++) partial = advanceGroove(partial, 50)
  assert.equal(partial.score, 200); assert.equal(partial.misses, 1); assert.equal(partial.cutSequence, null)
})

test('pause preserves sequence progress; expiry and the final life clear every target', () => {
  const base = sequenceAt(), one = keyCutGroove(base, base.discs[0].layer, 'up'), paused = setGroovePlaying(one, false)
  assert.equal(advanceGroove(paused, 5000), paused)
  assert.equal(paused.cutSequence?.next, 1)
  assert.equal(keyCutGroove(setGroovePlaying(paused, true), base.discs[1].layer, 'down').score, 700)
  let lastLife = { ...base, lives: 1 }
  for (let i = 0; i < 60; i++) lastLife = advanceGroove(lastLife, 50)
  assert.equal(lastLife.status, 'over'); assert.equal(lastLife.cutSequence, null); assert.equal(lastLife.discs.length, 0)
  const complete = advanceGroove({ ...base, elapsed: GROOVE_DURATION - 50 }, 50)
  assert.equal(complete.status, 'complete'); assert.equal(complete.cutSequence, null)
})

test('live waves introduce two directions, expand to three targets and cover all four senses', () => {
  let state = setGroovePlaying(initialGroove(), true)
  const directions = new Set<string>(), lengths = new Set<number>()
  for (let i = 0; i < 600; i++) {
    state = advanceGroove({ ...state, lives: 1000 }, 100)
    if (state.cutSequence) {
      state.cutSequence.directions.forEach(d => directions.add(d)); lengths.add(state.cutSequence.directions.length)
      for (const disc of state.discs.filter(d => d.sequence === state.cutSequence!.id)) {
        assert.ok(disc.x >= 140 && disc.x <= 500); assert.equal(disc.direction, state.cutSequence.directions[disc.step!])
      }
    }
  }
  assert.deepEqual([...directions].sort(), ['down', 'left', 'right', 'up'])
  assert.deepEqual([...lengths].sort(), [2, 3])
})

test('slowed flight cannot replace an active sequence with another wave', () => {
  let state = { ...sequenceAt(41000), wave: 7, nextWaveAt: 41001, freezeUntil: 60000, lives: 1000 }
  const id = state.cutSequence!.id
  for (let i = 0; i < 40; i++) {
    state = advanceGroove(state, 100)
    assert.equal(state.cutSequence?.id, id)
    assert.ok(state.discs.filter(d => d.sequence !== undefined).every(d => d.sequence === id))
  }
})
