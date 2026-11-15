import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createArena, pauseArena, placeBomb, startArena, stepArena, ROUND_MS, type Arena, type Direction, type PlayerId } from './engine'
import { createArenaRenderer } from './renderer'
import './arena.css'

const KEYS: Record<string, [PlayerId, Direction]> = { w: [0, 'up'], s: [0, 'down'], a: [0, 'left'], d: [0, 'right'], ArrowUp: [1, 'up'], ArrowDown: [1, 'down'], ArrowLeft: [1, 'left'], ArrowRight: [1, 'right'] }
const DIRECTIONS: [Direction, string, string][] = [['up', 'Arriba', '↑'], ['left', 'Izquierda', '←'], ['down', 'Abajo', '↓'], ['right', 'Derecha', '→']]

export default function ArenaDuel({ onBack }: { onBack: () => void }) {
  const state = useRef(createArena(426))
  const [hud, setHud] = useState<Arena>(state.current)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const pointers = useRef(new Map<number, [PlayerId, Direction]>())
  const keys = useRef(new Map<string, [PlayerId, Direction]>())
  const back = useRef(onBack); back.current = onBack
  const clear = () => { pointers.current.clear(); keys.current.clear() }
  const sync = (next: Arena) => { state.current = next; setHud(next) }
  const pause = () => { clear(); sync(pauseArena(state.current)) }
  const drop = (id: PlayerId) => sync(placeBomb(state.current, id))
  const play = () => {
    clear(); sync(startArena(state.current))
    panel.current?.focus({ preventScroll: true })
    try { void panel.current?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {}) } catch { /* Dedicated viewport remains available. */ }
  }
  const exit = () => {
    pause()
    if (document.fullscreenElement === panel.current) void document.exitFullscreen().catch(() => {})
    back.current()
  }
  const actions = useRef({ pause, drop, exit }); actions.current = { pause, drop, exit }

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let alive = true, booted = false, publishIn = 0
    setError(''); setReady(false)
    let destroy: (() => void) | undefined
    const timeout = window.setTimeout(() => { if (alive && !booted) setError('La pista no se ha podido abrir. Prueba a cargarla otra vez.') }, 8000)
    try {
      destroy = createArenaRenderer(parent, () => state.current, delta => {
        if (!alive) return
        const input: [Direction | null, Direction | null] = [null, null]
        for (const [id, direction] of [...keys.current.values(), ...pointers.current.values()]) input[id] = direction
        const previous = state.current, next = stepArena(previous, input, delta)
        state.current = next
        publishIn += delta
        if (next !== previous && (publishIn >= 100 || next.phase !== previous.phase || next.bombs.length !== previous.bombs.length)) { publishIn = 0; setHud(next) }
      }, () => { booted = true; window.clearTimeout(timeout); if (alive) setReady(true) })
    } catch { setError('La pista no se ha podido abrir. Prueba a cargarla otra vez.') }
    return () => { alive = false; window.clearTimeout(timeout); destroy?.(); clear() }
  }, [retry])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const hidden = () => { if (document.hidden) actions.current.pause() }
    const blur = () => actions.current.pause()
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { actions.current.exit(); return }
      if ((event.target as HTMLElement)?.closest('input,textarea,select')) return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (KEYS[key]) { event.preventDefault(); keys.current.set(key, KEYS[key]) }
      if ((key === 'f' || key === 'l') && !event.repeat) { event.preventDefault(); actions.current.drop(key === 'f' ? 0 : 1) }
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key)
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('blur', blur); window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('blur', blur); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up)
      if (document.fullscreenElement === panel.current) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  const move = (event: PointerEvent<HTMLButtonElement>, id: PlayerId, direction: Direction) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, [id, direction])
  }
  const release = (event: PointerEvent<HTMLButtonElement>) => { pointers.current.delete(event.pointerId) }
  const active = hud.phase === 'playing'
  const over = hud.phase === 'round-over' || hud.phase === 'match-over'
  const title = hud.phase === 'paused' ? 'PAUSA EN LA PISTA.' : over ? hud.winner === 'draw' ? 'EMPATE. OTRA MÁS.' : `P${Number(hud.winner) + 1} ${hud.phase === 'match-over' ? 'SE LLEVA EL DUELO.' : 'GANA LA RONDA.'}` : 'DOS FLORES. UNA PISTA.'
  const controller = (id: PlayerId) => <section className={`arena-controller arena-p${id + 1}`} aria-label={`Mando del jugador ${id + 1}`}>
    <header><span>P{id + 1} <b>{id === 0 ? 'ACID' : 'ROSE'}</b></span><strong aria-label={`Victorias del jugador ${id + 1}`}>{hud.scores[id]}<small>/3</small></strong></header>
    <div className="arena-dpad">{DIRECTIONS.map(([direction, label, arrow]) => <button key={direction} type="button" className={`arena-dir-${direction}`} disabled={!active} aria-label={`P${id + 1} ${label}`} onPointerDown={event => move(event, id, direction)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onClick={event => { if (event.detail === 0) sync(stepArena(state.current, id === 0 ? [direction, null] : [null, direction], 0)) }}>{arrow}</button>)}</div>
    <button type="button" className="arena-drop" disabled={!active} onPointerDown={event => { event.preventDefault(); drop(id) }} onClick={event => { if (event.detail === 0) drop(id) }} aria-label={`P${id + 1} Soltar disco`}><i aria-hidden="true"/> SOLTAR DISCO <span>{hud.players[id].capacity - hud.bombs.filter(b => b.owner === id).length}/{hud.players[id].capacity}</span></button>
    <small className="arena-keyboard">{id === 0 ? 'W A S D · F = DISCO' : 'FLECHAS · L = DISCO'}</small>
  </section>

  return <section ref={panel} tabIndex={-1} className="arena-game" aria-label="Arena DANZ, duelo local" data-phase={hud.phase} data-p1={`${hud.players[0].x},${hud.players[0].y}`} data-p2={`${hud.players[1].x},${hud.players[1].y}`} data-bombs={hud.bombs.length} data-elapsed={Math.floor(hud.elapsed)} data-round={hud.round}>
    <header className="arena-top"><button type="button" onClick={exit} aria-label="Salir de Arena DANZ">← BIBLIOTECA</button><div><strong>ARENA <em>DANZ</em></strong><span>DUEL LOCAL · 01 / CLUB FLOOR</span></div><button type="button" disabled={!active && hud.phase !== 'paused'} onClick={() => active ? pause() : play()}>{hud.phase === 'paused' ? 'REANUDAR' : 'PAUSAR'}</button></header>
    <div className="arena-round"><span>RONDA {hud.round.toString().padStart(2, '0')}</span><strong aria-label="Tiempo de la ronda">{Math.max(0, Math.ceil((ROUND_MS - hud.elapsed) / 1000))}<small>s</small></strong><span>PRIMERO EN GANAR 3</span></div>
    <div className="arena-layout">{controller(0)}<div className="arena-board-wrap"><div className="arena-board" ref={host} role="img" aria-label="Pista de Arena DANZ con dos jugadores, altavoces y cajas destructibles" data-ready={ready}/>
      {(!active || error) && <div className="arena-overlay"><span className="arena-kicker">{error ? 'UN MOMENTO' : hud.phase === 'match-over' ? 'DUELO TERMINADO' : over ? 'FIN DE RONDA' : hud.phase === 'paused' ? 'VUELVE CUANDO QUIERAS' : 'ARCADANZ / LOCAL VERSUS'}</span><h1>{title}</h1><p>{error || (over ? 'Una revancha sabe mejor. Cambia de camino, combina discos y encuentra tu hueco.' : 'Rompe las cajas. Encadena los discos. Escapa de la onda: también te alcanza a ti.')}</p><div className="arena-versus"><span>P1 / ACID</span><b>VS</b><span>P2 / ROSE</span></div>
      {error ? <button type="button" onClick={() => setRetry(n => n + 1)}>VOLVER A CARGAR</button> : <button type="button" disabled={!ready} onClick={play}>{!ready ? 'ABRIENDO LA PISTA…' : hud.phase === 'paused' ? 'SEGUIR EL DUELO' : hud.phase === 'match-over' ? 'REVANCHA' : over ? 'SIGUIENTE RONDA' : 'EMPEZAR DUELO'}</button>}
      <small>Dos personas en el mismo móvil. Mejor en horizontal.</small></div>}
    </div>{controller(1)}</div>
    <footer className="arena-note">PRÁCTICA LOCAL <span>Disco: 1,9 s · Las ondas se detienen en cajas y altavoces · + alcance / ◉ disco extra</span></footer>
  </section>
}
