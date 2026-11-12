import { lazy, Suspense, useEffect, useReducer, useRef, useState, type PointerEvent } from 'react'
import './App.css'
import './arcade/gameScreen.css'
import { useAuth } from './auth/AuthProvider'
import { emailCallbackPresent } from './auth/client'
import EventPassport from './events/EventPassport'
import PwaControls from './pwa/PwaControls'
import { captureLaunchPass, PASS_CHANGE_EVENT, PENDING_PASS_KEY, PENDING_PASSES_KEY, readPendingPasses } from './events/pass'
import { usePendingPassRedemption } from './events/usePendingPassRedemption'
import { useAdminAccess } from './admin/access'
import type { AdminMfaEnrollment } from './admin/AdminMfa'
const AdminPanel = lazy(() => import('./admin/AdminPanel'))
const Account = lazy(() => import('./auth/Account'))
const PhotoGallery = lazy(() => import('./PhotoGallery'))
const PrivateGallery = lazy(() => import('./cloud/PrivateGallery'))
const DanzShop = lazy(() => import('./shop/DanzShop'))
const DanzPoints = lazy(() => import('./points/DanzPoints'))
import { gameReducer, initialGame, GRID, MAZE_STAGES, swipeDirection, gameLevel, gameTickMs, readSnakeRecord, saveSnakeRecord, type Direction } from './snake'
import content from './content/collective.json'
import { parseCollective, snakeFace, snakeExpression } from './content/collective'
import DanzMusic from './content/DanzMusic'
import SnakeArtwork from './content/SnakeArtwork'
import DanzFlower from './content/DanzFlower'
import { useGameScreen } from './arcade/useGameScreen'
import GameCover, { GAME_TITLE, GAME_SHORT_TITLE } from './arcade/GameCover'

const collective = parseCollective(content)

type Page = 'inicio' | 'pasaporte' | 'fotos' | 'arcade' | 'danzers' | 'danzin' | 'danzflor' | 'danzpoints' | 'cuenta' | 'admin'
function locationPage(): Page {
  const params = new URLSearchParams(window.location.search)
  if (params.get('panel') === 'admin') return 'admin'
  const value = params.get('seccion')
  if (value === 'musica') return 'danzin'
  return ['inicio', 'pasaporte', 'fotos', 'arcade', 'danzers', 'danzin', 'danzflor', 'danzpoints', 'cuenta', 'admin'].includes(value ?? '') ? value as Page : 'inicio'
}
const pages: { id: Page; label: string }[] = [
  { id: 'inicio', label: 'INICIO' },
  { id: 'pasaporte', label: 'PASAPORTE' },
  { id: 'fotos', label: 'FOTOS' },
  { id: 'arcade', label: 'ARCADANZ' },
  { id: 'danzers', label: 'DANZERS' },
  { id: 'danzin', label: 'DANZ IN' },
  { id: 'danzflor', label: 'DANZFLOR' },
  { id: 'danzpoints', label: 'DANZPOINTS' },
  { id: 'cuenta', label: 'CUENTA' },
]

