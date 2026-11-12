export const READ_TIMEOUT_MS = 12_000

/** Bound a read even when an SDK cannot forward cancellation to its transport. */
export function readWithDeadline<T>(read: (signal: AbortSignal) => PromiseLike<T>, parent: AbortSignal, milliseconds = READ_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    let settled = false
    const finish = (complete: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(deadline)
      parent.removeEventListener('abort', cancel)
      complete()
    }
    const cancel = () => {
      finish(() => reject(parent.reason ?? new DOMException('Read cancelled', 'AbortError')))
      controller.abort()
    }
    const deadline = setTimeout(() => {
      finish(() => reject(new DOMException('Read timed out', 'TimeoutError')))
      controller.abort()
    }, milliseconds)
    if (parent.aborted) { cancel(); return }
    parent.addEventListener('abort', cancel, { once: true })
    try {
      Promise.resolve(read(controller.signal)).then(
        value => finish(() => resolve(value)),
        reason => finish(() => reject(reason)),
      )
    } catch (reason) { finish(() => reject(reason)) }
  })
}
