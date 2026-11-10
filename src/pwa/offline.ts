export type OfflinePreparation = 'preparing' | 'ready' | 'unavailable'

type OfflineObserver = {
  onState: (state: OfflinePreparation) => void
  onUpdate: (registration: ServiceWorkerRegistration) => void
  timeoutMs?: number
}

/** Observe the native install without activating updates or deleting stored data. */
export function prepareOffline(container: ServiceWorkerContainer, observer: OfflineObserver): () => void {
  let current = true
  let ready = false
  let state: OfflinePreparation = 'preparing'
  const cleanups: (() => void)[] = []
  const registrations = new Set<ServiceWorkerRegistration>()
  const workers = new Set<ServiceWorker>()
  observer.onState(state)

  const emit = (next: OfflinePreparation) => {
    if (!current || state === next) return
    state = next
    observer.onState(next)
  }
  const fail = () => {
    if (!current || ready) return
    clearTimeout(timeout)
    emit('unavailable')
  }
  const succeed = () => {
    if (!current || ready) return
    ready = true
    clearTimeout(timeout)
    emit('ready')
  }
  const timeout = setTimeout(fail, observer.timeoutMs ?? 20_000)

  const watch = (registration: ServiceWorkerRegistration) => {
    if (!current) return
    const inspect = () => {
      if (!current) return
      if (registration.active?.state === 'activated') succeed()
      if (registration.waiting && container.controller) observer.onUpdate(registration)
      for (const worker of [registration.installing, registration.waiting, registration.active]) {
        if (!worker || workers.has(worker)) continue
        workers.add(worker)
        const changed = () => {
          inspect()
          if (worker.state === 'redundant' && !registration.active && !registration.waiting) fail()
        }
        worker.addEventListener('statechange', changed)
        cleanups.push(() => worker.removeEventListener('statechange', changed))
        if (worker.state === 'redundant' && !registration.active && !registration.waiting) fail()
      }
    }
    if (!registrations.has(registration)) {
      registrations.add(registration)
      registration.addEventListener('updatefound', inspect)
      cleanups.push(() => registration.removeEventListener('updatefound', inspect))
    }
    inspect()
  }

  // An existing active shell stays usable even when checking for an update fails.
  try { void container.ready.then(watch, fail) } catch { fail() }
  try { void container.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(watch, fail) } catch { fail() }

  return () => {
    current = false
    clearTimeout(timeout)
    cleanups.forEach(cleanup => cleanup())
  }
}