function Arrow() { return <svg aria-hidden="true" className="arrow" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19 19 5M5 5h14v14" /></svg> }
const launchPass = captureLaunchPass()

export default function App() {
  const auth = useAuth()
  // Keep setup only in this page's memory while a focus check revalidates the
  // account. A different verified owner or sign-out clears it before display.
  const adminMfaSetup = useRef<AdminMfaEnrollment | null>(null)
  if (adminMfaSetup.current && (adminMfaSetup.current.client !== auth.client || (!auth.loading && adminMfaSetup.current.owner !== auth.user?.id))) adminMfaSetup.current = null
  const admin = useAdminAccess(auth.client, auth.user?.id ?? null, auth.loading)
  const [page, setPage] = useState<Page>(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = locationPage()
    return auth.error || emailCallbackPresent || params.has('code') || params.has('error') || /(?:access_token|error)=/.test(window.location.hash) ? 'cuenta' : requested !== 'inicio' && !launchPass.invalid ? requested : launchPass.code || launchPass.invalid ? 'danzers' : 'inicio'
  })
  const [pendingPasses, setPendingPasses] = useState(() => {
    const saved = readPendingPasses()
    return launchPass.code && !saved.includes(launchPass.code) ? [...saved, launchPass.code] : saved
  })
  const pendingPass = pendingPasses.at(-1) ?? null
  const [passIssue, setPassIssue] = useState(launchPass.invalid ? 'El enlace del pase no contiene un código válido.' : !launchPass.saved ? 'Este navegador no permite guardar el pase. Conserva el código antes de cerrar la página.' : null)
  const [galleryEvent, setGalleryEvent] = useState('')
  const [photoSource, setPhotoSource] = useState<'private' | 'attendance' | 'local'>('private')
  const managesPhotos = admin.member && admin.permissions.includes('events.manage')
  const localGalleryOpened = useRef(false)
  if (page === 'fotos' && photoSource === 'local') localGalleryOpened.current = true
  const [game, dispatch] = useReducer(gameReducer, initialGame())
  const gameScreen = useGameScreen(() => dispatch({ type: 'pause' }))
  const turn = (direction: Direction) => dispatch({ type: 'input', direction, random: Math.random() })
  const play = () => { if (!game.running) gameScreen.enter(); dispatch({ type: game.running ? 'pause' : 'start' }) }
  useEffect(() => { if (page !== 'arcade') gameScreen.leave() }, [page])
  const [records, setRecords] = useState(() => ({ classic: readSnakeRecord(), maze: readSnakeRecord('maze') }))
  const record = records[game.mode]
  const [showControls, setShowControls] = useState(() => {
    try { return localStorage.getItem('danz-snake-buttons') === 'true' } catch { return false }
  })
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const redemption = usePendingPassRedemption(auth.client, auth.user?.id ?? null, auth.loading, pendingPasses)
  const quickArrival = page === 'danzers' && !auth.user && Boolean(pendingPass)
  const syncPasses = (code: string | null) => {
    const saved = readPendingPasses()
    setPendingPasses(code && !saved.includes(code) ? [...saved, code] : saved)
    if (code && saved.includes(code)) setPassIssue(null)
  }

  useEffect(() => {
    const refresh = () => setPendingPasses(readPendingPasses())
    const storage = (event: StorageEvent) => { if (!event.key || [PENDING_PASS_KEY, PENDING_PASSES_KEY].includes(event.key)) refresh() }
    window.addEventListener(PASS_CHANGE_EVENT, refresh)
    window.addEventListener('storage', storage)
    return () => { window.removeEventListener(PASS_CHANGE_EVENT, refresh); window.removeEventListener('storage', storage) }
  }, [])

  useEffect(() => {
    if (auth.user && pendingPasses.length) setPage(previous => previous === 'cuenta' ? 'danzers' : previous)
  }, [auth.user?.id])

  useEffect(() => {
    const receivePass = () => {
      if (!new URLSearchParams(window.location.hash.slice(1)).has('pase')) return
      const incoming = captureLaunchPass()
      syncPasses(incoming.code)
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
    if (direction) turn(direction)
  }
  const moveGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    if (!start || start.pointerId !== event.pointerId) return
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (!direction) return
    event.preventDefault()
    turn(direction)
    gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
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
    const timer = window.setTimeout(() => dispatch({ type: 'tick', random: Math.random() }), gameTickMs(game.score))
    return () => window.clearTimeout(timer)
  }, [page, game.running, game.score, game.steps])

  useEffect(() => {
    if (game.score > record) setRecords(previous => ({ ...previous, [game.mode]: saveSnakeRecord(game.score, game.mode) }))
  }, [game.score, game.mode, record])

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
        turn(direction)
      }
      if (event.code === 'Space' && !event.repeat && !(target instanceof HTMLButtonElement)) {
        event.preventDefault()
        play()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [page, game.running])

  const go = (destination: Page) => {
    if (page === 'arcade' && destination !== 'arcade') gameScreen.leave()
    if (page === 'arcade' && destination !== 'arcade') dispatch({ type: 'pause' })
    const url = new URL(window.location.href)
    url.searchParams.delete('panel')
    if (destination !== 'danzflor') url.searchParams.delete('producto')
    if (destination !== 'admin' && destination !== 'fotos') url.searchParams.delete('album')
    if (destination === 'inicio') url.searchParams.delete('seccion')
    else url.searchParams.set('seccion', destination === 'danzin' ? 'musica' : destination)
    try { if (page !== destination) window.history.pushState(window.history.state, '', url) } catch { /* Navigation still works in a restricted browser view. */ }
    setPage(destination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const back = () => { dispatch({ type: 'pause' }); setPage(locationPage()) }
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, [])

  return (
    <div className={`site-shell${quickArrival ? ' quick-arrival' : ''}`}>
      <header className="topbar">
        <button className="wordmark" onClick={() => go('inicio')} aria-label="DANZ Collective, ir al inicio">
          <DanzFlower className="brand-flower" /><img className="brand-wordmark" src="/brand/danz-collective-wordmark.png" alt="" width="225" height="32" />
        </button>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {pages.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined}>
              {item.label}
            </button>
          ))}
          {admin.member && !admin.loading && <button onClick={() => go('admin')} className={page === 'admin' ? 'active' : ''}>ADMINISTRAR</button>}
        </nav>
        <span className="build-tag"><span className="status-dot"/> {auth.user ? 'CONECTADO' : 'EN DESARROLLO'}</span>
      </header>

      <PwaControls quiet={quickArrival || page === 'arcade'} />

      <main>
        {pendingPass && page !== 'danzers' && page !== 'pasaporte' && page !== 'arcade' && <div className="content pending-pass-banner"><span>{pendingPasses.length === 1 ? 'Tienes un pase de evento guardado.' : `Tienes ${pendingPasses.length} pases de evento guardados.`}</span><button className="outline-btn" onClick={() => go('danzers')}>ABRIR MI PASE ↗</button></div>}
        {page === 'inicio' && (
          <>
            <section className="intro content">
              <div className="eyebrow"><DanzFlower className="eyebrow-flower" /> MUSIC · PEOPLE · CULTURE</div>
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
                <GameCover className="snake-art cable-cover" decorative />
                <span className="feature-bottom"><strong>ARCADANZ</strong><small>Juega a {GAME_TITLE}.</small></span>
              </button>
            </section>

            <section className="content passport-home-section" aria-label="Tu pasaporte DANZ">
              <button className="passport-home-link" onClick={() => go('pasaporte')}>
                <span className="passport-mini-book" aria-hidden="true"><DanzFlower /><span>PASAPORTE</span></span>
                <span className="passport-home-copy"><small>TU COLECCIÓN DE NOCHES</small><strong>Un pasaporte.<br />Todas tus fiestas.</strong><span>Guarda tus sellos y vuelve a sus galerías.</span></span>
                <Arrow />
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
          <button type="button" className="outline-btn" aria-pressed={photoSource === 'private'} onClick={() => setPhotoSource('private')}>{managesPhotos ? 'Mis álbumes' : 'Galerías privadas'}</button>
          {managesPhotos && <button type="button" className="outline-btn" aria-pressed={photoSource === 'attendance'} onClick={() => setPhotoSource('attendance')}>Galerías con mi sello</button>}
          <button type="button" className="outline-btn" aria-pressed={photoSource === 'local'} onClick={() => setPhotoSource('local')}>Álbumes de este navegador</button>
        </div>}
        {localGalleryOpened.current && <Suspense fallback={<p className="content" role="status">Abriendo tus álbumes…</p>}><PhotoGallery active={page === 'fotos' && photoSource === 'local'} onBack={() => go('inicio')} /></Suspense>}
        {page === 'fotos' && photoSource !== 'local' && <Suspense fallback={<p className="content" role="status">Abriendo las galerías…</p>}>{admin.loading ? <p className="content" role="status">Comprobando tus álbumes…</p> : photoSource === 'private' && managesPhotos ? <section className="content inner-page"><AdminPanel key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} access={admin} setup={adminMfaSetup} onSignIn={() => go('cuenta')} albumsOnly /></section> : <PrivateGallery key={`${auth.user?.id ?? 'guest'}-${galleryEvent}`} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} initialEventId={galleryEvent} onSignIn={() => go('cuenta')} />}</Suspense>}
        {page === 'cuenta' && <section className="content inner-page">
          <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
          {admin.member && !admin.loading && <button className="outline-btn admin-link" onClick={() => go('admin')}>ABRIR ADMINISTRACIÓN</button>}
          <Suspense fallback={<p role="status">Abriendo tu cuenta…</p>}><Account key={auth.user?.id ?? 'guest'} /></Suspense>
        </section>}
        {page === 'admin' && <section className="content inner-page"><button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button><Suspense fallback={<p role="status">Abriendo administración…</p>}><AdminPanel key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} access={admin} setup={adminMfaSetup} onSignIn={() => go('cuenta')} /></Suspense></section>}

        {page === 'arcade' && (
          <section className="content inner-page arcade-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="arcade-intro">
              <div className="arcadanz-brand"><img src="/brand/arcadanz-wordmark-v2.webp" alt="ARCADANZ" width="2172" height="724" decoding="async" /></div>
              <div className="eyebrow">ARCADANZ / GAME 001</div>
              <h1 className="page-title arcade-game-title">LA QUE HAS<br /><em>LIAO, JACK.</em></h1>
              <p className="page-lead">Un cable suelto, las caras del colectivo y seis laberintos. Que no te pillen.</p>
              <GameCover className="snake-cover" />
            </div>
            <div ref={gameScreen.panel} className={`game-panel${gameScreen.active ? ' is-immersive' : ''}${showControls ? ' has-controls' : ''}`}>
              {gameScreen.active && <div className="game-screen-bar"><span>{GAME_SHORT_TITLE} · {GRID} × {GRID}</span><button type="button" className="outline-btn" onClick={gameScreen.leave}>SALIR DEL JUEGO ↗</button></div>}
              <div className="game-modes" role="group" aria-label="Modo de Snake">
                <button type="button" aria-pressed={game.mode === 'classic'} onClick={() => dispatch({ type: 'mode', mode: 'classic' })}>CLÁSICO</button>
                <button type="button" aria-pressed={game.mode === 'maze'} onClick={() => dispatch({ type: 'mode', mode: 'maze' })}>LABERINTO <span>{MAZE_STAGES.length} NIVELES</span></button>
              </div>
              {game.mode === 'maze' && <div className="maze-level-picker"><label htmlFor="maze-level">RECORRIDO</label><select id="maze-level" value={game.stage} onChange={event => dispatch({ type: 'maze-level', stage: Number(event.target.value) })}>{MAZE_STAGES.map((name, i) => <option key={name} value={i + 1}>{i + 1} · {name}</option>)}</select><span>{game.stage < MAZE_STAGES.length ? `${game.stageGoals}/5 OBJETIVOS` : 'MODO INFINITO'}</span></div>}
              <div className="game-heading"><span>PUNTOS <strong>{String(game.score).padStart(4, '0')}</strong></span><span>RÉCORD <strong>{String(record).padStart(4, '0')}</strong></span><span>NIVEL {game.mode === 'maze' ? game.stage : gameLevel(game.score)}</span></div>
              <div className="game-board-space"><div className={`game-board${game.mode === 'maze' ? ' maze-board' : ''}`} style={{ gridTemplateColumns: `repeat(${GRID},1fr)`, gridTemplateRows: `repeat(${GRID},1fr)` }} onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null }} role="img" aria-label={`Tablero de Snake${game.mode === 'maze' ? ` laberinto ${game.stage}` : ''}, puntuación ${game.score}`}>
                <svg className="snake-body-art" viewBox={`0 0 ${GRID} ${GRID}`} aria-hidden="true"><polyline points={game.snake.map(point => `${point.x + .5},${point.y + .5}`).join(' ')} /></svg>
                {Array.from({ length: GRID * GRID }, (_, i) => {
                  const x = i % GRID
                  const y = Math.floor(i / GRID)
                  const head = game.snake[0].x === x && game.snake[0].y === y
                  const segment = game.snake.findIndex((p) => p.x === x && p.y === y)
                  const body = segment >= 0
                  const target = game.foods.find(food => food.x === x && food.y === y)
                  const food = Boolean(target)
                  const wall = game.walls.some(point => point.x === x && point.y === y)
                  const collected = game.eatenFaces[segment - 1]
                  const face = target ? snakeFace(collective.snake.faces, target.face * 10) : body && !head && collected !== undefined ? snakeFace(collective.snake.faces, collected * 10) : null
                  const artwork = head ? collective.snake.headImage : face?.image
                  const expression = face ? snakeExpression(face, target?.face ?? collected, collective.snake.faces.length) : 0
                  return <span key={i} data-face={face?.id} className={head ? 'cell head' : body ? 'cell snake' : food ? 'cell apple' : wall ? 'cell wall' : 'cell'}>{artwork && <SnakeArtwork key={artwork} src={artwork} frames={face?.frames} frame={expression} />}</span>
                })}
                {!game.running && <div className="game-overlay"><span className="game-overlay-title">{game.won ? '¡COMPLETADO!' : game.over ? 'GAME OVER' : game.levelUp ? `NIVEL ${game.stage}` : GAME_TITLE}</span><small>{game.over ? 'OTRA PARTIDA?' : game.levelUp ? MAZE_STAGES[game.stage - 1].toUpperCase() : 'PULSA JUGAR'}</small></div>}
              </div></div>
              <div className="game-actions">
                <button className="primary-btn" onClick={play}>{game.running ? 'PAUSAR' : game.over ? 'VOLVER A JUGAR' : game.levelUp ? 'CONTINUAR NIVEL' : 'JUGAR'} <span>→</span></button>
                <button className="outline-btn" onClick={() => dispatch({ type: 'reset' })}>REINICIAR</button>
              </div>
              <div className="game-control-options">
                <p>Gira al deslizar, sin levantar el dedo.</p>
                <button type="button" className="outline-btn" aria-pressed={showControls} onClick={toggleControls}>
                  {showControls ? 'OCULTAR BOTONES' : 'MOSTRAR BOTONES'} ⌘
                </button>
              </div>
              {showControls && <div className="controls" aria-label="Controles para móvil">
                {(['up', 'left', 'down', 'right'] as Direction[]).map((direction, i) => <button key={direction} aria-label={['Arriba', 'Izquierda', 'Abajo', 'Derecha'][i]} onPointerDown={event => { event.preventDefault(); turn(direction) }} onClick={event => { if (event.detail === 0) turn(direction) }}>{['↑', '←', '↓', '→'][i]}</button>)}
              </div>}
              <p className="game-local-note">Aparece un objetivo más cada cinco caras recogidas, hasta cinco a la vez. Diez personas, tres expresiones cada una: no se agotan.<br />{game.mode === 'maze' ? `Recoge cinco caras para avanzar. En ${MAZE_STAGES.at(-1)}, sigue hasta donde llegues.` : 'La velocidad sube cada cinco caras.'} Cambiar de modo o recorrido inicia otra partida.<br />Récord de {game.mode === 'maze' ? 'laberinto' : 'clásico'} en este navegador · Puntos todavía sin premios.</p>
            </div>
            <article className="arcade-coming-soon" aria-label="DANZ Idle Studio, próximamente">
              <div className="idle-cover"><img src="/arcade/idle-studio-industrial.webp" alt="Ilustración provisional de un taller industrial creativo con música, ropa, cámara y diseño" width="1200" height="900" loading="lazy" /><span>GAME 002 / PRÓXIMAMENTE</span></div>
              <div className="idle-copy"><span className="idle-status"><DanzFlower /> EN EL ESTUDIO</span><h2>DANZ<br /><em>IDLE STUDIO.</em></h2><p>Un puesto, mil ideas. Música, moda, vídeo y diseño: el estudio del colectivo, a tu ritmo.</p><span className="idle-coming">PRÓXIMAMENTE <span aria-hidden="true">↗</span></span><small>Nombre y carátula provisionales.</small></div>
            </article>
          </section>
        )}

        {(page === 'pasaporte' || page === 'danzers') && (
          <section className="content inner-page passport-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <EventPassport key={auth.user?.id ?? 'guest'} arrival={page === 'danzers'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} pendingPass={pendingPass} pendingCount={pendingPasses.length} redemption={redemption} launchIssue={passIssue} onPendingPass={syncPasses} onSignIn={() => go('cuenta')} onContinue={() => go('inicio')} onGallery={eventId => { setGalleryEvent(eventId); setPhotoSource('attendance'); go('fotos') }} />
          </section>
        )}

        {page === 'danzpoints' && <section className="content inner-page points-page"><button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button><div className="eyebrow">DANZ COLLECTIVE / RECOMPENSAS</div><h1 className="page-title">DANZ<br /><em>POINTS.</em></h1><Suspense fallback={<p role="status">Abriendo DANZPOINTS…</p>}><DanzPoints key={auth.user?.id??'guest'} onSignIn={()=>go('cuenta')} /></Suspense></section>}

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
          <section className="content inner-page shop-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / CLOTHING</div>
            <h1 className="page-title">DANZ<br /><em>FLOR.</em></h1>
            <p className="page-lead">La ropa del colectivo. Diseñada para la música, hecha para llevarla contigo.</p>
            <Suspense fallback={<p role="status">Abriendo DANZFLOR…</p>}><DanzShop /></Suspense>
          </section>
        )}
      </main>

      <footer className="footer content"><span className="footer-brand"><DanzFlower /> DANZ COLLECTIVE © {new Date().getFullYear()}</span><span>MUSIC · PEOPLE · CULTURE</span></footer>
    </div>
  )
}
