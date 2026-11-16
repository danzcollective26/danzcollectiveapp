import CollectaMatchMenu from '../CollectaMatchMenu'
import { requestArcadeFullscreen } from '../arcadeFullscreen'
import GameSurface from '../GameSurface'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createChase, startChase, pauseChase, dashChase, stepChase, CHASE_DURATION, type Chase, type PlayerId, type Vector } from './engine'
import { createChaseRenderer } from './renderer'
import { useVersusView } from '../useVersusView'
import { directionVector, worldDirection, worldVector, type LocalDirection } from '../versusView'
import VersusJoystick from '../VersusJoystick'
import type { StickVector } from '../joystick'
import { DEFAULT_COLLECTA_CONTROLS, type CollectaControls } from '../collectaControls'
import './chase.css'
import '../versusControls.css'

const KEYS: Record<string, [PlayerId, LocalDirection]> = { w: [0, 'up'], s: [0, 'down'], a: [0, 'left'], d: [0, 'right'], ArrowUp: [1, 'up'], ArrowDown: [1, 'down'], ArrowLeft: [1, 'left'], ArrowRight: [1, 'right'] }
const DIRECTIONS: [LocalDirection, string, string][] = [['up', 'Arriba', '↑'], ['left', 'Izquierda', '←'], ['down', 'Abajo', '↓'], ['right', 'Derecha', '→']]

