export type Pulse = 'tap' | 'confirm'

const patterns: Record<Pulse, number | number[]> = {
  tap: 12,
  confirm: [12, 36, 18],
}

export function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Short vibration on devices that expose it. No-op everywhere else. */
export function pulse(kind: Pulse = 'tap') {
  if (!canVibrate()) return
  try { navigator.vibrate(patterns[kind]) } catch { /* Optional feedback. */ }
}
