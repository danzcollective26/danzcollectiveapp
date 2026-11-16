import { haptic, readFeedback } from './haptics.ts'
let lastTone = -Infinity
/** One quiet, original tone. Audio is off until the visitor explicitly enables it. */
export async function playAchievementTone() {
  if (!readFeedback().sounds || document.hidden || navigator.userActivation?.hasBeenActive === false || performance.now() - lastTone < 1000) return
  const Audio = window.AudioContext
  if (!Audio) return
  let context: AudioContext | undefined
  let deadline: ReturnType<typeof setTimeout> | undefined
  const close = () => { clearTimeout(deadline); if (context && context.state !== 'closed') void context.close().catch(() => {}) }
  try {
    lastTone = performance.now()
    context = new Audio()
    deadline = setTimeout(close, 700)
    await context.resume()
    if (document.hidden || !readFeedback().sounds || context.state !== 'running') { close(); return }
    const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, now); oscillator.frequency.exponentialRampToValueAtTime(880, now + .09)
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.025, now + .015); gain.gain.exponentialRampToValueAtTime(.0001, now + .15)
    oscillator.connect(gain); gain.connect(context.destination)
    oscillator.onended = close; oscillator.start(now); oscillator.stop(now + .16)
  } catch { close() }
}
export function achievementFeedback() { haptic('success'); void playAchievementTone() }
