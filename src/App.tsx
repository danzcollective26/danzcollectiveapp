import { requestArcadeFullscreen, releaseArcadeFullscreen } from './arcade/arcadeFullscreen'
import SelectionReel from './arcade/SelectionReel'
import { lazy, Suspense, useEffect, useReducer, useRef, useState, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { haptic } from './ui/haptics'
import { cancelSectionTransition, transitionSection } from './ui/sectionTransition'
import LoadingSkeleton from './ui/LoadingSkeleton'
import MobileBottomNav from './ui/MobileBottomNav'
import './App.css'
import './homeVisualReview.css'
import './arcade/gameSurface.css'
import './arcade/gameScreen.css'
import './arcade/arcadeLibrary.css'
import { useAuth } from './auth/AuthProvider'
import InstagramWelcome from './auth/InstagramWelcome'
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
const GrooveNinja = lazy(() => import('./arcade/GrooveNinja'))
const TestLab = lazy(() => import('./testlab/TestLab'))
const ArenaDuel = lazy(() => import('./arcade/arena/ArenaDuel'))
const YeppoChase = lazy(() => import('./arcade/chase/YeppoChase'))
const CollectaHub = lazy(() => import('./arcade/CollectaHub'))
const ItsMikesFault = lazy(() => import('./arcade/ItsMikesFault'))
const KartMini = lazy(() => import('./arcade/kart/KartMini'))
const DanzIdleStudio = lazy(() => import('./arcade/idle/DanzIdleStudio'))
import { gameReducer, initialGame, GRID, MAZE_STAGES, swipeDirection, gameLevel, gameTickMs, readSnakeRecord, saveSnakeRecord, type Direction } from './snake'
import content from './content/collective.json'
import { parseCollective } from './content/collective'
import DanzMusic from './content/DanzMusic'
import SnakeCells from './arcade/SnakeCells'
import SnakeCable from './arcade/SnakeCable'
import DanzFlower from './content/DanzFlower'
import { readCollectaControls, saveCollectaControls } from './arcade/collectaControls'
import { useGameScreen } from './arcade/useGameScreen'
import { COMPETITION_ENABLED } from './arcade/competitionConfig'
import SnakeCompetition from './arcade/SnakeCompetition'
import { useSnakeCompetition } from './arcade/useSnakeCompetition'
import GameCover, { GAME_TITLE, GAME_SHORT_TITLE } from './arcade/GameCover'
import ArcadeChooser from './arcade/ArcadeChooser'
import ArcadeLaunch from './arcade/ArcadeLaunch'
import Yeppo, { markYeppoWelcomeDone, type YeppoDemoRequest } from './yeppo/Yeppo'
import { setYeppoEnabled } from './yeppo/settings'
import DanzRadio from './music/DanzRadio'

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
const testLab = /^\/test\/?$/.test(window.location.pathname)
function locationGame(): 'snake' | 'groove' | 'arena' | 'arena-solo' | 'chase' | 'collecta' | 'mike' | 'kart' | 'idle' | null {
  const value = new URLSearchParams(window.location.search).get('juego')
  return value === 'idle-studio' ? 'idle' : value === 'kart' ? 'kart' : value === 'arena-solo' ? 'arena-solo' : value === 'collecta' ? 'collecta' : value === 'mike' ? 'mike' : value === 'pilla-pilla' ? 'chase' : value === 'arena' ? 'arena' : value === 'groove-ninja' ? 'groove' : value === 'jack' || value === 'snake' ? 'snake' : null
}

export default function App() {
  const auth = useAuth()
  const [collectaControls, setCollectaControls] = useState(readCollectaControls)
  useEffect(() => saveCollectaControls(collectaControls), [collectaControls])
  const [yeppoDemo, setYeppoDemo] = useState<YeppoDemoRequest>({ id: 0, move: 'stroll' })
  // Keep setup only in this page's memory while a focus check revalidates the
  // account. A different verified owner or sign-out clears it before display.
  const adminMfaSetup = useRef<AdminMfaEnrollment | null>(null)
  if (adminMfaSetup.current && (adminMfaSetup.current.client !== auth.client || (!auth.loading && adminMfaSetup.current.owner !== auth.user?.id))) adminMfaSetup.current = null
  const admin = useAdminAccess(auth.client, auth.user?.id ?? null, auth.loading)
  const [instagramRequested, setInstagramRequested] = useState(() => new URLSearchParams(window.location.search).get('vincular') === 'instagram')
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
  const [arcadeGame, setArcadeGame] = useState(locationGame)
  useEffect(() => { const active=page==='arcade'&&arcadeGame!==null;document.documentElement.classList.toggle('arcade-session',active);if(!active)releaseArcadeFullscreen() },[page,arcadeGame])
  useEffect(()=>()=>{document.documentElement.classList.remove('arcade-session');releaseArcadeFullscreen()},[])
  const [launchGroove, setLaunchGroove] = useState(() => locationGame() === 'groove')
  const gameScreen = useGameScreen(() => dispatch({ type: 'pause' }))
  const competition=useSnakeCompetition(game,(mode,seed)=>{
    const url = new URL(window.location.href)
    url.searchParams.set('seccion','arcade'); url.searchParams.set('juego','jack')
    try { window.history.pushState(window.history.state,'',url) } catch { /* The game still opens in memory. */ }
    flushSync(()=>{ setPage('arcade'); setArcadeGame('snake'); dispatch({type:'ranked',mode,seed}) })
    gameScreen.enter()
  },()=>dispatch({type:'pause'}))
  const turn = (direction: Direction) => {if(game.seed!==undefined&&competition.run?.status!=='active')return;dispatch({ type: 'input', direction, random: Math.random() })}
  const play = () => { if(game.seed!==undefined&&competition.run?.status!=='active'){if(competition.run?.status!=='saving'&&competition.run?.status!=='error')void competition.start(game.mode);return} if (!game.running) gameScreen.enter(); dispatch({ type: game.running ? 'pause' : 'start' }) }
  useEffect(() => { if (page !== 'arcade' || arcadeGame !== 'snake') gameScreen.leave() }, [page, arcadeGame])
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
      cancelSectionTransition()
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
      if (document.hidden) { gesture.current = null; dispatch({ type: 'pause' }) }
    }
    const pauseWhenBlurred = () => { gesture.current = null; dispatch({ type: 'pause' }) }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    window.addEventListener('blur', pauseWhenBlurred)
    return () => { document.removeEventListener('visibilitychange', pauseWhenHidden); window.removeEventListener('blur', pauseWhenBlurred) }
  }, [])

  useEffect(() => {
    if (page !== 'arcade' || arcadeGame !== 'snake' || !game.running) return
    const timer = window.setTimeout(() => dispatch({ type: 'tick', random: Math.random() }), (game.seed === undefined ? gameTickMs(game.score) : 150 - (gameLevel(game.score) - 1) * 8))
    return () => window.clearTimeout(timer)
  }, [page, arcadeGame, game.running, game.score, game.steps])

  useEffect(() => {
    if (game.score > record) setRecords(previous => ({ ...previous, [game.mode]: saveSnakeRecord(game.score, game.mode) }))
  }, [game.score, game.mode, record])

  useEffect(() => {
    if (page !== 'arcade' || arcadeGame !== 'snake') return
    const directions: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      const direction = directions[event.key.length === 1 ? event.key.toLowerCase() : event.key]
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
  }, [page, arcadeGame, game.running, game.seed, competition.run?.status, competition.busy, competition.alias])

  const go = (destination: Page) => {
    if (page === 'arcade' && destination !== 'arcade') gameScreen.leave()
    if (page === 'arcade' && destination !== 'arcade') dispatch({ type: 'pause' })
    const url = new URL(window.location.href)
    url.searchParams.delete('panel')
    url.searchParams.delete('juego')
    if (destination !== 'danzflor') url.searchParams.delete('producto')
    if (destination !== 'admin' && destination !== 'fotos') url.searchParams.delete('album')
    if (destination !== 'cuenta') url.searchParams.delete('vincular')
    else if (instagramRequested) url.searchParams.set('vincular', 'instagram')
    if (destination === 'inicio') url.searchParams.delete('seccion')
    else url.searchParams.set('seccion', destination === 'danzin' ? 'musica' : destination)
    if (window.location.href !== url.href) haptic('selection')
    // History changes with the gesture; a snapshot must not delay browser Back.
    try { if (window.location.href !== url.href) window.history.pushState(window.history.state, '', url) } catch { /* In-memory navigation remains usable. */ }
    const destinationLocation = window.location.href
    transitionSection(() => {
      if (window.location.href !== destinationLocation) return
      flushSync(() => { setArcadeGame(null); setLaunchGroove(false); setPage(destination) })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, page !== destination && arcadeGame === null)
  }

  const openSnake = () => {
    cancelSectionTransition()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'jack')
    try { window.history.pushState(window.history.state, '', url) } catch { /* In-memory navigation remains available. */ }
    flushSync(() => { setPage('arcade'); setArcadeGame('snake') })
    gameScreen.enter()
    requestArcadeFullscreen()
  }
  useEffect(() => { if (page === 'arcade' && arcadeGame === 'snake') gameScreen.enter() }, [page, arcadeGame])
  const snakeWasImmersive = useRef(false)
  useEffect(() => {
    if (snakeWasImmersive.current && !gameScreen.active && page === 'arcade' && arcadeGame === 'snake') go('arcade')
    snakeWasImmersive.current = gameScreen.active
  }, [gameScreen.active])

  const openGroove = (immersive = true) => {
    cancelSectionTransition()
    setLaunchGroove(immersive)
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'groove-ninja')
    try { window.history.pushState(window.history.state, '', url) } catch { /* In-memory navigation remains available. */ }
    setPage('arcade'); setArcadeGame('groove'); window.scrollTo({ top: 0 })
    requestArcadeFullscreen()
  }

  const openIdle = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'idle-studio')
    try { window.history.pushState(window.history.state, '', url) } catch { /* In-memory navigation remains available. */ }
    setPage('arcade'); setArcadeGame('idle'); window.scrollTo({ top: 0 })
  }

  const openArena = (mode: 'arena' | 'arena-solo' = 'arena') => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', mode)
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame(mode)
    requestArcadeFullscreen()
  }
  const openChase = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'pilla-pilla')
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame('chase')
    requestArcadeFullscreen()
  }
  const openKart = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'kart')
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame('kart'); window.scrollTo({top:0})
    requestArcadeFullscreen()
  }
  const openCollecta = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'collecta')
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame('collecta'); window.scrollTo({top:0})
    requestArcadeFullscreen()
  }
  const openMike = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'mike')
    try { window.history.pushState(window.history.state, '', url) } catch {}
    setPage('arcade'); setArcadeGame('mike'); window.scrollTo({top:0})
    requestArcadeFullscreen()
  }

  useEffect(() => {
    const back = () => { cancelSectionTransition(); dispatch({ type: 'pause' }); gameScreen.leave(); setLaunchGroove(locationGame() === 'groove'); setInstagramRequested(new URLSearchParams(window.location.search).get('vincular') === 'instagram'); setPage(locationPage()); setArcadeGame(locationGame()) }
    window.addEventListener('popstate', back)
    return () => { cancelSectionTransition(); window.removeEventListener('popstate', back) }
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
      {auth.user && !quickArrival && page !== 'arcade' && page !== 'cuenta' && <div className="content"><InstagramWelcome onConnect={() => {
        setInstagramRequested(true)
        go('cuenta')
      }} /></div>}

      <main className="app-main">
        {pendingPass && page !== 'danzers' && page !== 'pasaporte' && page !== 'arcade' && <div className="content pending-pass-banner"><span>{pendingPasses.length === 1 ? 'Tienes un pase de evento guardado.' : `Tienes ${pendingPasses.length} pases de evento guardados.`}</span><button className="outline-btn" onClick={() => go('danzers')}>ABRIR MI PASE ↗</button></div>}
        {page === 'inicio' && testLab && <Suspense fallback={<p role="status">Abriendo zona de pruebas…</p>}><TestLab onKart={openKart} onCollecta={openCollecta} onJack={openSnake} onGroove={()=>openGroove(true)} onLibrary={()=>go('arcade')} onYeppo={move=>{markYeppoWelcomeDone();setYeppoEnabled(true);setYeppoDemo(previous=>({id:previous.id+1,move}))}}/></Suspense>}
        {page === 'inicio' && !testLab && (
          <>
            <section className="intro content">
              <div className="eyebrow"><DanzFlower className="eyebrow-flower" /> MUSIC · PEOPLE · CULTURE</div>
              <h1>VIVE.<br /><em>RECUERDA.</em><br />JUEGA.</h1>
              <div className="intro-bottom">
                <p>Tu noche no acaba cuando termina la música.</p>
                <span>FOTOS · PASAPORTE · ARCADANZ ↓</span>
              </div>
            </section>

            <section className="danz-home-priority content" aria-label="Descubre DANZ">
              <button className="feature photo-feature danz-home-photo" onClick={() => go('fotos')}>
                <span className="feature-top"><span>01 / NUESTRAS NOCHES</span><Arrow /></span>
                <div className="photo-art" aria-hidden="true"><span>★</span><i/><b>AFTER<br />THE<br />NIGHT</b></div>
                <span className="feature-bottom"><strong>FOTOS</strong><small>Las noches pasan. Los recuerdos quedan. <span aria-hidden="true">↗</span></small></span>
              </button>

              <section className="passport-home-section danz-wallet-home" aria-label="Tu pasaporte DANZ">
                <button className="danz-wallet-link" type="button" onClick={() => go('pasaporte')} aria-label="Abrir mi Pasaporte DANZ y ver mis sellos">
                  <span className="danz-wallet-stack" aria-hidden="true"><span className="danz-wallet-back-card"/><span className="danz-wallet-front-card"><DanzFlower/><b>DANZ</b><small>PASAPORTE</small></span><span className="danz-wallet-strap"><DanzFlower/></span></span>
                  <span className="danz-wallet-home-copy"><small>02 / TU CARTERA DE FIESTAS</small><strong>UN PASAPORTE.<br/>TODAS TUS NOCHES.</strong><span>Una fiesta, un sello, un recuerdo. Descubre tu colección DANZ.</span><em>DESCUBRIR MI PASAPORTE <span aria-hidden="true">↗</span></em></span>
                </button>
              </section>

              <button className="feature arcade-feature danz-home-arcade" onClick={() => go('arcade')}>
                <span className="feature-top"><span>03 / PLAY DANZ</span><Arrow /></span>
                <GameCover className="snake-art cable-cover" decorative />
                <span className="feature-bottom"><strong>ARCADANZ</strong><small>Juega, compite y descubre. <span aria-hidden="true">↗</span></small></span>
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
        {localGalleryOpened.current && <Suspense fallback={<div className="content"><LoadingSkeleton label="Abriendo tus álbumes…"/></div>}><PhotoGallery active={page === 'fotos' && photoSource === 'local'} onBack={() => go('inicio')} /></Suspense>}
        {page === 'fotos' && photoSource !== 'local' && <Suspense fallback={<div className="content"><LoadingSkeleton label="Abriendo las galerías…"/></div>}>{admin.loading ? <div className="content"><LoadingSkeleton label="Comprobando tus álbumes…"/></div> : photoSource === 'private' && managesPhotos ? <section className="content inner-page"><AdminPanel key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} access={admin} setup={adminMfaSetup} onSignIn={() => go('cuenta')} albumsOnly /></section> : <PrivateGallery key={`${auth.user?.id ?? 'guest'}-${galleryEvent}`} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} initialEventId={galleryEvent} onSignIn={() => go('cuenta')} />}</Suspense>}
        {page === 'cuenta' && <section className="content inner-page">
          <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
          {admin.member && !admin.loading && <button className="outline-btn admin-link" onClick={() => go('admin')}>ABRIR ADMINISTRACIÓN</button>}
          <Suspense fallback={<p role="status">Abriendo tu cuenta…</p>}><Account key={auth.user?.id ?? 'guest'} focusInstagram={instagramRequested} /></Suspense>
        </section>}
        {page === 'admin' && <section className="content inner-page"><button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button><Suspense fallback={<p role="status">Abriendo administración…</p>}><AdminPanel key={auth.user?.id ?? 'guest'} client={auth.client} userId={auth.user?.id ?? null} authLoading={auth.loading} access={admin} setup={adminMfaSetup} onSignIn={() => go('cuenta')} /></Suspense></section>}

        {page === 'arcade' && arcadeGame === null && <section className="content inner-page arcade-library" aria-label="Biblioteca ARCADANZ">
          <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
          <header className="arcade-library-heading"><div><span className="eyebrow">DANZ COLLECTIVE / PLAY TOGETHER</span><img src="/brand/arcadanz-wordmark-v2.webp" alt="ARCADANZ" width="2172" height="724"/><h1>TU BIBLIOTECA.</h1><p>Elige una portada. La siguiente partida es tuya.</p></div><span className="arcade-library-count">05 <small>JUEGOS DISPONIBLES</small></span></header>
          <button type="button" className="arcade-library-upcoming" aria-label="DANZ Idle Studio" onClick={openIdle}><img src="/arcade/idle-studio-industrial.webp" alt="Taller creativo de DANZ Idle Studio" width="1200" height="900" loading="lazy"/><div><span className="eyebrow">05 / ESTUDIO</span><h2>DANZ IDLE STUDIO</h2><p>Música, moda, vídeo y el sello. El código del juego está en el repositorio.</p><small>JUGAR ↗ · src/arcade/idle</small></div></button>
          <ArcadeChooser onSelect={choice => choice === 'kart' ? openKart() : choice === 'collecta' ? openCollecta() : choice === 'mike' ? openMike() : choice === 'groove' ? openGroove(true) : openSnake()} />
          <SnakeCompetition key={auth.user?.id??'guest'} competition={competition} onSignIn={()=>go('cuenta')} />
        </section>}
        {page === 'arcade' && arcadeGame === 'collecta' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo DANZ Collecta…</p>}><CollectaHub controls={collectaControls} onControls={setCollectaControls} onArena={() => openArena()} onSolo={() => openArena('arena-solo')} onChase={openChase} onBack={() => go('arcade')}/></Suspense>}
        {page === 'arcade' && arcadeGame === 'mike' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo It's Mike's fault…</p>}><ItsMikesFault onBack={() => go('arcade')} /></Suspense>}
        {page === 'arcade' && arcadeGame === 'idle' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo DANZ Idle Studio…</p>}><DanzIdleStudio onExit={() => go('arcade')} /></Suspense>}
        {page === 'arcade' && arcadeGame === 'kart' && <Suspense fallback={<p className="arcade-loading" role="status">Preparando DANZPORTER…</p>}><KartMini onBack={() => go('arcade')}/></Suspense>}
        {page === 'arcade' && arcadeGame === 'chase' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo Persecución…</p>}><YeppoChase controls={collectaControls} onBack={openCollecta} /></Suspense>}
        {page === 'arcade' && (arcadeGame === 'arena' || arcadeGame === 'arena-solo') && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo Arena…</p>}><ArenaDuel key={arcadeGame} opponent={arcadeGame === 'arena-solo' ? 'cpu' : 'human'} controls={collectaControls} onBack={openCollecta} /></Suspense>}
        {page === 'arcade' && arcadeGame === 'groove' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo GROOVE NINJA…</p>}><GrooveNinja autoEnter={launchGroove} onBack={() => { setLaunchGroove(false); go('arcade') }} /></Suspense>}
        {page === 'arcade' && arcadeGame === 'snake' && (
          <section className="content inner-page arcade-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="arcade-intro">
              <div className="arcadanz-brand"><img src="/brand/arcadanz-wordmark-v2.webp" alt="ARCADANZ" width="2172" height="724" decoding="async" /></div>
              <div className="eyebrow">ARCADANZ / GAME 001</div>
              <h1 className="page-title arcade-game-title">LA QUE HAS<br /><em>LIAO, JACK.</em></h1>
              <p className="page-lead">Un cable suelto, las caras del colectivo y doce laberintos. Que no te pillen.</p>
              <GameCover className="snake-cover" />
            </div>
            <div ref={gameScreen.panel} className={`game-panel${gameScreen.active ? ' is-immersive' : ''}${showControls ? ' has-controls' : ''}${game.seed!==undefined?' is-ranked':''}${competition.run?.status==='active'?' is-ranked-live':game.seed!==undefined?' is-ranked-result':''}`}>
              {gameScreen.active && <ArcadeLaunch game="snake" running={game.running} onPlay={play} onExit={()=>{gameScreen.leave();go('arcade')}} settings={<button type="button" aria-pressed={showControls} onClick={toggleControls}>BOTONES EN PANTALLA <b>{showControls?'ON':'OFF'}</b></button>}>
                <SelectionReel label="Modo de Snake" choices={[{id:'classic',name:'CLÁSICO',note:'El cable crece. La crew no espera.'},{id:'maze',name:'LABERINTO',note:'Doce recorridos. Cero choques.'}]} value={game.mode} onChange={id=>{competition.clear();dispatch({type:'mode',mode:id==='maze'?'maze':'classic'})}}/>
                {game.mode==='maze'&&<SelectionReel compact label="Recorrido del laberinto" choices={MAZE_STAGES.map((name,i)=>({id:String(i+1),name}))} value={String(game.stage)} onChange={id=>{competition.clear();dispatch({type:'maze-level',stage:Number(id)})}}/>}
              </ArcadeLaunch>}
              {gameScreen.active && <div className="game-screen-bar"><span>{GAME_SHORT_TITLE} · {GRID} × {GRID}</span><button type="button" className="outline-btn" onClick={() => { gameScreen.leave(); go('arcade') }}>SALIR DEL JUEGO ↗</button></div>}
              <div className="game-modes" role="group" aria-label="Modo de Snake">
                <button type="button" aria-pressed={game.mode === 'classic'} onClick={() => {competition.clear();dispatch({ type: 'mode', mode: 'classic' })}}>CLÁSICO</button>
                <button type="button" aria-pressed={game.mode === 'maze'} onClick={() => {competition.clear();dispatch({ type: 'mode', mode: 'maze' })}}>LABERINTO <span>{MAZE_STAGES.length} NIVELES</span></button>
              </div>
              {game.mode === 'maze' && <div className="maze-level-picker"><label htmlFor="maze-level">RECORRIDO</label><select id="maze-level" value={game.stage} onChange={event => {competition.clear();dispatch({ type: 'maze-level', stage: Number(event.target.value) })}}>{MAZE_STAGES.map((name, i) => <option key={name} value={i + 1}>{i + 1} · {name}</option>)}</select><span>{game.stage < MAZE_STAGES.length ? `${game.stageGoals}/5 OBJETIVOS` : 'MODO INFINITO'}</span></div>}
              <div className="game-heading"><span>PUNTOS <strong key={game.score} className={game.score ? 'snake-score-gain' : undefined}>{String(game.score).padStart(4, '0')}</strong></span><span>RÉCORD <strong>{String(record).padStart(4, '0')}</strong></span><span className="snake-stage">NIVEL {game.mode === 'maze' ? game.stage : gameLevel(game.score)}<span className="snake-stage-progress" aria-label={game.mode === 'classic' && gameLevel(game.score) === 10 ? 'Velocidad máxima alcanzada' : game.mode === 'maze' && game.stage === MAZE_STAGES.length ? 'Laberinto infinito' : `${game.mode === 'maze' ? game.stageGoals : game.score % 50 / 10} de 5 objetivos para el siguiente nivel`}>{Array.from({length:5},(_,i)=><i key={i} data-filled={i < (game.mode === 'maze' ? game.stageGoals : game.score % 50 / 10)}/>)}</span></span></div>
              <div className="game-board-space"><div className={`game-board${game.mode === 'maze' ? ' maze-board' : ''}`} style={{ gridTemplateColumns: `repeat(${GRID},1fr)`, gridTemplateRows: `repeat(${GRID},1fr)` }} onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null }} onLostPointerCapture={() => { gesture.current = null }} role="img" aria-label={`Tablero de Snake${game.mode === 'maze' ? ` laberinto ${game.stage}` : ''}, puntuación ${game.score}`}>
                <SnakeCable points={game.snake} grid={GRID}/>
                <SnakeCells game={game} artwork={collective.snake}/>
                {!game.running && <div className="game-overlay"><span className="game-overlay-title">{game.won ? '¡COMPLETADO!' : game.over ? 'PARTY OVER' : game.levelUp ? `NIVEL ${game.stage}` : game.steps ? 'EN PAUSA' : GAME_TITLE}</span><small>{game.over ? 'OTRA PARTIDA?' : game.levelUp ? MAZE_STAGES[game.stage - 1].toUpperCase() : game.steps ? 'REANUDA CUANDO QUIERAS' : 'PULSA JUGAR'}</small></div>}
              </div></div>
              <div className="game-actions">
                <button className="primary-btn" disabled={competition.busy||(game.seed!==undefined&&['saving','error'].includes(competition.run?.status??''))} onClick={play}>{game.seed!==undefined&&['saved','expired'].includes(competition.run?.status??'')?'VOLVER A COMPETIR':game.running ? 'PAUSAR' : game.over ? 'VOLVER A JUGAR' : game.levelUp ? 'CONTINUAR NIVEL' : 'JUGAR'} <span>→</span></button>
                <button className="outline-btn" onClick={() => {competition.clear();dispatch({ type: 'reset' })}}>REINICIAR</button>
                {competition.run?.status==='active'&&Boolean(game.replay)&&!game.over&&<button className="outline-btn ranked-finish" onClick={()=>void competition.save()}>TERMINAR Y GUARDAR</button>}
                {competition.run?.status==='error'&&<button className="outline-btn ranked-finish" onClick={()=>void competition.save()}>REINTENTAR GUARDADO</button>}
              </div>
              {game.seed!==undefined&&<p className="game-competition-status" role="status">{competition.message}</p>}
              <div className="game-control-options">
                <p>Gira al deslizar, sin levantar el dedo.</p>
                <button type="button" className="outline-btn" aria-pressed={showControls} onClick={toggleControls}>
                  {showControls ? 'OCULTAR BOTONES' : 'MOSTRAR BOTONES'} ⌘
                </button>
              </div>
              {showControls && <div className="controls" aria-label="Controles para móvil">
                {(['up', 'left', 'down', 'right'] as Direction[]).map((direction, i) => <button key={direction} aria-label={['Arriba', 'Izquierda', 'Abajo', 'Derecha'][i]} onPointerDown={event => { event.preventDefault(); turn(direction) }} onClick={event => { if (event.detail === 0) turn(direction) }}>{['↑', '←', '↓', '→'][i]}</button>)}
              </div>}
              <p className="game-local-note">Aparece un objetivo más cada cinco caras recogidas, hasta cinco a la vez. Diez personas, tres expresiones cada una: no se agotan.<br />{game.mode === 'maze' ? `Recoge cinco caras para avanzar. En ${MAZE_STAGES.at(-1)}, sigue hasta donde llegues.` : 'La velocidad sube cada cinco caras.'} Cambiar de modo o recorrido inicia otra partida.<br />Práctica: récord de {game.mode === 'maze' ? 'laberinto' : 'clásico'} en este navegador. {COMPETITION_ENABLED?'Entra desde COMPETIR para registrar una partida en tu cuenta.':'La clasificación entre cuentas y sus premios están en preparación.'}</p>
            </div>
          </section>
        )}

        {(page === 'pasaporte' || page === 'danzers') && (
          <section className="content inner-page passport-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <EventPassport key={auth.user?.id ?? 'guest'} arrival={page === 'danzers'} client={auth.client} userId={auth.user?.id ?? null} registeredAt={auth.user?.created_at ?? null} authLoading={auth.loading} pendingPass={pendingPass} pendingCount={pendingPasses.length} redemption={redemption} launchIssue={passIssue} onPendingPass={syncPasses} onSignIn={() => go('cuenta')} onContinue={() => go('inicio')} onGallery={eventId => { setGalleryEvent(eventId); setPhotoSource('attendance'); go('fotos') }} />
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

      <DanzRadio arcadeActive={page==='arcade'||page==='admin'||page==='cuenta'} />
      <Yeppo page={page} gameActive={(page==='arcade'&&(arcadeGame==='arena'||arcadeGame==='arena-solo'||arcadeGame==='chase'||arcadeGame==='kart'))||gameScreen.active||(page==='arcade'&&arcadeGame==='groove'&&launchGroove)} onNavigate={go} demoRequest={testLab?yeppoDemo:undefined} />
      <MobileBottomNav page={page} navigate={go} adminAvailable={admin.member && !admin.loading} />
      <footer className="footer content"><span className="footer-brand"><DanzFlower /> DANZ COLLECTIVE © {new Date().getFullYear()}</span><span>MUSIC · PEOPLE · CULTURE</span></footer>
    </div>
  )
}
