import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGroovePreferences } from '../src/arcade/groovePreferences.ts'

test('new browsers and corrupt local preferences keep the classic accessible defaults', () => {
  for (const raw of [null, '', 'oops', 'null', '[]', 'true', '42']) assert.deepEqual(parseGroovePreferences(raw), { style: 'classic', effects: 'auto', bestCuts: 0 })
})
test('the cosmetic unlock requires twenty real cuts in one recorded session', () => {
  for (const bestCuts of [0, 19, -1, 1.5, '20', 10001, null]) {
    const p = parseGroovePreferences(JSON.stringify({ bestCuts, style: 'club', effects: 'lite' }))
    assert.equal(p.style, 'classic'); assert.equal(p.effects, 'lite')
  }
  assert.deepEqual(parseGroovePreferences('{"bestCuts":20,"style":"club","effects":"lite"}'), { bestCuts: 20, style: 'club', effects: 'lite' })
})
test('valid progress survives an unknown future style without altering the session rules', () => {
  assert.deepEqual(parseGroovePreferences('{"bestCuts":32,"style":"future","effects":"future","lives":99,"points":9999}'), { bestCuts: 32, style: 'classic', effects: 'auto' })
})
