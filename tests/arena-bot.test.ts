import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createArena, startArena, pauseArena, placeBomb, stepArena, cellAt, type Arena } from '../src/arcade/arena/engine.ts'
import { createArenaBot, thinkArenaBot } from '../src/arcade/arena/bot.ts'

function run(state: Arena, ms: number) {
  let brain = createArenaBot(), dropped = 0
  for (let t = 0; t < ms && state.phase === 'playing'; t += 50) {
    const decision = thinkArenaBot(state, brain, 50); brain = decision.brain
    if (decision.drop) { state = placeBomb(state, 1); dropped++ }
    state = stepArena(state, [null, decision.direction], 50)
  }
  return { state, dropped }
}
function open() { const s = startArena(createArena(426)); s.tiles = s.tiles.map(t => t === 2 ? 0 : t); return s }

test('the local opponent is deterministic, immutable and inactive before play, while paused or dead', () => {
  const state = startArena(createArena(24)), before = structuredClone(state), brain = createArenaBot()
  assert.deepEqual(thinkArenaBot(state, brain, 50), thinkArenaBot(structuredClone(state), createArenaBot(), 50))
  assert.deepEqual(state, before); assert.deepEqual(brain, createArenaBot())
  for (const s of [createArena(), pauseArena(state), { ...state, players: [state.players[0], { ...state.players[1], alive: false }] } as Arena]) {
    assert.deepEqual(thinkArenaBot(s, brain, 50), { brain, direction: null, drop: false })
  }
})
test('an opponent trapped next to a flightcase refuses to place a suicidal disc', () => {
  const s = open(); s.tiles.fill(1); s.tiles[cellAt(1, 1)] = 0; s.tiles[cellAt(9, 7)] = 0; s.tiles[cellAt(8, 7)] = 2
  assert.equal(thinkArenaBot(s, createArenaBot(), 50).drop, false)
  assert.equal(run(s, 2500).dropped, 0)
})
test('the opponent leaves an imminent blast lane instead of walking into its active cells', () => {
  const s = open(); s.players[1] = { ...s.players[1], x: 3, y: 1 }
  s.bombs = [{ id: 1, x: 3, y: 3, owner: 0, range: 2, due: 200 }]
  const decision = thinkArenaBot(s, createArenaBot(), 50)
  assert.ok(decision.direction === 'left' || decision.direction === 'right')
  const result = run(s, 1000).state
  assert.equal(result.players[1].alive, true)
})
test('chain reactions get priority over attacking and the real engine confirms escape', () => {
  const s = open(); s.players[1] = { ...s.players[1], x: 5, y: 3 }
  s.tiles[cellAt(6, 3)] = 2
  s.bombs = [{ id: 1, x: 3, y: 3, owner: 0, range: 2, due: 300 }, { id: 2, x: 5, y: 5, owner: 0, range: 2, due: 1800 }]
  assert.equal(thinkArenaBot(s, createArenaBot(), 50).drop, false)
  assert.equal(run(s, 2200).state.players[1].alive, true)
})
test('the opponent pursues and defeats an idle rival on an open club floor', () => {
  const result = run(open(), 25000)
  assert.equal(result.state.winner, 1); assert.equal(result.state.players[1].alive, true)
  assert.ok(result.dropped > 0)
})
test('seeded matches exercise breaking cover, escaping own discs and reaching the rival', () => {
  for (const seed of [1, 2, 9, 24, 42, 426, 987, 2026]) {
    const state = startArena(createArena(seed)), originalCrates = state.tiles.filter(t => t === 2).length
    const result = run(state, 40000)
    assert.equal(result.state.players[1].alive, true, `own escape, seed ${seed}`)
    assert.equal(result.state.winner, 1, `pursuit, seed ${seed}`)
    assert.ok(result.state.tiles.filter(t => t === 2).length < originalCrates, `cover, seed ${seed}`)
    assert.ok(result.dropped > 0)
  }
})
test('movement cadence bounds planning and no extra disc bypasses capacity', () => {
  const state = startArena(createArena()), brain = { nextThink: 150 }
  assert.equal(thinkArenaBot(state, brain, 50).brain, brain)
  const cooling = { ...state, players: [state.players[0], { ...state.players[1], nextMove: 200 }] } as Arena
  assert.equal(thinkArenaBot(cooling, createArenaBot(), 50).direction, null)
  const paused = pauseArena(state)
  assert.equal(run(paused, 4000).state, paused)
})

test('the same opponent stays within movement and bomb limits at fast, slow and uneven frame rates', () => {
  for (const cadence of [[16], [33], [50], [12, 27, 50, 8, 45]]) {
    let state = startArena(createArena(426)), brain = createArenaBot(), lastMoved = -1000, last = state.players[1]
    for (let i = 0; state.phase === 'playing' && state.elapsed < 25000; i++) {
      const dt = cadence[i % cadence.length], decision = thinkArenaBot(state, brain, dt); brain = decision.brain
      if (decision.drop) state = placeBomb(state, 1)
      state = stepArena(state, [null, decision.direction], dt)
      const p = state.players[1]
      if (p.x !== last.x || p.y !== last.y) {
        assert.ok(state.elapsed - lastMoved >= 160); assert.equal(Math.abs(p.x - last.x) + Math.abs(p.y - last.y), 1)
        lastMoved = state.elapsed; last = p
      }
      assert.ok(state.bombs.filter(b => b.owner === 1).length <= p.capacity)
    }
    assert.equal(state.winner, 1, `cadence ${cadence}`); assert.equal(state.players[1].alive, true)
  }
})
