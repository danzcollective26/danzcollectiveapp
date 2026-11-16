export type Haptic = 'tap' | 'selection' | 'success'
export const FEEDBACK_KEY = 'danz-feedback-v1'
export const FEEDBACK_CHANGE = 'danz-feedback-change'
export function readFeedback() {
  try {
    const value = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '{}')
    return { haptics: value?.haptics !== false, sounds: value?.sounds === true }
  } catch { return { haptics: true, sounds: false } }
}
export function saveFeedback(value: ReturnType<typeof readFeedback>) {
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(value)) } catch { /* Optional preference. */ }
  window.dispatchEvent(new Event(FEEDBACK_CHANGE))
}
let lastPulse = -Infinity
/** A short acknowledgement, never required for the action to succeed. */
export function haptic(kind: Haptic = 'tap'): boolean {
  try {
    if (!readFeedback().haptics || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof navigator.vibrate !== 'function' || navigator.userActivation?.hasBeenActive === false) return false
    const now = performance.now()
    if (now - lastPulse < 60) return false
    lastPulse = now
    return navigator.vibrate(kind === 'success' ? [12, 35, 18] : kind === 'selection' ? 6 : 10)
  } catch { return false }
}
