import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceGroove, GROOVE_DURATION, initialGroove, SCRATCH_PATTERNS, scratchGroove, scratchOffset, setGroovePlaying, type GrooveState } from '../src/arcade/groove.ts'

function until(state: GrooveState, at: number) {
  while (state.status === 'playing' && state.elapsed < at) state = advanceGroove(state, Math.min(20, at - state.elapsed))
  return state
}
function first(bpm = 120) { return advanceGroove(setGroovePlaying(initialGroove(27, 'scratch', 'katana', bpm), true), 20) }

test('Scratch reports early, perfect and late accepted gestures without changing phrase scoring', () => {
  for (const bpm of [120, 127]) {
    let state = first(bpm), x = 260
    const phrase = state.scratch!, notes = SCRATCH_PATTERNS[phrase.pattern].steps
    state = scratchGroove(state, x)
    for (const [i, offset] of [-150, 0, 150, 0].entries()) {
      state = until(state, phrase.firstAt + scratchOffset(state, notes[i].offset) + offset)
      const before = state
      x += notes[i].direction * notes[i].distance
      state = scratchGroove(state, x)
      assert.equal(state.scratchGestures, i + 1)
      assert.equal(state.scratchFeedback?.kind, offset < -95 ? 'early' : offset > 95 ? 'late' : 'perfect')
      assert.ok(Math.abs(state.scratchFeedback!.offset - offset) < .001)
      assert.equal(before.scratchGestures, i)
      if (i < 3) assert.equal(state.score, 0)
    }
    assert.equal(state.scratches, 1); assert.equal(state.perfects, 2); assert.equal(state.score, 350)
  }
})

test('wrong direction, premature motion and releasing cannot inflate Scratch precision', () => {
  let state = scratchGroove(first(), 260)
  state = scratchGroove(state, 330)
  assert.equal(state.scratchGestures, 0); assert.equal(state.scratchFeedback, null)
  state = until(state, state.scratch!.firstAt)
  state = scratchGroove(state, 190)
  assert.equal(state.scratchGestures, 0); assert.equal(state.scratch?.turns, 0)
  state = scratchGroove(state, 260)
  const feedback = state.scratchFeedback
  assert.equal(state.scratchGestures, 1); assert.equal(state.perfects, 1)
  state = scratchGroove(state, 260, true)
  state = scratchGroove(state, 350)
  assert.equal(state.scratchGestures, 1); assert.equal(state.scratchFeedback, feedback)
  const paused = setGroovePlaying(state, false)
  assert.equal(advanceGroove(paused, 100), paused)
  assert.equal(scratchGroove(paused, 200), paused)
})

test('a lost phrase retains its measured gestures and costs one life without granting points', () => {
  let state = scratchGroove(first(), 260)
  state = until(state, state.scratch!.firstAt)
  state = scratchGroove(state, 320)
  state = until(state, state.scratch!.firstAt + 500 + state.scratch!.window + 1)
  assert.equal(state.lives, 4); assert.equal(state.misses, 1); assert.equal(state.score, 0)
  assert.equal(state.scratchGestures, 1); assert.equal(state.perfects, 1)
  assert.equal(state.scratch, null)
})

test('a full minute of Scratch uses all four patterns and keeps gesture statistics through all stages', () => {
  for (const bpm of [120, 127]) {
    let state = first(bpm), x = 260, gestures = 0
    const patterns = new Set<number>()
    while (state.status === 'playing') {
      const phrase = state.scratch
      if (!phrase) { state = advanceGroove(state, 20); continue }
      patterns.add(phrase.pattern)
      const note = SCRATCH_PATTERNS[phrase.pattern].steps[phrase.turns]
      const target = phrase.firstAt + scratchOffset(state, note.offset)
      if (target >= GROOVE_DURATION) { state = until(state, GROOVE_DURATION); break }
      state = until(state, target)
      state = scratchGroove(state, x)
      x += note.direction * note.distance
      state = scratchGroove(state, x); gestures++
    }
    assert.equal(state.status, 'complete'); assert.equal(state.elapsed, GROOVE_DURATION)
    assert.equal(patterns.size, 4); assert.equal(state.lives, 5); assert.equal(state.misses, 0)
    assert.ok(state.scratches >= 15); assert.equal(state.scratchGestures, gestures); assert.equal(state.perfects, gestures)
    const fresh = initialGroove(27, 'scratch', 'katana', bpm)
    assert.equal(fresh.scratchGestures, 0); assert.equal(fresh.scratchFeedback, null)
  }
})
