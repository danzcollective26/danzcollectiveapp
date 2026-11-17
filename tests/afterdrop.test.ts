import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EARLY_MS, GOOD_MS, IDLE_INPUT, LOOT_CAP, PERFECT_MS, RECORD_KEY, SESSION_MS, TRAVEL_BEATS,
  balancePair, bpmAt, committedScore, createDrop, dropMultiplier, dropPayout, earlyLane, entityDepth,
  gradeTiming, intensityAt, obstacleWeight, pauseDrop, placeDropEntity, planSpawn, projectDrop,
  readAfterDropRecord, resumeDrop, saveAfterDropRecord, startDrop, stepDrop, type Drop, type DropInput, type RecordStore,
} from '../src/arcade/afterdrop/logic.ts'

function memory(): RecordStore {
  const data = new Map<string, string>()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) } }
}

function playing(seed = 1): Drop {
  return startDrop(createDrop(seed))
}

function quiet(state: Drop, patch: Partial<Drop>): Drop {
  return { ...state, nextBeat: 1000, ...patch }
}

const collect: DropInput = { lane: null, collect: true, extract: false }
const extract: DropInput = { lane: null, collect: false, extract: true }

test('timing windows name PERFECTO, BIEN and FALLO on both sides of the beat', () => {
  assert.equal(gradeTiming(0), 'PERFECTO')
  assert.equal(gradeTiming(PERFECT_MS), 'PERFECTO')
  assert.equal(gradeTiming(-PERFECT_MS), 'PERFECTO')
  assert.equal(gradeTiming(PERFECT_MS + 0.1), 'BIEN')
  assert.equal(gradeTiming(GOOD_MS), 'BIEN')
  assert.equal(gradeTiming(-(GOOD_MS)), 'BIEN')
  assert.equal(gradeTiming(GOOD_MS + 0.1), 'FALLO')
  assert.equal(gradeTiming(Number.NaN), 'FALLO')
})

test('a centered perfect pays more loot and combo than a late good hit', () => {
  let perfect = quiet(playing(), { elapsed: 12000, beat: 16, lane: 1, combo: 4 })
  perfect = placeDropEntity(perfect, 'vinyl', 1, 16)
  perfect = stepDrop(perfect, collect, 0)
  let good = quiet(playing(), { elapsed: 12000, beat: 16, lane: 1, combo: 4 })
  const late = 16 - (GOOD_MS - 5) / (60000 / bpmAt(12000))
  good = placeDropEntity(good, 'vinyl', 1, late)
  good = stepDrop(good, collect, 0)
  assert.equal(perfect.judgement?.grade, 'PERFECTO')
  assert.equal(good.judgement?.grade, 'BIEN')
  assert.ok((perfect.judgement?.loot ?? 0) > (good.judgement?.loot ?? 0))
  assert.equal(perfect.combo, 6)
  assert.equal(good.combo, 5)
  assert.equal(perfect.perfects, 1)
  assert.equal(good.perfects, 0)
  assert.equal(perfect.entities.find(entity => entity.kind === 'vinyl')?.resolved, true)
})

test('an early tap breaks the combo and leaves the vinyl for the real beat', () => {
  const bpm = bpmAt(12000)
  const arrive = 16 + 200 / (60000 / bpm)
  let state = quiet(playing(), { elapsed: 12000, beat: 16, lane: 1, combo: 4 })
  state = placeDropEntity(state, 'vinyl', 1, arrive)
  const whiff = stepDrop(state, collect, 0)
  assert.equal(whiff.judgement?.grade, 'FALLO')
  assert.equal(whiff.combo, 0)
  assert.equal(whiff.entities[0].resolved, false)
  const held = quiet(whiff, { beat: arrive, combo: 4, judgement: null })
  const hit = stepDrop(held, collect, 0)
  assert.equal(hit.judgement?.grade, 'PERFECTO')
  assert.equal(hit.entities[0].resolved, true)
  assert.ok(hit.carried > whiff.carried)
})

test('a vinyl that leaves the window without a tap is a miss and clears the combo', () => {
  const bpm = bpmAt(8000)
  const arrive = 10
  const beat = arrive + (GOOD_MS + 30) / (60000 / bpm)
  let state = quiet(playing(), { elapsed: 8000, beat, lane: 1, combo: 8 })
  state = placeDropEntity(state, 'vinyl', 1, arrive)
  const missed = stepDrop(state, IDLE_INPUT, 0)
  assert.equal(missed.judgement?.grade, 'FALLO')
  assert.equal(missed.combo, 0)
  assert.equal(missed.entities[0]?.resolved ?? true, true)
})

