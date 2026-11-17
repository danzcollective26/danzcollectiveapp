import { useEffect, useRef, useState, type CSSProperties } from 'react'
import ArcadeMenu from '../ArcadeMenu'
import { requestArcadeFullscreen } from '../arcadeFullscreen'
import { haptic } from '../../ui/haptics'
import { AfterDropAudio } from './audio'
import {
  IDLE_INPUT, MAX_LIVES, RECORD_KEY, SESSION_MS, bpmAt, committedScore, createDrop, dropPayout,
  intensityAt, pauseDrop, readAfterDropRecord, resumeDrop, saveAfterDropRecord, startDrop, stepDrop,
  type Drop, type DropInput, type Lane,
} from './logic'
import { createAfterDropRenderer } from './renderer'
import './afterdrop.css'

const HOLD_MS = 560
type Progress = { schemaVersion: 1; gameId: 'afterdrop'; milestone: 'loot-extracted' | 'perfect-streak' }

function clock(ms: number) {
  const total = Math.min(SESSION_MS, Math.max(0, Math.floor(ms / 1000)))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function AfterDrop({ onExit, storageKey = RECORD_KEY, onProgress }: {
  onExit: () => void
  storageKey?: string
  onProgress?: (event: Progress) => void
}) {
  const audio = useRef(new AfterDropAudio())
  const commands = useRef<DropInput>({ ...IDLE_INPUT })
  const state = useRef(createDrop(Math.floor(Math.random() * 1_000_000_000) || 1))
  const [hud, setHud] = useState<Drop>(state.current)
  const [record, setRecord] = useState(() => readAfterDropRecord(undefined, storageKey).score)
  const [menuPage, setMenuPage] = useState('play')
  const [hold, setHold] = useState(0)
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const holdStart = useRef<number | null>(null)
  const holdFrame = useRef(0)
  const renderer = useRef<ReturnType<typeof createAfterDropRenderer> | null>(null)
  const reported = useRef({ loot: false, streak: false })
  const back = useRef(onExit)
  back.current = onExit
  const progress = useRef(onProgress)
  progress.current = onProgress
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const payout = dropPayout(hud)

  const cancelHold = () => {
    holdStart.current = null
    cancelAnimationFrame(holdFrame.current)
    setHold(0)
  }
  const finishHold = () => {
    const started = holdStart.current
    const elapsed = started == null ? 0 : performance.now() - started
    cancelHold()
    if (started != null && elapsed >= HOLD_MS && state.current.phase === 'playing') commands.current.extract = true
  }
  const beginHold = () => {
    if (state.current.phase !== 'playing' || dropPayout(state.current) <= 0 || holdStart.current != null) return
    holdStart.current = performance.now()
    const tick = () => {
      if (holdStart.current == null) return
      const ratio = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS)
      setHold(ratio)
      if (ratio >= 1) { finishHold(); return }
      holdFrame.current = requestAnimationFrame(tick)
    }
    holdFrame.current = requestAnimationFrame(tick)
  }

  const publish = useRef(0)
  const react = (previous: Drop, next: Drop, delta: number) => {
    if (next.judgement && next.judgement !== previous.judgement) {
      if (next.judgement.grade === 'PERFECTO') { audio.current.perfecto(); haptic('success') }
      else if (next.judgement.grade === 'BIEN') audio.current.bien()
      else audio.current.fallo()
    }
    if (next.lives < previous.lives) { audio.current.hit(); haptic('tap') }
    if (next.phase === 'extracted' && previous.phase !== 'extracted') {
      audio.current.extract()
      const score = committedScore(next)
      if (score > 0) setRecord(saveAfterDropRecord(score, next.bestCombo, undefined, storageKey).score)
      if (!reported.current.loot) {
        reported.current.loot = true
        progress.current?.({ schemaVersion: 1, gameId: 'afterdrop', milestone: 'loot-extracted' })
      }
    }
    if (next.phase === 'over' && previous.phase !== 'over') audio.current.over()
    if (previous.perfects < 8 && next.perfects >= 8 && !reported.current.streak) {
      reported.current.streak = true
      progress.current?.({ schemaVersion: 1, gameId: 'afterdrop', milestone: 'perfect-streak' })
    }
    if (next.phase === 'playing') audio.current.sync(next.beat, bpmAt(next.elapsed), intensityAt(next.elapsed))
    publish.current += delta
    if (publish.current >= 80 || next.phase !== previous.phase || next.judgement !== previous.judgement || next.lives !== previous.lives || next.lane !== previous.lane) {
      publish.current = 0
      setHud(next)
    }
  }

  const pause = () => {
    cancelHold()
    commands.current = { ...IDLE_INPUT }
    const next = pauseDrop(state.current)
    if (next === state.current) return
    audio.current.pause()
    state.current = next
    setHud(next)
  }
  const exit = () => { pause(); back.current() }
  const actions = useRef({ pause, exit })
  actions.current = { pause, exit }

  const play = () => {
    cancelHold()
    const fresh = state.current.phase !== 'paused'
    if (fresh) reported.current = { loot: false, streak: false }
    const next = fresh ? startDrop(state.current) : resumeDrop(state.current)
    state.current = next
    setHud(next)
    void audio.current.start(next.beat, bpmAt(next.elapsed))
    renderer.current?.wake(true)
    requestArcadeFullscreen()
    panel.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let alive = true
    let booted = false
    setError('')
    setReady(false)
    const timeout = window.setTimeout(() => { if (alive && !booted) setError('La cabina no se ha podido abrir. Prueba a cargarla otra vez.') }, 8000)
    try {
      renderer.current = createAfterDropRenderer(parent, () => state.current, delta => {
        if (!alive || document.hidden) return
        const previous = state.current
        if (previous.phase !== 'playing') return
        let input = commands.current
        commands.current = { ...IDLE_INPUT }
        let next = previous
        let remaining = Math.min(250, Math.max(0, delta))
        while (remaining > 0 && next.phase === 'playing') {
          const slice = Math.min(50, remaining)
          remaining -= slice
          const before = next
          next = stepDrop(next, input, slice, { whiff: remaining <= 0 })
          if (next.judgement && next.judgement !== before.judgement && next.judgement.grade !== 'FALLO') input = { ...input, collect: false }
          input = { lane: null, collect: input.collect, extract: false }
        }
        state.current = next
        react(previous, next, delta)
      }, () => { booted = true; window.clearTimeout(timeout); if (alive) setReady(true) })
    } catch {
      setError('La cabina no se ha podido abrir. Prueba a cargarla otra vez.')
    }
    return () => { alive = false; window.clearTimeout(timeout); renderer.current?.destroy(); renderer.current = null }
  }, [retry])

  useEffect(() => {
    const hidden = () => { if (document.hidden) actions.current.pause() }
    const blur = () => actions.current.pause()
    const turned = () => actions.current.pause()
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if ((event.target as HTMLElement | null)?.closest('input,textarea,select')) return
      if (event.key === 'Escape') {
        if (state.current.phase === 'playing') { event.preventDefault(); actions.current.pause() }
        return
      }
      if (state.current.phase !== 'playing') return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (key === 'ArrowLeft' || key === 'a') {
        event.preventDefault()
        commands.current.lane = Math.max(0, state.current.lane - 1) as Lane
      } else if (key === 'ArrowRight' || key === 'd') {
        event.preventDefault()
        commands.current.lane = Math.min(2, state.current.lane + 1) as Lane
      } else if ((key === 'ArrowDown' || key === ' ' || key === 'k') && !event.repeat) {
        event.preventDefault()
        commands.current.collect = true
      } else if ((key === 'e' || key === 'Enter') && !event.repeat) {
        event.preventDefault()
        beginHold()
      } else if (key === 'p' && !event.repeat) {
        event.preventDefault()
        actions.current.pause()
      }
    }
    const up = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (key === 'e' || key === 'Enter') finishHold()
    }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('blur', blur)
    window.addEventListener('orientationchange', turned)
    screen.orientation?.addEventListener('change', turned)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('blur', blur)
      window.removeEventListener('orientationchange', turned)
      screen.orientation?.removeEventListener('change', turned)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(holdFrame.current)
      audio.current.destroy()
    }
  }, [])

  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  const pressLane = (lane: Lane) => { commands.current.lane = lane; commands.current.collect = true }
  const playing = hud.phase === 'playing'
  const actionLabel = hud.phase === 'paused' ? 'REANUDAR' : hud.phase === 'ready' ? 'CAER AL DROP' : 'OTRA CAÍDA'
  const grade = hud.judgement && hud.elapsed - hud.judgement.at < 520 ? hud.judgement.grade : ''

  return <section ref={panel} className="ad-game" data-status={hud.phase} data-motion={reduced ? 'reduce' : 'full'} data-ready={ready ? 'yes' : 'no'} tabIndex={-1} aria-label="After Drop">
    <header className="ad-hud">
      <button type="button" onClick={pause} disabled={!playing}>PAUSA</button>
      <div className="ad-stats" aria-label="Marcador de After Drop">
        <span><small>BOTÍN</small><strong>{hud.carried}</strong></span>
        <span><small>COMBO</small><strong>{hud.combo}</strong></span>
        <span><small>×{hud.multiplier.toFixed(2)} · {Math.round(bpmAt(hud.elapsed))}</small><strong className="ad-lives" aria-label={`${hud.lives} vidas, ${clock(hud.elapsed)}`}>{Array.from({ length: MAX_LIVES }, (_, index) => <i key={index} data-on={index < hud.lives} />)}<b>{clock(hud.elapsed)}</b></strong></span>
      </div>
      <button type="button" aria-pressed={muted} onClick={() => { const next = !muted; setMuted(next); audio.current.mute(next) }}>{muted ? 'SONIDO' : 'SILENCIO'}</button>
    </header>
    <div className="ad-play"
      onPointerDown={event => { if (event.button !== 0) return; gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }}
      onPointerUp={event => {
        const start = gesture.current
        gesture.current = null
        if (!start || start.id !== event.pointerId || state.current.phase !== 'playing') return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.15) commands.current.lane = Math.min(2, Math.max(0, state.current.lane + (dx > 0 ? 1 : -1))) as Lane
        else if (Math.hypot(dx, dy) < 24) commands.current.collect = true
      }}
      onPointerCancel={() => { gesture.current = null }}
    >
      <div className="ad-stage" ref={host} />
      <p className="ad-grade" role="status" aria-live="polite" data-grade={grade}>{grade}</p>
    </div>
    <div className="ad-controls">
      {([[0, 'IZQ', 'Carril izquierdo'], [1, 'CENTRO', 'Carril central'], [2, 'DER', 'Carril derecho']] as const).map(([lane, label, name]) => <button key={lane} type="button" className="ad-lane" aria-label={name} aria-pressed={hud.lane === lane} disabled={!playing} onPointerDown={event => { event.preventDefault(); pressLane(lane) }}>{label}</button>)}
      <button type="button" className="ad-extract" style={{ '--hold': hold } as CSSProperties} disabled={!playing || payout <= 0} aria-label={payout > 0 ? `Extraer botín ${payout}. Mantén pulsado.` : 'Sin botín que extraer'} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); beginHold() }} onPointerUp={finishHold} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold} onContextMenu={event => event.preventDefault()}><i /><span>{payout > 0 ? `EXTRAER ${payout}` : 'SIN BOTÍN'}<small>MANTÉN</small></span></button>
    </div>
    {error && <p className="ad-error" role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>REINTENTAR</button></p>}
    {!playing && <ArcadeMenu title="AFTER DROP" eyebrow={hud.phase === 'over' ? 'PARTY OVER / EL DROP SE QUEDA EL BOTÍN' : 'DANZ / CABINA EN CAÍDA'} art="/arcade/afterdrop-cover.svg" accent="#d6ff3c" tabs={[{ id: 'play', label: 'PARTIDA' }, { id: 'help', label: 'CÓMO JUGAR' }]} page={menuPage} onPage={setMenuPage} onBack={exit} action={{ label: actionLabel, onClick: play }} footer="HASTA 8 MINUTOS · RÉCORD LOCAL · SIN DANZPOINTS">
      {menuPage === 'help' ? <div className="menu-help"><h2>TRES CARRILES, UN DROP</h2><p>Desliza o toca el carril. Flechas o A y D cambian de calle. El toque, la flecha abajo o K cogen el vinilo.</p><p><b>PERFECTO</b> es en el beat: más combo y más botín. <b>BIEN</b> suma. <b>FALLO</b> rompe el combo.</p><p>Esquiva haters, resacas y managers. Tres golpes y es <b>PARTY OVER</b>: el botín suelto se queda en el drop y el récord no se mueve.</p><p><b>EXTRAER LOOT</b> se mantiene un instante. Guarda botín por el multiplicador. Aguantar lo sube. A los 8 minutos el drop echa el cierre.</p><small>E extrae. Pausa si ocultas la app, pierdes el foco o giras el móvil. Récord solo en este navegador. Sin DANZPOINTS. Si pides reducir movimiento, la cabina no tiembla.</small></div> : <div className="menu-help"><h2>{hud.phase === 'over' ? 'PARTY OVER' : hud.phase === 'extracted' ? 'BOTÍN A SALVO' : 'CAE CON EL BEAT'}</h2><p>{hud.message}</p>{hud.phase === 'extracted' && <p>Has guardado <b>{hud.banked}</b> con multiplicador ×{hud.multiplier.toFixed(2)}.</p>}<p>Récord de este navegador: <b>{record}</b></p></div>}
    </ArcadeMenu>}
  </section>
}
