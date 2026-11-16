import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cancelSectionTransition, transitionSection } from '../src/ui/sectionTransition.ts'
import { haptic, FEEDBACK_KEY } from '../src/ui/haptics.ts'

function environment(values: Record<string, unknown>) {
  const descriptors = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value })
  return () => { cancelSectionTransition(); for (const [key, value] of descriptors) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key) } }
}

test('only the last queued section updates the DOM after rapid navigation', async () => {
  const callbacks: (() => void)[] = [], changes: string[] = []
  let skips = 0
  const restore = environment({ document: { hidden: false, startViewTransition: (callback: () => void) => {
    callbacks.push(callback)
    return { skipTransition: () => skips++, ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: new Promise(() => {}) }
  } }, window: { matchMedia: () => ({ matches: false }) } })
  try {
    transitionSection(() => changes.push('fotos')); transitionSection(() => changes.push('pasaporte'))
    callbacks[0](); callbacks[1](); callbacks[1]()
    assert.deepEqual(changes, ['pasaporte']); assert.equal(skips, 1)
    await Promise.resolve()
  } finally { restore() }
})

test('unsupported, reduced-motion and failed snapshot paths always keep navigation usable', async () => {
  let updates = 0
  const doc: { hidden: boolean; startViewTransition?: (callback: () => void) => unknown } = { hidden: false }
  const media = { matches: false }
  const restore = environment({ document: doc, window: { matchMedia: () => media } })
  try {
    transitionSection(() => updates++)
    doc.startViewTransition = () => { throw new Error('snapshot unavailable') }
    transitionSection(() => updates++)
    media.matches = true; transitionSection(() => updates++)
    media.matches = false
    doc.startViewTransition = () => ({ skipTransition() {}, ready: Promise.reject(new Error('skipped')), updateCallbackDone: Promise.reject(new Error('update skipped')), finished: Promise.reject(new Error('finished skipped')) })
    transitionSection(() => updates++)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(updates, 4)
  } finally { restore() }
})

test('haptics are short, throttled and optional on unsupported or quiet devices', () => {
  const pulses: unknown[] = [], media = { matches: false }, doc = { hidden: false }
  const settings = new Map<string, string>()
  const nav: { vibrate?: (value: unknown) => boolean; userActivation: { hasBeenActive: boolean } } = { vibrate: value => { pulses.push(value); return true }, userActivation: { hasBeenActive: true } }
  const restore = environment({ document: doc, window: { matchMedia: () => media }, navigator: nav, localStorage: { getItem: (key: string) => settings.get(key) ?? null } })
  try {
    assert.equal(haptic('selection'), true); assert.deepEqual(pulses, [6])
    assert.equal(haptic('tap'), false)
    media.matches = true; assert.equal(haptic('success'), false)
    media.matches = false; doc.hidden = true; assert.equal(haptic(), false)
    doc.hidden = false; nav.userActivation.hasBeenActive = false; assert.equal(haptic(), false)
    nav.userActivation.hasBeenActive = true; settings.set(FEEDBACK_KEY, '{"haptics":false}'); assert.equal(haptic(), false)
    settings.clear(); delete nav.vibrate; assert.equal(haptic(), false)
    assert.equal(pulses.length, 1)
  } finally { restore() }
})
