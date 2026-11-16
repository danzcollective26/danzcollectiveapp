import { useEffect } from 'react'
import { pulse } from './haptics'

const KEY_CONTROLS = '.primary-btn, .feature, .module, .passport-home-link, .wordmark, .desktop-nav button, .back, .gallery-event-card, .arcade-choice'

/** Light tap on the controls that move someone through the app. */
export default function FeelLayer() {
  useEffect(() => {
    const onPointerUp = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest('button, a')
      if (!control || control.matches(':disabled') || control.closest('.controls, .yeppo, .danz-radio, .game-board')) return
      if (control.matches(KEY_CONTROLS)) pulse('tap')
    }
    document.addEventListener('pointerup', onPointerUp)
    return () => document.removeEventListener('pointerup', onPointerUp)
  }, [])
  return null
}
