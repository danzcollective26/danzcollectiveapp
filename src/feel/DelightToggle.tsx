import { useEffect, useState } from 'react'
import { DELIGHT_EVENT, delightMuted, setDelightMuted } from './sounds'

export default function DelightToggle() {
  const [muted, setMuted] = useState(delightMuted)
  useEffect(() => {
    const refresh = () => setMuted(delightMuted())
    window.addEventListener(DELIGHT_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(DELIGHT_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return (
    <button type="button" className="delight-toggle" aria-pressed={!muted} aria-label={muted ? 'Activar sonidos de la app' : 'Silenciar sonidos de la app'} onClick={() => setDelightMuted(!muted)}>
      {muted ? 'SONIDOS OFF' : 'SONIDOS ON'}
    </button>
  )
}
