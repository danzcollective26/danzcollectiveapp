import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createArena, startArena, pauseArena, placeBomb, stepArena, cellAt, FUSE_MS, type Arena, type ArenaInput } from '../src/arcade/arena/engine.ts'

const idle: ArenaInput = [null, null]
function time(s: Arena, ms: number, input = idle) { for (let t = 0; t < ms; t += 50) s = stepArena(s, input, Math.min(50, ms - t)); return s }
function open(): Arena { const s = startArena(createArena(426)); s.tiles = s.tiles.map((t, i) => t === 2 ? 0 : t); return s }

test('arena generation is deterministic, symmetric and gives both spawns escape routes', () => {
  const a = createArena(42), b = createArena(42)
  assert.deepEqual(a, b)
  assert.deepEqual(a.tiles, [...a.tiles].reverse())
  for (const p of a.players) { assert.equal(a.tiles[cellAt(p.x, p.y)], 0); assert.equal(a.tiles[cellAt(p.x === 1 ? 2 : 8, p.y)], 0); assert.equal(a.tiles[cellAt(p.x, p.y === 1 ? 2 : 6)], 0) }
})
test('simultaneous players move independently and cannot share a destination', () => {
  let s = startArena(createArena())
  s = stepArena(s, ['right', 'left'], 50)
  assert.equal(s.players[0].x, 2); assert.equal(s.players[1].x, 8)
  s.players[0] = { ...s.players[0], x: 3, y: 1, nextMove: 0 }; s.players[1] = { ...s.players[1], x: 5, y: 1, nextMove: 0 }
  s = stepArena(s, ['right', 'left'], 50)
  assert.equal(s.players[0].x, 3); assert.equal(s.players[1].x, 5)
})
test('walls block movement, and held directions repeat at the same bounded cadence', () => {
  const s = startArena(createArena())
  assert.equal(time(s, 500, ['up', null]).players[0].y, 1)
  assert.equal(time(s, 500, ['right', 'left']).players[0].x, 4)
  assert.equal(time(s, 500, ['right', 'left']).players[1].x, 6)
})
test('a player can leave a disc but cannot walk back through it or exceed capacity', () => {
  let s = placeBomb(open(), 0)
  assert.equal(placeBomb(s, 0).bombs.length, 1)
  s = stepArena(s, ['right', null], 50)
  s = time(s, 200)
  s = stepArena(s, ['left', null], 50)
  assert.equal(s.players[0].x, 2)
  s = placeBomb(s, 0); s = time(s, 200, ['right', null]); s = placeBomb(s, 0)
  assert.equal(s.bombs.length, 2)
})
test('a blast destroys the first flight case but stops at cover and speakers', () => {
  let s = open()
  s.players[0] = { ...s.players[0], x: 3, y: 3 }
  s.tiles[cellAt(4, 3)] = 2
  s = placeBomb(s, 0)
  s.players[0] = { ...s.players[0], x: 1, y: 1 }
  s = time(s, FUSE_MS)
  assert.equal(s.tiles[cellAt(4, 3)], 0)
  assert.ok(s.blasts.some(b => b.cell === cellAt(4, 3)))
  assert.ok(!s.blasts.some(b => b.cell === cellAt(5, 3)))
  assert.ok(!s.blasts.some(b => s.tiles[b.cell] === 1))
})
test('discs chain immediately even while the second fuse still has time remaining', () => {
  let s = open()
  s = placeBomb(s, 0); s = time(s, 600)
  s.players[0] = { ...s.players[0], x: 3, y: 1 }
  s = placeBomb(s, 0); s.players[0] = { ...s.players[0], x: 1, y: 7 }
  s = time(s, FUSE_MS - 600)
  assert.equal(s.bombs.length, 0)
  assert.ok(s.blasts.some(b => b.cell === cellAt(5, 1)))
})
test('the disc owner is vulnerable and an eliminated player awards the opponent one round', () => {
  const s = time(placeBomb(open(), 0), FUSE_MS)
  assert.equal(s.players[0].alive, false); assert.equal(s.winner, 1)
  assert.deepEqual(s.scores, [0, 1]); assert.equal(s.phase, 'round-over')
  assert.equal(time(s, 5000).scores[1], 1)
})
test('simultaneous different-range blasts do not depend on the disc processing order', () => {
  const s = open(); s.players[0] = { ...s.players[0], x: 1, y: 7 }
  s.bombs = [{ id: 1, x: 1, y: 1, owner: 0, range: 4, due: 0 }, { id: 2, x: 2, y: 1, owner: 1, range: 1, due: 0 }]
  const a = stepArena(s, idle, 50), b = stepArena({ ...s, bombs: [...s.bombs].reverse() }, idle, 50)
  const cells = (v: Arena) => v.blasts.map(blast => blast.cell).sort((a, b) => a - b)
  assert.deepEqual(cells(a), cells(b))
  assert.ok(!a.blasts.some(blast => blast.cell === cellAt(4, 1)))
})
test('simultaneous eliminations draw without awarding a point to either player', () => {
  let s = open(); s = placeBomb(placeBomb(s, 0), 1); s = time(s, FUSE_MS)
  assert.equal(s.winner, 'draw'); assert.deepEqual(s.scores, [0, 0])
})
test('pausing freezes fuses and movement; resuming requires an explicit action', () => {
  const s = time(placeBomb(open(), 0), 1000)
  const paused = pauseArena(s)
  assert.equal(time(paused, 5000, ['right', 'left']), paused)
  assert.equal(placeBomb(paused, 1), paused)
  assert.equal(startArena(paused).elapsed, 1000)
})
test('three victories end the duel and a rematch resets round and scores', () => {
  let s = open()
  for (let i = 0; i < 3; i++) { s = time(placeBomb(s, 0), FUSE_MS); if (i < 2) s = startArena(s) }
  assert.equal(s.phase, 'match-over'); assert.deepEqual(s.scores, [0, 3])
  s = startArena(s); assert.equal(s.round, 1); assert.deepEqual(s.scores, [0, 0]); assert.equal(s.phase, 'playing')
})
test('pickups cannot be collected before the blast clears and upgrades are capped', () => {
  let s = open(); s.players[0].range = 4
  s.pickups = [{ cell: cellAt(1, 1), kind: 'range', readyAt: 500 }]
  s = time(s, 450); assert.equal(s.pickups.length, 1)
  s = time(s, 50); assert.equal(s.pickups.length, 0); assert.equal(s.players[0].range, 4)
})
test('a timed-out round draws and simulation never mutates its previous state', () => {
  const s = open(), snapshot = structuredClone(s)
  const next = time(s, 60_000)
  assert.equal(next.winner, 'draw'); assert.equal(next.phase, 'round-over')
  assert.deepEqual(s, snapshot)
})