test('obstacles hit only the occupied lane, and a second one in the same instant does not stack', () => {
  let hit = quiet(playing(), { beat: 9.95, lane: 1, combo: 6, carried: 40 })
  hit = placeDropEntity(hit, 'hater', 1, 10)
  hit = stepDrop(hit, IDLE_INPUT, 50)
  assert.equal(hit.lives, 2)
  assert.equal(hit.combo, 0)
  assert.ok(hit.carried < 40)
  assert.match(hit.message, /HATER/)

  let safe = quiet(playing(), { beat: 9.95, lane: 1, combo: 6, carried: 40 })
  safe = placeDropEntity(safe, 'manager', 0, 10)
  safe = stepDrop(safe, IDLE_INPUT, 50)
  assert.equal(safe.lives, 3)
  assert.equal(safe.combo, 6)
  assert.equal(safe.carried, 40)

  let stacked = quiet(playing(), { beat: 9.95, lane: 1, lives: 3 })
  stacked = placeDropEntity(stacked, 'resaca', 1, 10)
  stacked = placeDropEntity(stacked, 'hater', 1, 10)
  stacked = stepDrop(stacked, IDLE_INPUT, 50)
  assert.equal(stacked.lives, 2)
})

test('the third hit is PARTY OVER and does not bank loot', () => {
  let state = quiet(playing(), { beat: 9.95, lane: 0, lives: 1, carried: 80, banked: 0 })
  state = placeDropEntity(state, 'manager', 0, 10)
  state = stepDrop(state, IDLE_INPUT, 50)
  assert.equal(state.phase, 'over')
  assert.equal(state.closeReason, 'hit')
  assert.equal(state.banked, 0)
  assert.equal(committedScore(state), 0)
  assert.match(state.message, /PARTY OVER/)
  assert.match(state.message, /80/)
})

test('extract banks carried loot times the multiplier, and dying or the eight-minute close does not', () => {
  const live = quiet(playing(), { elapsed: 60000, beat: 40, carried: 40, combo: 10 })
  assert.equal(dropMultiplier(60000, 10), 2.25)
  assert.equal(dropPayout(live), 90)
  const banked = stepDrop(live, extract, 0)
  assert.equal(banked.phase, 'extracted')
  assert.equal(banked.banked, 90)
  assert.equal(committedScore(banked), 90)
  assert.equal(stepDrop(quiet(playing(), { carried: 0 }), extract, 0).phase, 'playing')

  const closed = stepDrop(quiet(playing(), { elapsed: SESSION_MS - 20, carried: 50, combo: 4 }), IDLE_INPUT, 50)
  assert.equal(closed.phase, 'over')
  assert.equal(closed.closeReason, 'time')
  assert.equal(closed.banked, 0)
  assert.match(closed.message, /PARTY OVER/)

  const escaped = stepDrop(quiet(playing(), { elapsed: SESSION_MS - 20, carried: 40, combo: 0 }), extract, 50)
  assert.equal(escaped.phase, 'extracted')
  assert.equal(escaped.banked, dropPayout({ carried: 40, elapsed: SESSION_MS - 20 + 50, combo: 0 }))
  assert.ok(escaped.banked > 40)
})

test('lane changes stay inside three lanes and pause freezes the beat', () => {
  const moved = stepDrop(quiet(playing(), { lane: 1 }), { lane: 0, collect: false, extract: false }, 0)
  assert.equal(moved.lane, 0)
  const stayed = stepDrop(moved, { lane: null, collect: false, extract: false }, 0)
  assert.equal(stayed.lane, 0)
  const paused = pauseDrop(moved)
  assert.equal(paused.phase, 'paused')
  assert.equal(stepDrop(paused, IDLE_INPUT, 1000), paused)
  const again = stepDrop(resumeDrop(paused), IDLE_INPUT, 50)
  assert.ok(again.beat > paused.beat)
  assert.equal(again.phase, 'playing')
  const ready = createDrop()
  assert.equal(pauseDrop(ready), ready)
})

test('the same seed falls the same way, and the opening is a vinyl down the center lane', () => {
  const board = (seed: number, steps: number) => {
    let state = playing(seed)
    for (let step = 0; step < steps; step++) state = stepDrop(state, IDLE_INPUT, 50)
    return state.entities.map(entity => `${entity.kind}:${entity.lane}:${entity.arriveBeat}`).join(',')
  }
  assert.equal(board(7, 80), board(7, 80))
  assert.equal(board(7, 80), board(9, 80))
  assert.equal(board(7, 280), board(7, 280))
  assert.notEqual(board(7, 280), board(9, 280))
  let opening = playing(4)
  for (let step = 0; step < 40; step++) opening = stepDrop(opening, IDLE_INPUT, 50)
  const first = opening.entities.reduce((best, entity) => entity.arriveBeat < best.arriveBeat ? entity : best)
  assert.equal(first.kind, 'vinyl')
  assert.equal(first.lane, 1)
  assert.equal(first.arriveBeat, 1 + TRAVEL_BEATS)
  assert.ok(opening.entities.every(entity => entity.kind === 'vinyl'))
  assert.equal(earlyLane(1), 1)
})

