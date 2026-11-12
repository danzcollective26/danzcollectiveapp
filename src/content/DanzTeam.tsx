import { useEffect, useRef } from 'react'
import type { Member } from './collective'
import './DanzTeam.css'

export default function DanzTeam({ members, onProfile }: { members: Member[]; onProfile: (id: string) => void }) {
  return <div className="member-grid" aria-label="Personas del colectivo">
    {members.map(member => <article className="member-card" data-artist={member.id} key={member.id} aria-label={member.name}>
      <button type="button" onClick={() => onProfile(member.id)} aria-label={`Ver la ficha de ${member.name}`}>
        {member.image ? <div className="artist-portrait"><img src={member.image} alt={`Retrato de ${member.name}`} width="640" height="640" loading="lazy" decoding="async" /></div> : <div className="member-initial" aria-hidden="true">{member.name.slice(0, 1)}</div>}
        <div className="member-card-copy"><div className="member-roles">{member.roles.map(role => <span key={role}>{role}</span>)}</div><h2>{member.name}</h2><span className="member-card-action">VER FICHA <span aria-hidden="true">↗</span></span></div>
      </button>
    </article>)}
  </div>
}

export function MemberProfile({ member, onClose }: { member: Member; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const modal = dialog.current
    modal?.showModal()
    return () => { modal?.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }) }
  }, [member.id])
  return <dialog ref={dialog} className="member-dialog" aria-labelledby="member-profile-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="member-dialog-top"><span>DANZ COLLECTIVE / EQUIPO</span><button type="button" className="outline-btn" onClick={onClose} autoFocus>CERRAR FICHA ×</button></div>
    <div className={`member-profile-content${member.image ? '' : ' without-image'}`}>
      {member.image && <div className="artist-portrait" data-artist={member.id}><img src={member.image} alt={`Retrato de ${member.name}`} width="640" height="640" decoding="async" /></div>}
      <div className="member-profile-copy"><div className="member-roles">{member.roles.map(role => <span key={role}>{role}</span>)}</div><h2 id="member-profile-title">{member.name}</h2><p>{member.bio ?? 'Parte de DANZ Collective.'}</p>
        {member.links.length > 0 && <div className="artist-links" aria-label={`Enlaces de ${member.name}`}>{member.links.map(link => <a key={link.href} className="outline-btn external-btn" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} en ${link.label}${link.label === 'YouTube' && member.youtubeChannelName ? ` · ${member.youtubeChannelName}` : ''}`}><span>{link.label}{link.label === 'YouTube' && member.youtubeChannelName && <small>{member.youtubeChannelName}</small>}</span><span aria-hidden="true">↗</span></a>)}</div>}
      </div>
    </div>
  </dialog>
}
