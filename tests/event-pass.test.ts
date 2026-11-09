import assert from 'node:assert/strict'
import { test } from 'node:test'
import { consumePassUrl, normalizeEventCode } from '../src/events/pass.ts'

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
