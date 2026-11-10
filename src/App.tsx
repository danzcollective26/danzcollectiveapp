import { lazy, Suspense, useEffect, useReducer, useRef, useState, type PointerEvent } from 'react'
import './App.css'
import PhotoGallery from './PhotoGallery'
import Account from './auth/Account'
import { useAuth } from './auth/AuthProvider'
import { emailCallbackPresent } from './auth/client'
import PrivateGallery from './cloud/PrivateGallery'
import EventPassport from './events/EventPassport'
import PwaControls from './pwa/PwaControls'
import { captureLaunchPass } from './events/pass'
import { useAdminAccess } from './admin/access'
const AdminPanel = lazy(() => import('./admin/AdminPanel'))
import { gameReducer, initialGame, GRID, swipeDirection, type Direction } from './snake'
import content from './content/collective.json'
import { parseCollective, snakeFace } from './content/collective'
import DanzMusic from './content/DanzMusic'
import SnakeArtwork from './content/SnakeArtwork'

const collective = parseCollective(content)

type Page = 'inicio' | 'fotos' | 'arcade' | 'danzers' | 'danzin' | 'danzflor' | 'cuenta' | 'admin'
const pages: { id: Page; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'danzers', label: 'DANZERS' },
  { id: 'danzin', label: 'DANZ IN' },
  { id: 'danzflor', label: 'DANZFLOR' },
  { id: 'cuenta', label: 'Cuenta' },
]

function Arrow() { return <span aria-hidden="true" className="arrow">↗</span> }
const launchPass = captureLaunchPass()