export default function YeppoChase({ onBack, controls = DEFAULT_COLLECTA_CONTROLS }: { onBack: () => void; controls?: CollectaControls }) {
  const state = useRef<Chase>(createChase())
  const [hud, setHud] = useState<Chase>(state.current)
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0)
  const host = useRef<HTMLDivElement>(null), panel = useRef<HTMLElement>(null)
  const pointers = useRef(new Map<number, [PlayerId, LocalDirection]>()), keys = useRef(new Map<string, [PlayerId, LocalDirection]>())
  const renderer = useRef<ReturnType<typeof createChaseRenderer> | null>(null)
  const back = useRef(onBack); back.current = onBack
  const sticks = useRef<[StickVector,StickVector]>([{x:0,y:0},{x:0,y:0}])
  const clear = () => { pointers.current.clear(); keys.current.clear(); sticks.current = [{x:0,y:0},{x:0,y:0}] }
  const sync = (next: Chase) => { const reset = next.phase === 'playing' && state.current.phase !== 'playing'; state.current = next; setHud(next); renderer.current?.wake(reset) }
  const pause = () => { clear(); sync(pauseChase(state.current)) }
  const landscape = useVersusView(pause), view = useRef(landscape); view.current = landscape
  const dash = (id: PlayerId) => sync(dashChase(state.current, id))
  const play = () => {
    clear(); sync(startChase(state.current)); panel.current?.focus({ preventScroll: true })
    requestArcadeFullscreen()
  }
  const exit = () => { pause(); if (document.fullscreenElement === panel.current) void document.exitFullscreen().catch(() => {}); back.current() }
  const actions = useRef({ pause, dash, exit }); actions.current = { pause, dash, exit }

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let alive = true, booted = false, publishIn = 0
    setReady(false); setError('')
    const timer = window.setTimeout(() => { if (alive && !booted) { actions.current.pause(); setError('La pista no se ha podido abrir. Vuelve a cargarla.') } }, 8000)
    try {
      renderer.current = createChaseRenderer(parent, () => state.current, dt => {
        if (!alive) return
        const input: [Vector, Vector] = [{ x: 0, y: 0 }, { x: 0, y: 0 }]
        const pressed: [Set<LocalDirection>, Set<LocalDirection>] = [new Set(), new Set()]
        for (const [id, direction] of [...keys.current.values(), ...pointers.current.values()]) pressed[id].add(direction)
        for (const id of [0, 1] as const) for (const direction of pressed[id]) {
          const v = directionVector[worldDirection(direction, id, view.current)]; input[id].x += v.x; input[id].y += v.y
        }
        for (const id of [0,1] as const) { const v = worldVector(sticks.current[id],id,view.current); input[id].x += v.x; input[id].y += v.y }
        const previous = state.current, next = stepChase(previous, input, dt)
        state.current = next; publishIn += dt
        if (next !== previous && (publishIn >= 100 || next.phase !== previous.phase || next.tags !== previous.tags)) { publishIn = 0; setHud(next) }
      }, () => { booted = true; window.clearTimeout(timer); if (alive) setReady(true) })
    } catch { setError('La pista no se ha podido abrir. Vuelve a cargarla.') }
    return () => { alive = false; window.clearTimeout(timer); renderer.current?.destroy(); renderer.current = null; clear() }
  }, [retry])

  useEffect(() => {
    const previous = document.body.style.overflow, element = panel.current
    let native = Boolean(document.fullscreenElement)
    document.body.style.overflow = 'hidden'
    const hidden = () => { if (document.hidden) actions.current.pause() }
    const blur = () => actions.current.pause()
    const fullscreen = () => { if (document.fullscreenElement) native = true; else if (native) { native = false; actions.current.pause() } }
    const down = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'Escape') { actions.current.exit(); return }
      if ((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true]')) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (KEYS[key]) { e.preventDefault(); keys.current.set(key, KEYS[key]) }
      if ((key === 'f' || key === 'l') && !e.repeat) { e.preventDefault(); actions.current.dash(key === 'f' ? 0 : 1) }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)
    document.addEventListener('visibilitychange', hidden); document.addEventListener('fullscreenchange', fullscreen)
    window.addEventListener('blur', blur); window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('visibilitychange', hidden); document.removeEventListener('fullscreenchange', fullscreen)
      window.removeEventListener('blur', blur); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up)
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  const active = hud.phase === 'playing', over = hud.phase === 'over'
  const hold = (e: PointerEvent<HTMLButtonElement>, id: PlayerId, direction: LocalDirection) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, [id, direction]) }
  const release = (e: PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId) }
  const nudge = (id: PlayerId, direction: LocalDirection) => { const input: [Vector, Vector] = [{ x: 0, y: 0 }, { x: 0, y: 0 }]; input[id] = directionVector[worldDirection(direction, id, landscape)]; sync(stepChase(state.current, input, 100)) }
  const controller = (id: PlayerId) => <section className={`chase-controller versus-controller versus-p${id + 1}`} data-role={hud.hunter === id ? 'hunter' : 'runner'} aria-label={`Mando de Pilla-Pilla del jugador ${id + 1}`}><div className="versus-face">
    {controls[id] === 'joystick' ? <VersusJoystick player={id} active={active} onChange={v=>{sticks.current[id]=v}}/> : <div className="chase-dpad versus-pad">{DIRECTIONS.map(([direction, label, arrow]) => <button type="button" key={direction} className={`versus-${direction}`} disabled={!active} aria-label={`P${id + 1} ${label}`} onPointerDown={e => hold(e, id, direction)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onClick={e => { if (e.detail === 0) nudge(id, direction) }}>{arrow}</button>)}</div>}
    <div className="versus-meta"><header><span>P{id + 1}<b>{hud.hunter === id ? '◆ COBRA' : '○ ESCAPA'}</b></span><strong aria-label={`Capturas del jugador ${id + 1}`}>{hud.players[id].score}</strong></header>
    <button type="button" className="chase-dash versus-action" disabled={!active || hud.players[id].dashReadyAt > hud.elapsed} aria-label={`P${id + 1} Sprint`} onPointerDown={e => { e.preventDefault(); dash(id) }} onClick={e => { if (e.detail === 0) dash(id) }}>SPRINT<span>{hud.players[id].dashReadyAt > hud.elapsed ? `${Math.ceil((hud.players[id].dashReadyAt - hud.elapsed) / 1000)}s` : 'LISTO ↗'}</span></button></div>
  </div></section>
  const title = hud.phase === 'paused' ? 'VAMOS A HABLAR.' : over ? hud.winner === 'draw' ? 'QUE PAGUE OTRO.' : `P${Number(hud.winner)+1} LO TRAMITA.` : 'PASA EL MARRÓN.'
  return <section ref={panel} tabIndex={-1} className="chase-game" aria-label="Persecución de DANZ Collecta, duelo local" data-phase={hud.phase} data-view={landscape ? 'landscape' : 'portrait'} data-p1={`${hud.players[0].x.toFixed(1)},${hud.players[0].y.toFixed(1)}`} data-p2={`${hud.players[1].x.toFixed(1)},${hud.players[1].y.toFixed(1)}`} data-hunter={hud.hunter} data-tags={hud.tags} data-elapsed={Math.floor(hud.elapsed)}>
    <header className="chase-top" aria-hidden={!active}><button type="button" onClick={exit} aria-label="Salir de Persecución">← MODOS</button><div><strong>COLLECTA <em>PERSECUCIÓN</em></strong><span>PASA EL MARRÓN · CIERRE DE CUENTAS</span></div><button type="button" disabled={!active && hud.phase !== 'paused'} onClick={() => active ? pause() : play()}>{hud.phase === 'paused' ? 'REANUDAR' : 'PAUSAR'}</button></header>
    <div className="chase-status"><strong aria-label="Tiempo de Pilla-Pilla">{Math.max(0, Math.ceil((CHASE_DURATION - hud.elapsed) / 1000))}<small>s</small></strong><span role="status">{hud.elapsed - hud.lastTagAt < 1200 ? `P${Number(hud.lastCatcher)+1}: TRAMITADO. P${hud.hunter+1} LLEVA LA FACTURA.` : `P${hud.hunter+1} COBRA · P${hud.hunter===0?2:1} SE ESCAQUEA`}</span></div>
    <div className="chase-layout versus-layout" aria-hidden={!active}>{controller(0)}<GameSurface ratio={880/600} className="chase-board-wrap versus-board"><div className="chase-board" ref={host} role="img" aria-label="Club de Collecta con dos jugadores, cabina y altavoces" data-ready={ready}/>

    </GameSurface>{controller(1)}</div>
    <footer className="chase-note">PRÁCTICA LOCAL · 60 s · SIN PREMIOS COMPETITIVOS<span>Al girar el móvil, se pausa la partida.</span></footer>
    {(!active||error)&&<CollectaMatchMenu game="chase" title={title} phase={hud.phase} score={`P1 ${hud.players[0].score} · ${hud.players[1].score} P2`} disabled={!error&&!ready} error={error} onBack={exit} onPlay={error?()=>setRetry(n=>n+1):play} action={error?'VOLVER A CARGAR':!ready?'ABRIENDO EL CLUB…':hud.phase==='paused'?'SEGUIR CORRIENDO':over?'REVANCHA':'EMPEZAR PERSECUCIÓN'}/>}
  </section>
}
