import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { useIdentity } from './useIdentity'
import './InstagramWelcome.css'

const dismissedKey = (userId: string) => 'danz-instagram-welcome-v1:' + userId
function wasDismissed(userId: string) {
  try { return localStorage.getItem(dismissedKey(userId)) === '1' } catch { return false }
}

export default function InstagramWelcome({ onConnect }: { onConnect: () => void }) {
  const { user, loading: authLoading } = useAuth()
  const { data, loading, error } = useIdentity()
  const [dismissedFor, setDismissedFor] = useState('')
  if (!user || authLoading || loading || error || !data || data.verified || data.status === 'pending' || dismissedFor === user.id || wasDismissed(user.id)) return null
  const dismiss = () => {
    setDismissedFor(user.id)
    try { localStorage.setItem(dismissedKey(user.id), '1') } catch { /* Only suppress for this session. */ }
  }
  return <aside className="danz-instagram-welcome" aria-label="Invitación a vincular Instagram">
    <div className="danz-instagram-welcome-copy">
      <span className="danz-instagram-welcome-eyebrow">TU NUEVA CUENTA / DANZ COLLECTIVE</span>
      <h2>¿VINCULAMOS TU INSTAGRAM?</h2>
      <p>Conecta tu perfil para identificarte en DANZ y, cuando esté disponible, participar en rankings y DANZPOINTS. Es voluntario: puedes seguir explorando sin vincularlo.</p>
      <p className="danz-instagram-welcome-note">La vinculación se comprueba con un código enviado desde tu Instagram. Nunca te pedimos su contraseña.</p>
    </div>
    <div className="danz-instagram-welcome-actions">
      <button type="button" className="danz-instagram-welcome-connect" onClick={() => { dismiss(); onConnect() }}>VINCULAR INSTAGRAM ↗</button>
      <button type="button" className="danz-instagram-welcome-later" onClick={dismiss}>AHORA NO</button>
    </div>
  </aside>
}
