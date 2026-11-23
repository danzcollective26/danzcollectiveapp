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
const CollectaDropDefense = lazy(() => import('./arcade/CollectaDropDefense'))
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
function locationGame(): 'snake' | 'groove' | 'arena' | 'arena-solo' | 'chase' | 'collecta' | 'drop' | 'kart' | 'idle' | null {
  const value = new URLSearchParams(window.location.search).get('juego')
  return value === 'idle-studio' ? 'idle' : value === 'kart' ? 'kart' : value === 'arena-solo' ? 'arena-solo' : value === 'collecta' ? 'collecta' : value === 'drop' ? 'drop' : value === 'pilla-pilla' ? 'chase' : value === 'arena' ? 'arena' : value === 'groove-ninja' ? 'groove' : value === 'jack' || value === 'snake' ? 'snake' : null
}

export default function App() {
  const auth = useAuth()
  const [collectaControls, setCollectaControls] = useState(readCollectaControls)
  useEffect(() => saveCollectaControls(collectaControls), [collectaControls])
  const [yeppoDemo, setYeppoDemo] = useState<YeppoDemoRequest>({ id: 0, move: 'stroll' })
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
  const openDrop = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'drop')
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame('drop'); window.scrollTo({top:0})
    requestArcadeFullscreen()
  }
  const openKart = () => {
    cancelSectionTransition()
    dispatch({ type: 'pause' }); gameScreen.leave()
    const url = new URL(window.location.href)
    url.searchParams.delete('panel'); url.searchParams.set('seccion', 'arcade'); url.searchParams.set('juego', 'kart')
    try { window.history.pushState(window.history.state, '', url) } catch { /* Local navigation remains available. */ }
    setPage('arcade'); setArcadeGame('kart')
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
            <button key={item.id} type="button" className={page === item.id ? 'active' : ''} onClick={() => go(item.id)}>{item.label}</button>
          ))}
        </nav>
      </header>
      {page === 'arcade' && arcadeGame === 'collecta' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo DANZ Collecta…</p>}><CollectaHub controls={collectaControls} onControls={setCollectaControls} onArena={() => openArena()} onSolo={() => openArena('arena-solo')} onChase={openChase} onDrop={openDrop} onBack={() => go('arcade')}/></Suspense>}
      {page === 'arcade' && arcadeGame === 'drop' && <Suspense fallback={<p className="arcade-loading" role="status">Abriendo Drop Defense…</p>}><CollectaDropDefense onBack={openCollecta} /></Suspense>}
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
            <div className="game-board" onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture}>
              <SnakeCable />
              <SnakeCells game={game} />
            </div>
            {showControls && <div className="game-controls">
              <button type="button" onClick={() => turn('up')}>↑</button>
              <button type="button" onClick={() => turn('left')}>←</button>
              <button type="button" onClick={() => turn('down')}>↓</button>
              <button type="button" onClick={() => turn('right')}>→</button>
            </div>}
            <div className="game-actions">
              <button type="button" className="primary" onClick={play}>{game.running ? 'PAUSA' : 'JUGAR'}</button>
              <button type="button" onClick={() => dispatch({ type: 'restart' })}>REINICIAR</button>
            </div>
            <div className="game-stats">
              <span>PUNTOS <strong>{game.score}</strong></span>
              <span>RÉCORD <strong>{record}</strong></span>
              <span>NIVEL <strong>{gameLevel(game.score)}</strong></span>
            </div>
            {competition.run && <SnakeCompetition run={competition.run} onClear={competition.clear} />} 
          </div>
        </section>
      )}
      {page !== 'arcade' && (
        <main>
          {page === 'inicio' && <section className="hero">
            <div className="hero-content">
              <div className="eyebrow">MUSIC · PEOPLE · CULTURE</div>
              <h1>DANZ<br /><em>COLLECTIVE</em></h1>
              <p>El colectivo. La pista. La crew.</p>
              <button type="button" className="cta" onClick={() => go('arcade')}>ARCADANZ <Arrow /></button>
            </div>
          </section>}
          {page === 'pasaporte' && <EventPassport />}
          {page === 'fotos' && <Suspense fallback={<LoadingSkeleton />}><PhotoGallery event={galleryEvent} source={photoSource} onSource={setPhotoSource} manages={managesPhotos} /></Suspense>}
          {page === 'danzers' && <section className="content"><h1>DANZERS</h1><p>La crew.</p></section>}
          {page === 'danzin' && <DanzMusic />}
          {page === 'danzflor' && <section className="content"><h1>DANZFLOR</h1></section>}
          {page === 'danzpoints' && <Suspense fallback={<LoadingSkeleton />}><DanzPoints /></Suspense>}
          {page === 'cuenta' && <Suspense fallback={<LoadingSkeleton />}><Account /></Suspense>}
          {page === 'admin' && <Suspense fallback={<LoadingSkeleton />}><AdminPanel /></Suspense>}
        </main>
      )}
      <MobileBottomNav page={page} onGo={go} />
      <Yeppo demo={yeppoDemo} onDemo={setYeppoDemo} />
      <InstagramWelcome requested={instagramRequested} onClose={() => setInstagramRequested(false)} />
      <PwaControls />
      {testLab && <Suspense fallback={null}><TestLab /></Suspense>}
    </div>
  )
}
