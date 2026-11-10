import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepareOffline, type OfflinePreparation } from '../src/pwa/offline.ts'

class Worker extends EventTarget {
  state: ServiceWorkerState
  messages = 0
  constructor(state: ServiceWorkerState) { super(); this.state = state }
  postMessage() { this.messages++ }
}
class Registration extends EventTarget {
  active: Worker | null = null
  installing: Worker | null = null
  waiting: Worker | null = null
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve() }
const nativeRegistration = (registration: Registration) => registration as unknown as ServiceWorkerRegistration
function container(register: ServiceWorkerContainer['register'], ready = new Promise<ServiceWorkerRegistration>(() => {}), controller: Worker | null = null) {
  return { register, ready, controller } as unknown as ServiceWorkerContainer
}
function observer() {
  const states: OfflinePreparation[] = []
  const updates: ServiceWorkerRegistration[] = []
  return { states, updates, options: { onState: (state: OfflinePreparation) => states.push(state), onUpdate: (reg: ServiceWorkerRegistration) => updates.push(reg) } }
}

test('offline readiness requires an activated worker and preserves registration options', async () => {
  const reg = new Registration(); reg.installing = new Worker('installing')
  const seen = observer()
  const stop = prepareOffline(container(async (url, options) => {
    assert.equal(url, '/sw.js'); assert.deepEqual(options, { scope: '/', updateViaCache: 'none' })
    return nativeRegistration(reg)
  }), seen.options)
  await flush()
  assert.deepEqual(seen.states, ['preparing'])
  reg.active = reg.installing; reg.installing = null; reg.active!.state = 'activated'
  reg.active!.dispatchEvent(new Event('statechange'))
  assert.deepEqual(seen.states, ['preparing', 'ready'])
  stop()
})

test('a rejected registration reports unavailable without claiming offline readiness', async () => {
  const seen = observer()
  const stop = prepareOffline(container(async () => { throw new Error('Synthetic browser restriction') }), seen.options)
  await flush()
  assert.deepEqual(seen.states, ['preparing', 'unavailable'])
  stop()
})

test('a pending installation has a deadline and can recover when it really activates later', async () => {
  const pending = deferred<ServiceWorkerRegistration>()
  const seen = observer()
  const stop = prepareOffline(container(() => pending.promise, pending.promise), { ...seen.options, timeoutMs: 5 })
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.deepEqual(seen.states, ['preparing', 'unavailable'])
  const reg = new Registration(); reg.active = new Worker('activated')
  pending.resolve(nativeRegistration(reg)); await flush()
  assert.deepEqual(seen.states, ['preparing', 'unavailable', 'ready'])
  stop()
})

test('a failed install reports unavailable even when the native ready promise never resolves', async () => {
  const reg = new Registration(); const installing = new Worker('installing'); reg.installing = installing
  const seen = observer()
  const stop = prepareOffline(container(async () => nativeRegistration(reg)), seen.options)
  await flush()
  reg.installing = null; installing.state = 'redundant'; installing.dispatchEvent(new Event('statechange'))
  assert.deepEqual(seen.states, ['preparing', 'unavailable'])
  stop()
})

test('an existing shell survives an update failure and waiting updates require an explicit choice', async () => {
  const reg = new Registration(); reg.active = new Worker('activated'); const installing = new Worker('installing'); reg.installing = installing
  const seen = observer()
  const stop = prepareOffline(container(async () => nativeRegistration(reg), Promise.resolve(nativeRegistration(reg)), reg.active), seen.options)
  await flush()
  reg.waiting = installing; reg.installing = null; installing.state = 'installed'; installing.dispatchEvent(new Event('statechange'))
  assert.deepEqual(seen.updates, [nativeRegistration(reg)])
  assert.equal(installing.messages, 0)
  reg.waiting = null; installing.state = 'redundant'; installing.dispatchEvent(new Event('statechange'))
  assert.deepEqual(seen.states, ['preparing', 'ready'])
  stop()
})

test('disposing an attempt ignores late registration, readiness and worker events', async () => {
  const pending = deferred<ServiceWorkerRegistration>(); const seen = observer()
  const stop = prepareOffline(container(() => pending.promise, pending.promise), seen.options)
  stop()
  const reg = new Registration(); reg.active = new Worker('activated')
  pending.resolve(nativeRegistration(reg)); await flush(); reg.dispatchEvent(new Event('updatefound'))
  assert.deepEqual(seen.states, ['preparing']); assert.deepEqual(seen.updates, [])
})
