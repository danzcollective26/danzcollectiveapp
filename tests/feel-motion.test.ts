import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runViewTransition } from '../src/feel/motion.ts'

test('section changes run immediately when view transitions are unavailable', () => {
  const previous = globalThis.document
  let ran = false
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: { classList: { contains: () => false } } },
  })
  runViewTransition(() => { ran = true })
  assert.equal(ran, true)
  Object.defineProperty(globalThis, 'document', { configurable: true, value: previous })
})

test('an active arcade session skips the section transition', () => {
  const previous = globalThis.document
  let transitioned = false
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      documentElement: { classList: { contains: (name: string) => name === 'arcade-session' } },
      startViewTransition: () => { transitioned = true },
    },
  })
  let ran = false
  runViewTransition(() => { ran = true })
  assert.equal(ran, true)
  assert.equal(transitioned, false)
  Object.defineProperty(globalThis, 'document', { configurable: true, value: previous })
})
