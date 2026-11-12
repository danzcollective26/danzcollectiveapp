import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readWithDeadline, READ_TIMEOUT_MS } from '../src/cloud/readWithDeadline.ts'

test('a successful read retains its result and removes its deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let signal!: AbortSignal
  const result = await readWithDeadline(current => { signal = current; return Promise.resolve('authorized') }, new AbortController().signal)
  assert.equal(result, 'authorized')
  t.mock.timers.tick(READ_TIMEOUT_MS + 1)
  assert.equal(signal.aborted, false)
})

test('an unavailable read preserves its original failure', async () => {
  const failure = new Error('Access refused')
  await assert.rejects(readWithDeadline(() => Promise.reject(failure), new AbortController().signal), error => error === failure)
  await assert.rejects(readWithDeadline(() => { throw failure }, new AbortController().signal), error => error === failure)
})

test('a transport that ignores cancellation still times out and cannot replace a retry result', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let resolveLate!: (value: string) => void
  let signal!: AbortSignal
  const pending = readWithDeadline(current => {
    signal = current
    return new Promise<string>(resolve => { resolveLate = resolve })
  }, new AbortController().signal)
  const rejected = assert.rejects(pending, { name: 'TimeoutError' })
  t.mock.timers.tick(READ_TIMEOUT_MS)
  await rejected
  assert.equal(signal.aborted, true)
  const retried = await readWithDeadline(() => Promise.resolve('new album'), new AbortController().signal)
  resolveLate('old album')
  assert.equal(retried, 'new album')
  await assert.rejects(pending, { name: 'TimeoutError' })
})

test('late transport failures are handled after the deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let rejectLate!: (reason: Error) => void
  const pending = readWithDeadline(() => new Promise<never>((_, reject) => { rejectLate = reject }), new AbortController().signal)
  const rejected = assert.rejects(pending, { name: 'TimeoutError' })
  t.mock.timers.tick(READ_TIMEOUT_MS)
  await rejected
  rejectLate(new Error('Late network failure'))
  await Promise.resolve()
})

test('leaving a screen cancels its read without waiting for the deadline', async () => {
  const parent = new AbortController()
  let signal!: AbortSignal
  const pending = readWithDeadline(current => { signal = current; return new Promise<never>(() => {}) }, parent.signal)
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  parent.abort()
  await rejected
  assert.equal(signal.aborted, true)
})

test('an already cancelled screen never starts another request', async () => {
  const parent = new AbortController()
  parent.abort()
  let called = false
  await assert.rejects(readWithDeadline(() => { called = true; return Promise.resolve(null) }, parent.signal), { name: 'AbortError' })
  assert.equal(called, false)
})