test('intensity, tempo and threat mix climb, and a longer fall meets a hater', () => {
  assert.ok(bpmAt(0) < bpmAt(SESSION_MS / 2))
  assert.ok(bpmAt(SESSION_MS / 2) < bpmAt(SESSION_MS))
  assert.equal(bpmAt(0), 96)
  assert.equal(bpmAt(SESSION_MS), 148)
  assert.ok(intensityAt(0) < intensityAt(EARLY_MS))
  assert.ok(obstacleWeight(0) < obstacleWeight(1))
  assert.ok(dropMultiplier(0, 0) < dropMultiplier(120000, 0))
  assert.ok(dropMultiplier(120000, 0) < dropMultiplier(240000, 12))
  assert.equal(planSpawn(0, 0.99, 0.99, true), 'vinyl')
  assert.equal(planSpawn(0, 0.9, 0.9, false), 'hater')
  assert.equal(planSpawn(0.8, 0.1, 0.1, false), 'vinyl')
  assert.equal(planSpawn(0.8, 0.9, 0.9, false), 'manager')
  assert.equal(planSpawn(0.3, 0.9, 0.6, false), 'resaca')
  assert.equal(planSpawn(0.3, 0.9, 0.2, false), 'hater')
  assert.deepEqual(balancePair('hater', 'manager'), ['hater', 'vinyl'])
  assert.deepEqual(balancePair('vinyl', 'resaca'), ['vinyl', 'resaca'])
  const kinds = new Set<string>()
  let state = playing(11)
  for (let step = 0; step < 700; step++) {
    state = stepDrop(state, IDLE_INPUT, 50)
    for (const entity of state.entities) kinds.add(entity.kind)
  }
  assert.ok(kinds.has('vinyl'))
  assert.ok(kinds.has('hater'))
})

test('depth and the lane projection put the horizon above the player', () => {
  const born = { bornBeat: 4 }
  assert.equal(entityDepth(born, 4), 1)
  assert.equal(entityDepth(born, 8), 0)
  const far = projectDrop(0, 1, 300, 600)
  const near = projectDrop(0, 0, 300, 600)
  assert.ok(far.y < near.y)
  assert.ok(Math.abs(far.x - 150) < Math.abs(near.x - 150))
  assert.ok(far.scale < near.scale)
})

test('local records keep their own namespace and reject corrupt or absurd values', () => {
  const store = memory()
  assert.deepEqual(readAfterDropRecord(store), { schema: 1, score: 0, bestCombo: 0 })
  assert.deepEqual(saveAfterDropRecord(90, 6, store), { schema: 1, score: 90, bestCombo: 6 })
  assert.deepEqual(saveAfterDropRecord(10, 20, store), { schema: 1, score: 90, bestCombo: 6 })
  assert.deepEqual(saveAfterDropRecord(120, 4, store), { schema: 1, score: 120, bestCombo: 4 })
  assert.deepEqual(saveAfterDropRecord(1.5, 1, store), { schema: 1, score: 120, bestCombo: 4 })
  assert.deepEqual(saveAfterDropRecord(-5, 1, store), { schema: 1, score: 120, bestCombo: 4 })
  assert.deepEqual(saveAfterDropRecord(LOOT_CAP + 1, 1, store), { schema: 1, score: 120, bestCombo: 4 })
  assert.deepEqual(saveAfterDropRecord(200, 10000, store), { schema: 1, score: 200, bestCombo: 4 })
  store.setItem(RECORD_KEY, '{')
  assert.equal(readAfterDropRecord(store).score, 0)
  store.setItem(RECORD_KEY, JSON.stringify({ schema: 2, score: 400, bestCombo: 3 }))
  assert.equal(readAfterDropRecord(store).score, 0)
  store.setItem(RECORD_KEY, JSON.stringify({ schema: 1, score: 12.2, bestCombo: 1 }))
  assert.equal(readAfterDropRecord(store).score, 0)
  store.setItem(RECORD_KEY, JSON.stringify({ schema: 1, score: 12 }))
  assert.equal(readAfterDropRecord(store).score, 0)
  assert.equal(RECORD_KEY, 'danz-afterdrop-record-v1')
})
