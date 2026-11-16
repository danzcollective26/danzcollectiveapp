import { prefersReducedMotion } from './motion.ts'

export const DELIGHT_KEY = 'danz-delight-muted'
export const DELIGHT_EVENT = 'danz-delight-preference'
export type Delight = 'tap' | 'stamp' | 'achieve'

const notes: Record<Delight, number[]> = {
  tap: [620],
  stamp: [523, 659, 784],
  achieve: [392, 523, 659],
}

export function delightMuted() {
  try { return localStorage.getItem(DELIGHT_KEY) === 'true' } catch { return false }
}

export function setDelightMuted(value: boolean) {
  try { localStorage.setItem(DELIGHT_KEY, String(value)) } catch { /* The button still reflects the tap. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DELIGHT_EVENT))
}

let context: AudioContext | null = null

/** Very quiet tones generated in the browser. Nothing plays while muted or without Web Audio. */
export function playDelight(kind: Delight) {
  if (typeof window === 'undefined' || delightMuted() || prefersReducedMotion()) return
  const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  try {
    context ??= new AudioCtx()
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const now = context.currentTime
    notes[kind].forEach((frequency, index) => {
      const osc = context!.createOscillator()
      const gain = context!.createGain()
      osc.type = kind === 'tap' ? 'triangle' : 'sine'
      osc.frequency.value = frequency
      const start = now + index * 0.07
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.03, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
      osc.connect(gain).connect(context!.destination)
      osc.start(start)
      osc.stop(start + 0.18)
    })
  } catch { /* Audio is optional. */ }
}
