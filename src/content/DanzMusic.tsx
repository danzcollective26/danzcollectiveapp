import type { Artist } from './collective'

function ExternalArrow() {
  return <svg className="artist-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>
}

// Keep DANZ on the music section while the native link opens the platform.
// Never target the enclosing window: embedded hosts can forbid top navigation.
function rememberMusic() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('seccion', 'musica')
    window.history.replaceState(window.history.state, '', url)
  } catch { /* Restricted previews may deny history writes; navigation still works. */ }
}

export default function DanzMusic({ artists }: { artists: Artist[] }) {
  if (!artists.length) return <div className="empty-state"><span className="empty-icon">♫</span><div><h2>El sonido de DANZ</h2><p>Próximamente, los DJs del colectivo y sus perfiles oficiales de Spotify, SoundCloud y YouTube.</p></div><span className="pill">PRÓXIMAMENTE</span></div>
  return <div className="artist-grid" aria-label="DJs del colectivo">
    {artists.map((artist, index) => <article className="artist-card" data-artist={artist.id} key={artist.id} aria-label={artist.name}>
      <div className="artist-heading"><span>DANZ COLLECTIVE</span><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
      <a className="artist-profile" href={(artist.links.find(link => link.label === 'SoundCloud') ?? artist.links[0]).href} target="_blank" rel="noopener noreferrer" onClick={rememberMusic} aria-label={`Escuchar a ${artist.name}`}>
        {artist.image && <div className="artist-portrait"><img src={artist.image} alt={`Retrato de ${artist.name}`} width="640" height="640" decoding="async" /><span className="artist-photo-label" aria-hidden="true">DANZ IN / ARTIST</span></div>}
        <h2>{artist.name}<ExternalArrow /></h2>
        <span className="artist-listen">ESCUCHAR AL ARTISTA <ExternalArrow /></span>
      </a>
      <div className="artist-links">{artist.links.map(link => <a className="outline-btn external-btn" key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={rememberMusic} aria-label={`${artist.name} en ${link.label}${link.label === 'YouTube' && artist.youtubeChannelName ? ` · ${artist.youtubeChannelName}` : ''}`}><span>{link.label}{link.label === 'YouTube' && artist.youtubeChannelName && <small>{artist.youtubeChannelName}</small>}</span><ExternalArrow /></a>)}</div>
    </article>)}
  </div>
}