export default function App() {
  const auth = useAuth()
  const admin = useAdminAccess(auth.client, auth.user?.id ?? null, auth.loading)
  const [page, setPage] = useState<Page>(() => {
    const params = new URLSearchParams(window.location.search)
    return auth.error || emailCallbackPresent || params.has('code') || params.has('error') || /(?:access_token|error)=/.test(window.location.hash) ? 'cuenta' : params.get('panel') === 'admin' ? 'admin' : params.get('seccion') === 'cuenta' ? 'cuenta' : launchPass.code || launchPass.invalid ? 'danzers' : params.get('seccion') === 'musica' ? 'danzin' : 'inicio'
  })
  const [pendingPass, setPendingPass] = useState(launchPass.code)
  const [passIssue, setPassIssue] = useState(launchPass.invalid ? 'El enlace del pase no contiene un código válido.' : !launchPass.saved ? 'Este navegador no permite guardar el pase. Conserva el código antes de cerrar la página.' : null)
  const [galleryEvent, setGalleryEvent] = useState('')
  const [photoSource, setPhotoSource] = useState<'private' | 'local'>('private')
  const [game, dispatch] = useReducer(gameReducer, initialGame())
  const [showControls, setShowControls] = useState(() => {
    try { return localStorage.getItem('danz-snake-buttons') === 'true' } catch { return false }
  })
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null)

  useEffect(() => {
    const receivePass = () => {
      if (!new URLSearchParams(window.location.hash.slice(1)).has('pase')) return
      const incoming = captureLaunchPass()
      setPendingPass(incoming.code)
      setPassIssue(incoming.invalid ? 'El enlace del pase no contiene un código válido.' : !incoming.saved ? 'Este navegador no permite guardar el pase. Conserva el código antes de cerrar la página.' : null)
      dispatch({ type: 'pause' })
      setPage('danzers')
    }
    receivePass()
    window.addEventListener('hashchange', receivePass)
    return () => window.removeEventListener('hashchange', receivePass)
  }, [])

  const toggleControls = () => {
    const next = !showControls
    setShowControls(next)
    try { localStorage.setItem('danz-snake-buttons', String(next)) } catch { /* Preferencia opcional. */ }
  }

  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return
    gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    if (!start || start.pointerId !== event.pointerId) return
    gesture.current = null
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (direction) dispatch({ type: 'turn', direction })
  }

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) dispatch({ type: 'pause' })
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])

  useEffect(() => {
    if (page !== 'arcade' || !game.running) return
    const timer = window.setInterval(() => dispatch({ type: 'tick', random: Math.random() }), 150)
    return () => window.clearInterval(timer)
  }, [page, game.running])

  useEffect(() => {
    if (page !== 'arcade') return
    const directions: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      const direction = directions[event.key]
      if (direction) {
        event.preventDefault()
        dispatch({ type: 'turn', direction })
      }
      if (event.code === 'Space' && !event.repeat && !(target instanceof HTMLButtonElement)) {
        event.preventDefault()
        dispatch({ type: game.running ? 'pause' : 'start' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [page, game.running])

  const go = (destination: Page) => {
    if (page === 'arcade' && destination !== 'arcade') dispatch({ type: 'pause' })
    const url = new URL(window.location.href)
    if (destination === 'danzin') url.searchParams.set('seccion', 'musica')
    else if (destination === 'cuenta') url.searchParams.set('seccion', 'cuenta')
    else url.searchParams.delete('seccion')
    window.history.replaceState(window.history.state, '', url)
    setPage(destination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => go('inicio')} aria-label="DANZ Collective, ir al inicio">
          DANZ<span className="wordmark-dot">.</span><span className="wordmark-small">COLLECTIVE</span>
        </button>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {pages.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className={page === item.id ? 'active' : ''}>
              {item.label}
            </button>
          ))}
          {admin.member && !admin.loading && <button onClick={() => go('admin')} className={page === 'admin' ? 'active' : ''}>Administrar</button>}
        </nav>
        <span className="build-tag"><span className="status-dot"/> {auth.user ? 'CONECTADO' : 'EN DESARROLLO'}</span>
      </header>

      <PwaControls />

      <main>
        {pendingPass && page !== 'danzers' && <div className="content pending-pass-banner"><span>Tienes un pase de evento guardado.</span><button className="outline-btn" onClick={() => go('danzers')}>ABRIR MI PASE ↗</button></div>}
        {page === 'inicio' && (
          <>
            <section className="intro content">
              <div className="eyebrow"><span className="plus">✳</span> MUSIC · PEOPLE · CULTURE</div>
              <h1>WE ARE<br /><em>DANZ.</em></h1>
              <div className="intro-bottom">
                <p>Tu noche no acaba cuando termina la música.</p>
                <span>UNA EXPERIENCIA DEL COLECTIVO, EN UN SOLO LUGAR. ↓</span>
              </div>
            </section>

            <section className="feature-grid content" aria-label="Secciones principales">
              <button className="feature photo-feature" onClick={() => go('fotos')}>
                <span className="feature-top"><span>01 / RECUERDOS</span><Arrow /></span>
                <div className="photo-art" aria-hidden="true"><span>★</span><i/><b>AFTER<br />THE<br />NIGHT</b></div>
                <span className="feature-bottom"><strong>FOTOS</strong><small>Revive la noche.</small></span>
              </button>
              <button className="feature arcade-feature" onClick={() => go('arcade')}>
                <span className="feature-top"><span>02 / JUEGA</span><Arrow /></span>
                <div className="snake-art" aria-hidden="true">
                  <div className="pixel-snake">{Array.from({ length: 49 }, (_, i) => <span key={i} className={[9, 16, 23, 24, 25, 32].includes(i) ? 'lit' : i === 33 ? 'food' : ''}/>)}</div>
                  <span className="snake-stamp">PRESS PLAY_</span>
                </div>
                <span className="feature-bottom"><strong>ARCADE</strong><small>Juega a DANZ Snake.</small></span>
              </button>
            </section>

            <section className="content lower-section">
              <div className="section-heading"><span>EL UNIVERSO DANZ</span><span>03 — 05</span></div>
              <div className="module-grid">
                <button onClick={() => go('danzers')} className="module"><span>DANZERS <Arrow /></span><small>EVENTOS Y FIESTAS</small></button>
                <button onClick={() => go('danzin')} className="module"><span>DANZ IN <Arrow /></span><small>MÚSICA Y ARTISTAS</small></button>
                <button onClick={() => go('danzflor')} className="module"><span>DANZFLOR <Arrow /></span><small>MODA Y COLECCIONES</small></button>
              </div>
            </section>
          </>
        )}

        {/* Se mantiene montada para conservar las fotos al cambiar entre secciones.
            El contenido solo es visible cuando estamos en Fotos. */}
        {page === 'fotos' && <div className="content photo-source-nav" role="group" aria-label="Elegir galerías">
          <button type="button" className="outline-btn" aria-pressed={photoSource === 'private'} onClick={() => setPhotoSource('private')}>Galerías privadas</button>
          <button type="button" className="outline-btn" aria-pressed={photoSource === 'local'} onClick={() => setPhotoSource('local')}>Álbumes de este navegador</button>
        </div>}
        <PhotoGallery active={page === 'fotos' && photoSource === 'local'} onBack={() => go('inicio')} />
        {page === 'fotos' && photoSource === 'private' && <PrivateGallery key={`${auth.user?.id ?? 'guest'}-${galleryEvent}`} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} initialEventId={galleryEvent} onSignIn={() => go('cuenta')} />}
        {page === 'cuenta' && <section className="content inner-page">
          <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
          {admin.member && !admin.loading && <button className="outline-btn admin-link" onClick={() => go('admin')}>ABRIR ADMINISTRACIÓN</button>}
          <Account key={auth.user?.id ?? 'guest'} />
        </section>}
        {page === 'admin' && <section className="content inner-page"><button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button><Suspense fallback={<p role="status">Abriendo administración…</p>}><AdminPanel key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} access={admin} onSignIn={() => go('cuenta')} /></Suspense></section>}

        {page === 'arcade' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ ARCADE / GAME 001</div>
            <h1 className="page-title">DANZ<br /><em>SNAKE.</em></h1>
            <p className="page-lead">Nuestro primer minijuego ya se puede probar. Utiliza las flechas del teclado, WASD, desliza sobre el tablero o activa los botones de dirección. Esta puntuación es solo una prueba local: aún no hay premios ni rankings oficiales.</p>
            <div className="game-panel">
              <div className="game-heading"><span>SCORE <strong>{String(game.score).padStart(4, '0')}</strong></span><span>{game.won ? 'TABLERO COMPLETO' : game.over ? 'GAME OVER' : game.running ? 'NOW PLAYING ●' : 'READY / PAUSE'}</span></div>
              <div className="game-board" onPointerDown={startGesture} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null }} role="img" aria-label={`Tablero de Snake, puntuación ${game.score}`}>
                {Array.from({ length: GRID * GRID }, (_, i) => {
                  const x = i % GRID
                  const y = Math.floor(i / GRID)
                  const head = game.snake[0].x === x && game.snake[0].y === y
                  const segment = game.snake.findIndex((p) => p.x === x && p.y === y)
                  const body = segment >= 0
                  const food = game.food?.x === x && game.food?.y === y
                  const face = food ? snakeFace(collective.snake.faces, game.score) : body && !head ? snakeFace(collective.snake.faces, game.score, segment) : null
                  const artwork = head ? collective.snake.headImage : face?.image
                  return <span key={i} className={head ? 'cell head' : body ? 'cell snake' : food ? 'cell apple' : 'cell'}>{artwork && <SnakeArtwork key={artwork} src={artwork} />}</span>
                })}
                {!game.running && <div className="game-overlay">{game.won ? '¡COMPLETADO!' : game.over ? 'GAME OVER' : 'DANZ SNAKE'}<small>{game.over ? 'OTRA PARTIDA?' : 'PULSA JUGAR'}</small></div>}
              </div>
              <div className="game-actions">
                <button className="primary-btn" onClick={() => dispatch({ type: game.running ? 'pause' : 'start' })}>{game.running ? 'PAUSAR' : game.over ? 'VOLVER A JUGAR' : 'JUGAR'} <span>→</span></button>
                <button className="outline-btn" onClick={() => dispatch({ type: 'reset' })}>REINICIAR</button>
              </div>
              <div className="game-control-options">
                <p>Desliza sobre el tablero para girar.</p>
                <button type="button" className="outline-btn" aria-pressed={showControls} onClick={toggleControls}>
                  {showControls ? 'OCULTAR BOTONES' : 'MOSTRAR BOTONES'} ⌘
                </button>
              </div>
              {showControls && <div className="controls" aria-label="Controles para móvil">
                <button aria-label="Arriba" onClick={() => dispatch({ type: 'turn', direction: 'up' })}>↑</button>
                <div><button aria-label="Izquierda" onClick={() => dispatch({ type: 'turn', direction: 'left' })}>←</button><button aria-label="Abajo" onClick={() => dispatch({ type: 'turn', direction: 'down' })}>↓</button><button aria-label="Derecha" onClick={() => dispatch({ type: 'turn', direction: 'right' })}>→</button></div>
              </div>}
            </div>
          </section>
        )}

        {page === 'danzers' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <EventPassport key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} pendingPass={pendingPass} launchIssue={passIssue} onPendingPass={setPendingPass} onSignIn={() => go('cuenta')} onGallery={eventId => { setGalleryEvent(eventId); setPhotoSource('private'); go('fotos') }} />
          </section>
        )}

        {page === 'danzin' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / LABEL</div>
            <h1 className="page-title">DANZ<br /><em>IN.</em></h1>
            <p className="page-lead">Los DJs del colectivo, en un mismo lugar. Descubre su música, sus sesiones y lo que está por sonar.</p>
            <DanzMusic artists={collective.artists} />
          </section>
        )}

        {page === 'danzflor' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / CLOTHING</div>
            <h1 className="page-title">DANZ<br /><em>FLOR.</em></h1>
            <p className="page-lead">La ropa del colectivo. Estamos preparando el catálogo y las futuras colecciones de DANZ.</p>
            {collective.websiteUrl && <a className="primary-btn external-btn" href={collective.websiteUrl} target="_blank" rel="noreferrer noopener">VISITAR LA WEB OFICIAL <Arrow /></a>}
          </section>
        )}
      </main>

      <footer className="footer content"><span>DANZ COLLECTIVE © {new Date().getFullYear()}</span><span>MUSIC · PEOPLE · CULTURE</span></footer>
    </div>
  )
}
