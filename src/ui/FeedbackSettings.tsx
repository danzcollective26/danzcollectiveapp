import { useEffect, useState } from 'react'
import { FEEDBACK_CHANGE, haptic, readFeedback, saveFeedback } from './haptics'
import { playAchievementTone } from './achievementFeedback'
import './premium.css'

export default function FeedbackSettings() {
  const [preferences, setPreferences] = useState(readFeedback)
  useEffect(() => {
    const refresh = () => setPreferences(readFeedback())
    window.addEventListener(FEEDBACK_CHANGE, refresh); window.addEventListener('storage', refresh)
    return () => { window.removeEventListener(FEEDBACK_CHANGE, refresh); window.removeEventListener('storage', refresh) }
  }, [])
  const toggle = (key: keyof typeof preferences) => {
    const next = { ...preferences, [key]: !preferences[key] }
    saveFeedback(next); setPreferences(next); haptic('selection')
    if (key === 'sounds' && next.sounds) void playAchievementTone()
  }
  return <div className="feedback-settings" role="group" aria-label="Sensaciones de la app"><span>PEQUEÑOS DETALLES<small>Se guardan en este navegador.</small></span>
    <button type="button" className="outline-btn" aria-pressed={preferences.haptics} onClick={() => toggle('haptics')}>VIBRACIÓN {preferences.haptics ? 'ON' : 'OFF'}</button>
    <button type="button" className="outline-btn" aria-pressed={preferences.sounds} onClick={() => toggle('sounds')}>SONIDO DE SELLOS {preferences.sounds ? 'ON' : 'OFF'}</button>
  </div>
}
