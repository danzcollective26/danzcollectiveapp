import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Member = { name: string | null; handle: string }

export default function MemberPublicCard({ client, memberId }: { client: SupabaseClient<Database>; memberId: string }) {
  const [member, setMember] = useState<Member | null>(null)
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'error'>('loading')

  useEffect(() => {
    let current = true
    setMember(null)
    setStatus('loading')
    void client.rpc('danz_public_instagram_card', { p_user: memberId }).then(({ data, error }) => {
      if (!current) return
      if (error) { setStatus('error'); return }
      if (data && typeof data === 'object' && !Array.isArray(data) &&
          typeof data.handle === 'string' && /^[A-Za-z0-9_.]{1,30}$/.test(data.handle) &&
          (data.name === null || (typeof data.name === 'string' && data.name.length <= 40))) {
        setMember({ name: data.name, handle: data.handle })
      } else setStatus('unavailable')
    }).then(undefined, () => { if (current) setStatus('error') })
    return () => { current = false }
  }, [client, memberId])

  return <section className="account-card danz-profile-card" aria-label="Tarjeta pública de miembro">
    <div className="danz-profile-kicker">DANZ COLLECTIVE / TARJETA COMPARTIDA</div>
    {member ? <>
      <div className="danz-profile-header">
        <div className="danz-profile-avatar" aria-hidden="true">{(member.name || member.handle).slice(0, 1).toUpperCase()}</div>
        <div><h2>{member.name || 'Miembro DANZ'}</h2><p className="account-note">Perfil compartido voluntariamente</p></div>
      </div>
      <a className="danz-instagram-profile" href={`https://www.instagram.com/${member.handle}/`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir el Instagram verificado @${member.handle}`}>
        <span className="danz-instagram-mark" aria-hidden="true">◎</span>
        <span><b>@{member.handle}</b><small>INSTAGRAM VERIFICADO · VISIBLE CON PERMISO</small></span>
        <span aria-hidden="true">↗</span>
      </a>
      <p className="account-note">Las fotografías y álbumes privados de este miembro no se comparten desde esta tarjeta.</p>
    </> : <p role="status" className="account-note">{status === 'loading' ? 'Comprobando permiso del miembro…' : status === 'error' ? 'No se puede consultar esta tarjeta ahora. Inténtalo más tarde.' : 'Este miembro no tiene una tarjeta pública de Instagram disponible.'}</p>}
    <a className="outline-btn external-btn" href="/?seccion=cuenta">VOLVER A MI CUENTA ↗</a>
  </section>
}
