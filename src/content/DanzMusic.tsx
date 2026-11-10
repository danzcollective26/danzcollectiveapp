import type { Artist } from './collective'

export default function DanzMusic({ artists }: { artists: Artist[] }) {
  if (!artists.length) return <div className="empty-state"><span className="empty-icon">♫</span><div><h2>El sonido de DANZ</h2><p>Próximamente, los DJs del colectivo y sus perfiles oficiales de Spotify, SoundCloud y YouTube.</p></div><span className="pill">PRÓXIMAMENTE</span></div>
  return <div className="artist-grid" aria-label="DJs del colectivo">
    {artists.map((artist, index) => <article className="artist-card" key={artist.id} aria-label={artist.name}>
      <div className="artist-heading"><span>DANZ COLLECTIVE</span><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
      <h2>{artist.name}</h2>
      <div className="artist-links">{artist.links.map(link => <a className="outline-btn external-btn" key={link.href} href={link.href} target="_blank" rel="noreferrer noopener" aria-label={`${artist.name} en ${link.label}${link.label === 'YouTube' && artist.youtubeChannelName ? ` · ${artist.youtubeChannelName}` : ''}`}><span>{link.label}{link.label === 'YouTube' && artist.youtubeChannelName && <small>{artist.youtubeChannelName}</small>}</span><span aria-hidden="true">↗</span></a>)}</div>
    </article>)}
  </div>
}
