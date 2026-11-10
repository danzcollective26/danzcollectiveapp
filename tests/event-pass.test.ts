import assert from 'node:assert/strict'
import { test } from 'node:test'
import { captureLaunchPass, clearPendingPass, consumePassUrl, normalizeEventCode, PENDING_PASS_KEY, PENDING_PASSES_KEY, readPendingPass, readPendingPasses, savePendingPass } from '../src/events/pass.ts'

test('event codes accept formatting but reject short, overlong and non-alphanumeric values', () => {
  assert.equal(normalizeEventCode(' danz-abcd-1234-5678 '), 'DANZABCD12345678')
  for (const input of ['', 'DANZ', 'A'.repeat(65), 'A'.repeat(300), 'https://wrong.invalid/#pase=ABCD12345678', '<img onerror=alert(1)>']) assert.equal(normalizeEventCode(input), null)
})

test('QR pass is consumed from the fragment without changing the Auth callback code', () => {
  const result = consumePassUrl('https://example.invalid/?code=auth-code#pase=DANZ-ABCD-1234-5678&tab=events')
  assert.equal(result.code, 'DANZABCD12345678')
  assert.equal(result.invalid, false)
  assert.equal(result.url, 'https://example.invalid/?code=auth-code#tab=events')
  assert.ok(!result.url.includes('1234'))
})

test('ambiguous or invalid QR fragments are removed and cannot become a pending pass', () => {
  for (const hash of ['pase=bad', 'pase=ABCD12345678&pase=DIFFERENT1234']) {
    assert.deepEqual(consumePassUrl(`https://example.invalid/#${hash}`), { url: 'https://example.invalid/', code: null, invalid: true })
  }
  assert.deepEqual(consumePassUrl('https://example.invalid/?code=auth-only'), { url: 'https://example.invalid/?code=auth-only', code: null, invalid: false })
})

test('multiple nights and legacy passes survive a reload; clearing one cannot remove a newer QR', () => {
  const values = new Map<string, string>([[PENDING_PASS_KEY, 'FIRSTNIGHT123456']])
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } })
  try {
    assert.deepEqual(readPendingPasses(), ['FIRSTNIGHT123456'])
    assert.equal(savePendingPass('SECONDNIGHT12345'), true)
    assert.equal(savePendingPass('THIRDNIGHT123456'), true)
    assert.deepEqual(readPendingPasses(), ['FIRSTNIGHT123456', 'SECONDNIGHT12345', 'THIRDNIGHT123456'])
    assert.equal(savePendingPass('SECOND-NIGHT-12345'), true)
    assert.equal(readPendingPasses().length, 3)
    assert.equal(clearPendingPass('FIRSTNIGHT123456'), true)
    assert.deepEqual(readPendingPasses(), ['THIRDNIGHT123456', 'SECONDNIGHT12345'])
    assert.equal(readPendingPass(), 'SECONDNIGHT12345')
    assert.equal(clearPendingPass('SECONDNIGHT12345'), true)
    assert.equal(readPendingPass(), 'THIRDNIGHT123456')
    assert.equal(clearPendingPass('THIRDNIGHT123456'), true)
    assert.deepEqual(readPendingPasses(), [])
    assert.equal(values.get(PENDING_PASS_KEY), undefined)
    assert.equal(values.get(PENDING_PASSES_KEY), '[]')
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})

test('a failed browser write preserves the QR URL for recovery and does not claim success', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let replaced = false
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => null,
    setItem: () => { throw new Error('blocked') },
  } })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { href: 'https://danz.invalid/#pase=FIRSTNIGHT123456' },
    history: { state: null, replaceState: () => { replaced = true } },
  } })
  try {
    assert.deepEqual(captureLaunchPass(), { code: 'FIRSTNIGHT123456', invalid: false, saved: false })
    assert.equal(replaced, false)
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else Reflect.deleteProperty(globalThis, 'localStorage')
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
