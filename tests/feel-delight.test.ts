import assert from 'node:assert/strict'
import { test } from 'node:test'
import { playDelight } from '../src/feel/sounds.ts'

test('delight sounds do nothing when the browser has no audio engine', () => {
  assert.doesNotThrow(() => playDelight('stamp'))
  assert.doesNotThrow(() => playDelight('achieve'))
})
