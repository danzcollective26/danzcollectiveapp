import { useEffect, useRef, useState } from 'react'
import ArcadeMenu from '../ArcadeMenu'
import SelectionReel from '../SelectionReel'
import { requestArcadeFullscreen } from '../arcadeFullscreen'
import { HeistAudio } from './audio.ts'
import {
  EXTRACT_MS, FACTION_NAME, HEIST_MAPS, HEIST_MAP_IDS, LOOT_NAME, STAGE_LABEL,
  createHeist, heistClock, heistStage, pauseHeist, readHeistRecord, saveHeistRecord, startHeist, stepHeist,
  type HeistInput, type HeistState, type MapId,
} from './engine.ts'
import { drawHeist, heistCanvasSize } from './render.ts'
import './heist.css'

const REACH = 52
function stickVector(dx: number, dy: number) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return { x: 0, y: 0 }
  const length = Math.hypot(dx, dy)
  const magnitude = Math.min(1, length / REACH)
  if (magnitude <= 0.16) return { x: 0, y: 0 }
  const scale = (magnitude - 0.16) / (0.84 * length)
  return { x: dx * scale, y: dy * scale }
}

type Shot = 'ally' | 'betray' | 'bluff' | 'smoke'

export default function ManagerHeist({ onExit }: { onExit: () => void }) {
  const state = useRef<HeistState>(createHeist('studio', 1))
  const [hud, setHud] = useState(state.current)
  const [record, setRecord] = useState(readHeistRecord)
  const [sound, setSound] = useState(true)
  const [freshRecord, setFreshRecord] = useState(false)
  const [page, setPage] = useState('play')
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const stick = useRef({ x: 0, y: 0, active: false })
  const origin = useRef<{ id: number; x: number; y: number } | null>(null)
  const keys = useRef(new Set<string>())
  const shots = useRef(new Set<Shot>())
  const holdExtract = useRef(false)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const audio = useRef<HeistAudio | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useRef(false)
  const banked = useRef(false)
  const exitRef = useRef(onExit)
  exitRef.current = onExit

  function releaseStick() {
    stick.current = { x: 0, y: 0, active: false }
    origin.current = null
    setKnob({ x: 0, y: 0 })
  }
  function release() {
    releaseStick()
    keys.current.clear()
    holdExtract.current = false
  }
  function commit(next: HeistState) {
    state.current = next
    setHud(next)
  }
  function pause() {
    release()
    const next = pauseHeist(state.current)
    if (next !== state.current) commit(next)
    audio.current?.sync(state.current.elapsed, false, false)
  }
  function readInput(): HeistInput {
    let moveX = stick.current.x
    let moveY = stick.current.y
    if (!stick.current.active) {
      moveX = (keys.current.has('d') || keys.current.has('arrowright') ? 1 : 0) - (keys.current.has('a') || keys.current.has('arrowleft') ? 1 : 0)
      moveY = (keys.current.has('s') || keys.current.has('arrowdown') ? 1 : 0) - (keys.current.has('w') || keys.current.has('arrowup') ? 1 : 0)
    }
    const input: HeistInput = {
      moveX, moveY,
      holdExtract: holdExtract.current || keys.current.has('e'),
      ally: shots.current.has('ally'),
      betray: shots.current.has('betray'),
      bluff: shots.current.has('bluff'),
      smoke: shots.current.has('smoke'),
    }
    shots.current.clear()
    return input
  }
  function paint() {
    const surface = canvas.current
    const ctx = surface?.getContext('2d')
    if (!surface || !ctx) return
    const size = heistCanvasSize()
    if (surface.width !== size.width) { surface.width = size.width; surface.height = size.height }
    drawHeist(ctx, state.current, reduced.current)
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => { reduced.current = media.matches }
    apply()
    media.addEventListener('change', apply)
    let frame = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      const previous = state.current
      if (previous.phase === 'playing') {
        const dt = Math.min(50, Math.max(0, now - last))
        const next = stepHeist(previous, readInput(), dt)
        state.current = next
        if ((next.phase === 'extracted' || next.phase === 'over') && previous.phase === 'playing') setPage('play')
        if (next.phase === 'extracted' && !banked.current) {
          banked.current = true
          const before = readHeistRecord()
          const saved = saveHeistRecord(next.score?.total ?? 0)
          setRecord(saved)
          setFreshRecord((next.score?.total ?? 0) > before)
          audio.current?.sting('extract')
        } else if (next.phase === 'over' && previous.phase === 'playing') audio.current?.sting('over')
        else if (next.lives < previous.lives) audio.current?.sting('hit')
        acc += dt
        if (next.phase !== previous.phase || next.message !== previous.message || next.lives !== previous.lives || next.inventory.length !== previous.inventory.length || next.channel === 0 && previous.channel > 0 || acc > 120) {
          acc = 0
          setHud(next)
        }
        audio.current?.sync(next.elapsed, next.phase === 'playing', soundRef.current)
      }
      last = now
      if (state.current.phase === 'playing') paint()
    }
    frame = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', apply) }
  }, [])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const hidden = () => { if (document.hidden) pause() }
    const blur = () => pause()
    const turned = () => pause()
    const rotation = window.matchMedia('(orientation: landscape)')
    const down = (event: KeyboardEvent) => {
      if (state.current.phase !== 'playing') return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      if (event.key === 'Escape') { event.preventDefault(); release(); exitRef.current(); return }
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault()
        keys.current.add(key)
      }
      if (event.repeat) return
      if (key === 'q') shots.current.add('ally')
      if (key === 'r') shots.current.add('betray')
      if (key === 'f') shots.current.add('bluff')
      if (key === 'c') shots.current.add('smoke')
    }
    const up = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()
      keys.current.delete(key)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', hidden)
    rotation.addEventListener('change', turned)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', hidden)
      rotation.removeEventListener('change', turned)
      audio.current?.destroy()
      audio.current = null
    }
  }, [])

  function choose(map: MapId) {
    if (state.current.phase === 'playing') return
    banked.current = false
    setFreshRecord(false)
    commit(createHeist(map, Date.now() % 999983))
  }
  function restart() {
    banked.current = false
    setFreshRecord(false)
    release()
    commit(createHeist(state.current.map, Date.now() % 999983))
  }
  function play() {
    release()
    audio.current ??= new HeistAudio()
    if (soundRef.current) audio.current.arm()
    commit(startHeist(state.current))
    requestArcadeFullscreen()
  }
  function shot(kind: Shot) {
    shots.current.add(kind)
  }

  const playing = hud.phase === 'playing'
  const finished = hud.phase === 'extracted' || hud.phase === 'over'
  const hot = heistStage(hud.elapsed) >= 3
  const carried = hud.inventory.map(item => LOOT_NAME[item.kind]).join(' · ')
  const action = finished
    ? { label: 'OTRA NOCHE', onClick: restart }
    : { label: hud.phase === 'paused' ? 'REANUDAR' : 'ENTRAR AL AFTER', onClick: play }

  return <section className="heist-game" aria-label="MANAGER HEIST" data-phase={hud.phase} data-map={hud.map} data-lives={hud.lives} data-x={hud.player.x.toFixed(2)} data-y={hud.player.y.toFixed(2)} data-elapsed={Math.floor(hud.elapsed)}>
    {playing && <>
      <header className="heist-top">
        <button type="button" onClick={() => { release(); onExit() }} aria-label="Salir de MANAGER HEIST">← ARCADE</button>
        <div><strong>MANAGER <em>HEIST</em></strong><small>{hud.mapName}</small></div>
        <button type="button" onClick={pause}>PAUSAR</button>
      </header>
      <div className="heist-hud">
        <span>AGUANTE <b className="heist-pips" aria-label={`${hud.lives} de 3`}>{[0, 1, 2].map(pip => <i key={pip} data-on={pip < hud.lives} />)}</b></span>
        <strong className="heist-clock" data-hot={hot} aria-label={`Tiempo ${heistClock(hud.elapsed)}`}>{heistClock(hud.elapsed)}</strong>
        <span>{STAGE_LABEL[heistStage(hud.elapsed)]} <b>{String(hud.inventory.reduce((sum, item) => sum + item.value, 0)).padStart(4, '0')}</b></span>
      </div>
      <div className="heist-stage-wrap">
        <canvas ref={canvas} role="img" aria-label={`After ${hud.mapName}. Aguante ${hud.lives}. ${hud.message}`} />
        <div className="heist-loot" aria-hidden="true">{[0, 1, 2].map(slot => <i key={slot} data-full={slot < hud.inventory.length}>{hud.inventory[slot] ? LOOT_NAME[hud.inventory[slot].kind].slice(0, 3) : ''}</i>)}</div>
        {hud.channel > 0 && <div className="heist-channel" style={{ transform: `scaleX(${Math.min(1, hud.channel / EXTRACT_MS)})` }} />}
        <p className="heist-message" role="status">{hud.message}</p>
      </div>
      <div className="heist-controls">
        <div className="heist-stick" aria-label="Joystick de movimiento" onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          origin.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          stick.current.active = true
        }} onPointerMove={event => {
          if (origin.current?.id !== event.pointerId) return
          const vector = stickVector(event.clientX - origin.current.x, event.clientY - origin.current.y)
          stick.current = { ...vector, active: true }
          setKnob(vector)
        }} onPointerUp={event => { if (origin.current?.id === event.pointerId) releaseStick() }} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}>
          <b style={{ transform: `translate(${knob.x * REACH}px, ${knob.y * REACH}px)` }} />
        </div>
        <div className="heist-actions">
          <button type="button" className="heist-extract" onPointerDown={event => { event.preventDefault(); holdExtract.current = true; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerUp={() => { holdExtract.current = false }} onPointerCancel={() => { holdExtract.current = false }}>EXTRAER</button>
          <button type="button" onPointerDown={event => { event.preventDefault(); shot('ally') }} onClick={event => { if (event.detail === 0) shot('ally') }}>ALIAR</button>
          <button type="button" onPointerDown={event => { event.preventDefault(); shot('betray') }} onClick={event => { if (event.detail === 0) shot('betray') }}>TRAICIÓN</button>
          <button type="button" onPointerDown={event => { event.preventDefault(); shot('bluff') }} onClick={event => { if (event.detail === 0) shot('bluff') }}>BLUFF {hud.fakes ? '1' : '0'}</button>
          <button type="button" onPointerDown={event => { event.preventDefault(); shot('smoke') }} onClick={event => { if (event.detail === 0) shot('smoke') }}>HUMO {hud.smoke ? '1' : '0'}</button>
        </div>
      </div>
    </>}
    {!playing && <ArcadeMenu title="MANAGER HEIST" eyebrow={finished ? (hud.phase === 'over' ? 'PARTY OVER' : 'ESTÁS FUERA') : 'EXTRACCIÓN + BLUFF'} art="/arcade/manager-heist-cover.svg" accent="#d9fa69" tabs={[{ id: 'play', label: finished ? 'RESULTADO' : 'ENTRAR' }, { id: 'help', label: 'CÓMO SALIR' }]} page={page} onPage={setPage} onBack={() => { release(); onExit() }} backLabel="Volver a la biblioteca ARCADANZ" action={page === 'help' ? undefined : action} footer="6 MINUTOS · RÉCORD LOCAL · SIN DANZPOINTS">
      {page === 'help' && <div className="menu-help"><h2>ENTRA. MIENTE. SAL.</h2><p>Joystick o WASD. El botón vuelve a cero al soltarlo.</p><p><b>EXTRAER</b> se mantiene en una salida abierta. Un golpe lo corta. Puedes irte pronto con poco.</p><p><b>ALIAR</b> cerca de alguien: 45 segundos sin sangre y te marcan el botín. <b>TRAICIÓN</b> paga más y el after te ficha.</p><p><b>BLUFF</b> es un contrato falso. El técnico se lo cree, la crew sonríe y te suelta, el manager abre una puerta, el bouncer ni pestañea.</p><p><b>HUMO</b> te quita la cara unos segundos. Cuando la música baja, salen las resacas.</p><small>Q aliar · R traición · F bluff · C humo · E extraer. Pausa si cambias de app o giras el móvil. Récord solo en este navegador. Sin DANZPOINTS.</small></div>}
      {page === 'play' && <div className="heist-sheet">
        {finished && hud.phase === 'over' && <div className="menu-help"><h2>PARTY OVER</h2><p>{hud.message}</p><p>{carried ? `Llevabas ${carried}. Se queda en el after.` : 'No has salido. El marcador no se mueve.'}</p><p>Récord de este navegador: <b>{record}</b></p></div>}
        {finished && hud.phase === 'extracted' && hud.score && <div className="menu-help"><h2>{freshRecord ? 'RÉCORD NUEVO' : 'ESTÁS FUERA'}</h2><p>{hud.message} Salida: {hud.exitName}.</p><ul className="heist-score"><li>BOTÍN <b>{hud.score.loot}</b></li><li>TIEMPO <span><b>×{hud.score.timeFactor.toFixed(2)}</b><small>{Math.round(hud.score.timeLeft * 100)}% todavía en el reloj</small></span></li><li>PACTOS <span><b>×{hud.score.allianceFactor.toFixed(2)}</b><small>{hud.score.alliances} alianzas · {hud.score.betrayals} traiciones</small></span></li><li>TOTAL <b>{hud.score.total}</b></li></ul><p>Récord local: <b>{record}</b>. Sin DANZPOINTS.</p></div>}
        {!finished && <>
          <SelectionReel label="After de esta noche" choices={HEIST_MAP_IDS.map(id => ({ id, name: HEIST_MAPS[id].name, note: HEIST_MAPS[id].note, badge: HEIST_MAPS[id].factions.map(faction => FACTION_NAME[faction]).join(' · ') }))} value={hud.map} onChange={id => choose(id as MapId)} />
          <p>Récord de este navegador: <b>{record}</b>. Tres de aguante. Un bluff. El botín solo cuenta si EXTRAES.</p>
          <button type="button" aria-pressed={sound} onClick={() => setSound(value => !value)}>SONIDO <b>{sound ? 'ON' : 'OFF'}</b></button>
          {hud.phase === 'paused' && <p role="status">{hud.message}</p>}
        </>}
      </div>}
    </ArcadeMenu>}
  </section>
}
