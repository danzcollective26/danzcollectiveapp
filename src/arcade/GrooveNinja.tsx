import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { GrooveAudio } from './GrooveAudio'
import { advanceGroove, cutGroove, discPosition, GROOVE_COLORS, GROOVE_DURATION, GROOVE_VINYLS, grooveMultiplier, grooveStage, initialGroove, keyCutGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, setGroovePlaying, type GrooveMode, type GroovePoint, type GrooveState } from './groove'
import { useGameScreen } from './useGameScreen'
import './groove.css'

function Vinyl({ layer, radius = 56 }: { layer: number; radius?: number }) {
  return <g transform={`scale(${radius / 56})`}>
    <circle r="56" fill="url(#gn-disc)" stroke="#474752" strokeWidth="2"/>
    {[29, 35, 39, 43, 47, 51].map(radius => <circle key={radius} r={radius} fill="none" stroke="#72727c" strokeOpacity=".24" strokeWidth="1"/>)}
    <path d="M-46-12A48 48 0 0 1 13-46L8-27A28 28 0 0 0-27-7Z" fill="#fff" opacity=".12"/>
    <path d="M46 12A48 48 0 0 1-13 46L-8 27A28 28 0 0 0 27 7Z" fill="#fff" opacity=".07"/>
    <circle r="25" fill={GROOVE_COLORS[layer]}/><circle r="17" fill="#16151d"/>
    <image href="/brand/danz-flower.svg" x="-12" y="-12" width="24" height="24"/>
    <circle r="2.5" fill="#f3f0e8"/>
  </g>
}
const STAGES = ['ABRE LA CABINA', 'SUBE LA MEZCLA', 'SUELTA EL DROP']

export default function GrooveNinja({ onBack }: { onBack: () => void }) {
  const [game, setGame] = useState(initialGroove)
  const current = useRef(game)
  const [record, setRecord] = useState(readGrooveRecord)
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('danz-groove-muted') === 'true' } catch { return false } })
  const [audioIssue, setAudioIssue] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const sound = useRef<GrooveAudio | null>(null)
  const board = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ id: number; point: GroovePoint; scratch: number | null } | null>(null)
  const trail = useRef<(GroovePoint & { at: number })[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const screen = useGameScreen(pause)
  const ended = game.status === 'over' || game.status === 'complete'
  const running = game.status === 'playing'
  const stage = grooveStage(game.elapsed)

  function commit(next: GrooveState) {
    const previous = current.current
    if (next === previous) return
    current.current = next; setGame(next)
    if (next.hits > previous.hits) sound.current?.slice(next.sparks.at(-1)?.layer ?? 0)
    if (next.misses > previous.misses) sound.current?.stumble()
    if (next.status !== 'playing') sound.current?.pause()
  }
  function pause() { gesture.current = null; trail.current = []; commit(setGroovePlaying(current.current, false)); sound.current?.pause() }
  function chooseMode(mode: GrooveMode) {
    if (mode === current.current.mode) return
    screen.leave(); pause(); commit(initialGroove(Date.now(), mode)); setRecord(readGrooveRecord(mode))
  }
  function play() {
    if (current.current.status === 'playing') { pause(); return }
    const previous = current.current
    const next = setGroovePlaying(previous.status === 'over' || previous.status === 'complete' ? initialGroove(Date.now(), previous.mode) : previous, true)
    commit(next); screen.enter()
    if (!muted) {
      sound.current ??= new GrooveAudio()
      void sound.current.start(next.elapsed, false).then(ok => { if (ok === false && current.current.status === 'playing') setAudioIssue(true) })
    }
  }
  function toggleSound() {
    const next = !muted; setMuted(next)
    try { localStorage.setItem('danz-groove-muted', String(next)) } catch { /* Optional preference. */ }
    if (next) sound.current?.mute(true)
    else if (current.current.status === 'playing') {
      sound.current ??= new GrooveAudio()
      void sound.current.start(current.current.elapsed, false).then(ok => { if (ok !== null) setAudioIssue(!ok) })
    }
  }
  useEffect(() => { heading.current?.focus({ preventScroll: true }); return () => { sound.current?.destroy(); sound.current = null } }, [])
  useEffect(() => {
    if (game.score > record) setRecord(saveGrooveRecord(game.score, game.mode))
  }, [game.score, game.mode, record])
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause() }
    const blur = () => pause()
    document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', blur)
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', blur) }
  }, [])
  useEffect(() => {
    if (!running) return
    let frame = 0, last = 0
    const tick = (now: number) => {
      if (last) commit(advanceGroove(current.current, Math.min(50, now - last)))
      last = now
      if (current.current.status === 'playing') frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])
  useEffect(() => {
    if (!running) return
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
      if (event.repeat) return
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); commit(keyCutGroove(current.current, Number(event.key) - 1)) }
      if (current.current.scratch && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        let next = current.current
        if (next.scratch?.anchor === null) next = scratchGroove(next, 320)
        const direction = event.key === 'ArrowRight' ? 1 : -1
        next = scratchGroove(next, (next.scratch?.anchor ?? 320) + direction * 70)
        sound.current?.scratch(direction); commit(next)
      }
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); pause() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [running])
  function point(event: { clientX: number; clientY: number }): GroovePoint | null {
    const rect = board.current?.getBoundingClientRect()
    if (!rect?.width || !rect.height) return null
    return { x: (event.clientX - rect.left) * 640 / rect.width, y: (event.clientY - rect.top) * 760 / rect.height }
  }
  function start(event: ReactPointerEvent<SVGSVGElement>) {
    if (!event.isPrimary || current.current.status !== 'playing') return
    event.preventDefault(); const p = point(event); if (!p) return
    const scratch = current.current.scratch
    const grabbing = scratch && Math.hypot(p.x - 320, p.y - 355) < 128
    gesture.current = { id: event.pointerId, point: p, scratch: grabbing ? scratch.id : null }
    if (grabbing) commit(scratchGroove(current.current, p.x))
    trail.current = [{ ...p, at: current.current.elapsed }]
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: ReactPointerEvent<SVGSVGElement>) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId || current.current.status !== 'playing') return
    event.preventDefault()
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent]
    for (const sample of samples.length ? samples : [event.nativeEvent]) {
      const p = point(sample); if (!p) continue
      if (current.current.scratch && active.scratch === current.current.scratch.id) {
        const before = current.current.scratch.anchor
        const next = scratchGroove(current.current, p.x)
        if (next !== current.current && before !== null) sound.current?.scratch(Math.sign(p.x - before))
        commit(next)
      } else if (!current.current.scratch) commit(cutGroove(current.current, active.point, p))
      active.point = p
      trail.current = [...trail.current.slice(-11), { ...p, at: current.current.elapsed }]
    }
  }
  function release(event: ReactPointerEvent<SVGSVGElement>) {
    if (gesture.current?.id !== event.pointerId) return
    if (current.current.scratch) commit(scratchGroove(current.current, gesture.current.point.x, true))
    gesture.current = null
  }
  const path = trail.current.filter(p => game.elapsed - p.at < 130).map(p => `${p.x},${p.y}`).join(' ')
  const progress = Math.round(game.elapsed / GROOVE_DURATION * 100)
  return <section className="content inner-page gn-page" aria-label="GROOVE NINJA">
    <button type="button" className="back" onClick={onBack}>← VOLVER A ARCADANZ</button>
    <div className="gn-mode-picker" role="group" aria-label="Modo de Groove Ninja"><button type="button" aria-pressed={game.mode === 'cut'} onClick={() => chooseMode('cut')}><strong>VINYL CUT</strong><small>CORTES AL VUELO</small></button><button type="button" aria-pressed={game.mode === 'scratch'} onClick={() => chooseMode('scratch')}><strong>SCRATCH SESSION</strong><small>IDA Y VUELTA</small></button></div>
    <div className="gn-intro">
      <div className="eyebrow">ARCADANZ / GAME 003 · PRIMERA SESIÓN</div>
      <h1 ref={heading} tabIndex={-1}>GROOVE<br/><em>NINJA.</em></h1>
      <p>{game.mode === 'cut' ? <>Vinilos al vuelo. Cortes al beat.</> : <>Un plato, tus manos y una buena racha.</>}<br/>La cabina es tuya.</p>
      <figure className="gn-cover"><img src="/arcade/groove-ninja-cover-v1.webp" alt="DJ entre vinilos al vuelo y estelas de sonido" width="1200" height="800"/><figcaption>CORTA. MEZCLA. REPITE.</figcaption></figure>
      <p className="gn-practice">PRÁCTICA · Récord separado para cada modo, en este navegador. Esta sesión no otorga DANZPOINTS.</p>
      <p className="gn-sound-note">Música de ensayo. Los temas del colectivo llegarán después.</p>
    </div>
    <div ref={screen.panel} className={`gn-panel${screen.active ? ' gn-immersive' : ''}`} data-status={game.status}>
      <div className="gn-top"><span>GROOVE NINJA <small>{game.mode === 'cut' ? 'VINYL CUT' : 'SCRATCH SESSION'}</small></span>{screen.active && <button type="button" onClick={screen.leave} className="outline-btn">SALIR DEL JUEGO ↗</button>}</div>
      <div className="gn-hud" aria-label="Marcador de Groove Ninja">
        <span>PUNTUACIÓN<strong data-testid="groove-score">{String(game.score).padStart(5, '0')}</strong></span>
        <span>COMBO<strong className="gn-combo">×{grooveMultiplier(game.combo)} <small>{game.combo} SEGUIDOS</small></strong></span>
        <span>TIEMPO<strong>{String(Math.ceil((GROOVE_DURATION - game.elapsed) / 1000)).padStart(2, '0')}<small>s</small></strong></span>
      </div>
      <div className="gn-play-area">
        <svg ref={board} className="gn-board" viewBox="0 0 640 760" role="img" aria-label={`Cabina de Groove Ninja, ${game.hits} cortes, ${game.scratches} scratches, ${game.lives} vidas`} onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={() => pause()}>
          <defs>
            <radialGradient id="gn-disc" cx="35%" cy="25%"><stop stopColor="#414149"/><stop offset=".5" stopColor="#19191e"/><stop offset="1" stopColor="#08080b"/></radialGradient>
            <linearGradient id="gn-floor" x2="0" y2="1"><stop stopColor="#20152f"/><stop offset="1" stopColor="#0c0b11"/></linearGradient>
            <linearGradient id="gn-slash"><stop stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#f6f2ff"/><stop offset="1" stopColor="#ff789f"/></linearGradient>
            <filter id="gn-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
            <clipPath id="gn-half-a"><rect x="-60" y="-60" width="120" height="60"/></clipPath>
            <clipPath id="gn-half-b"><rect x="-60" y="0" width="120" height="60"/></clipPath>
          </defs>
          <rect width="640" height="760" fill="url(#gn-floor)"/>
          <g opacity=".1" stroke="#ba9efa">{Array.from({ length: 13 }, (_, i) => <path key={`v${i}`} d={`M${i * 80 - 160} 760L${240 + i * 14} 220`}/>)}{[340, 410, 500, 620, 750].map(y => <path key={y} d={`M0 ${y}H640`}/>)}</g>
          <path d="M0 0H640V150L0 320Z" fill="#ff789f" opacity=".035"/>
          <path d="M640 0H590L0 500V400Z" fill="#d9ff6b" opacity=".035"/>
          <text x="32" y="48" fill="#d3c5dd" fontSize="15" letterSpacing="3">{STAGES[stage - 1]}</text>
          <text x="608" y="48" textAnchor="end" fill="#d9ff6b" fontSize="16">0{stage} / 03</text>
          <path d="M32 66H608" stroke="#44354d" strokeWidth="3"/><path d={`M32 66H${32 + progress * 5.76}`} stroke="#ff789f" strokeWidth="3"/>
          <g transform="translate(0 665)" opacity=".8">
            <path d="M0 0Q320-50 640 0V95H0Z" fill="#17131e" stroke="#49384f"/>
            {[112, 528].map(x => <g key={x} transform={`translate(${x} 44)`}><circle r="68" fill="#08080d" stroke="#54475c"/><circle r="49" fill="none" stroke="#302438"/><circle r="20" fill="#282030" stroke="#7c5a7f"/><circle r="5" fill="#ff789f"/></g>)}
            {[268, 294, 320, 346, 372].map((x, i) => <g key={x}><path d={`M${x} 0v54`} stroke="#4b3f53" strokeWidth="3"/><path d={`M${x - 6} ${16 + i % 3 * 8}h12`} stroke={GROOVE_COLORS[i % 4]} strokeWidth="5"/></g>)}
            <text x="320" y="80" textAnchor="middle" fill="#86788e" fontSize="10" letterSpacing="5">DANZ SOUND SYSTEM</text>
          </g>
          {game.status === 'ready' && <g opacity=".45"><g transform="translate(155 325) rotate(-22)"><Vinyl layer={0} radius={74}/></g><g transform="translate(465 400) rotate(18)"><Vinyl layer={1} radius={85}/></g></g>}
          {game.discs.map(disc => {
            const p = discPosition(disc, game.elapsed)
            return <g key={disc.id} className={`gn-target gn-${disc.kind}`} data-disc-id={disc.id} data-layer={disc.layer} data-x={p.x.toFixed(1)} data-y={p.y.toFixed(1)} transform={`translate(${p.x} ${p.y})`}>
              {disc.kind === 'vinyl' ? <><ellipse cy="12" rx="63" ry="58" fill={GROOVE_COLORS[disc.layer]} opacity=".12"/><g transform={`rotate(${(game.elapsed - disc.born) * .035 + disc.spin * 40})`}><Vinyl layer={disc.layer}/></g><rect x="-43" y="62" width="86" height="27" rx="13" fill={GROOVE_COLORS[disc.layer]}/><text y="81" textAnchor="middle" fill="#151219" fontSize="16" fontWeight="900">{GROOVE_VINYLS[disc.layer]}</text></>
                : <><path d="M0-55 54-18 35 47-35 47-54-18Z" fill="#6c1827" stroke="#ff645f" strokeWidth="4"/><circle r="25" fill="#23121d" stroke="#ff789f"/><text y="11" textAnchor="middle" fill="#fff1e4" fontSize="37" fontWeight="900">!</text><text y="76" textAnchor="middle" fill="#ff8e89" fontSize="17" fontWeight="900">ACOPLE</text></>}
            </g>
          })}
          {game.scratch && <g className="gn-scratch" data-turns={game.scratch.turns} transform="translate(320 355)">
            <circle r="127" fill="#ff789f" opacity=".08"/><circle r="113" fill="none" stroke="#ff789f" strokeWidth="2" strokeDasharray="8 10"/>
            <g transform={`rotate(${(game.scratch.anchor ?? 320) * .4})`}><Vinyl layer={1} radius={94}/></g>
            <text y="-152" textAnchor="middle" fill="#ffb0c8" fontSize="24" fontWeight="900" letterSpacing="3">SCRATCH ↔</text>
            <text y="157" textAnchor="middle" fill="#f3f0e8" fontSize="21" fontWeight="800">IDA Y VUELTA · {game.scratch.turns}/3</text>
            <text y="188" textAnchor="middle" fill="#ac9db7" fontSize="17">SUJETA EL VINILO SIN SOLTAR</text>
            <path d="M-100 215H100" stroke="#49374b" strokeWidth="6"/><path d={`M-100 215H${-100 + Math.max(0, Math.min(1, (game.scratch.until - game.elapsed) / [3800, 3200, 2600][stage - 1])) * 200}`} stroke="#ff789f" strokeWidth="6"/>
          </g>}
          {game.sparks.map(spark => {
            const age = (game.elapsed - spark.born) / 750
            return <g key={spark.id} transform={`translate(${spark.x} ${spark.y})`} opacity={1 - age}>
              {spark.layer !== undefined && <g className="gn-cut-pieces" transform={`rotate(${spark.angle ?? 0})`}>{[-1, 1].map(sign => <g key={sign} transform={`translate(${age * sign * 65} ${age * sign * 82 + age * age * 85}) rotate(${age * sign * 48})`} clipPath={`url(#gn-half-${sign < 0 ? 'a' : 'b'})`}><Vinyl layer={spark.layer!}/></g>)}</g>}
              <g className="gn-fragments">{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${Math.cos(i * Math.PI / 4) * age * 115} ${Math.sin(i * Math.PI / 4) * age * 115}l${Math.cos(i * Math.PI / 4) * 11} ${Math.sin(i * Math.PI / 4) * 11}`} stroke={spark.color} strokeWidth={4 * (1 - age)} strokeLinecap="round"/>)}</g>
              <text y={-28 - age * 55} textAnchor="middle" fill={spark.color} stroke="#120e1b" strokeWidth="4" paintOrder="stroke" fontSize="31" fontWeight="900">{spark.label}</text>
            </g>
          })}
          {path && <g className="gn-trail" fill="none" strokeLinejoin="round" strokeLinecap="round"><polyline points={path} stroke="#ff789f" strokeWidth="22" opacity=".4" filter="url(#gn-glow)"/><polyline points={path} stroke="url(#gn-slash)" strokeWidth="9"/><polyline points={path} stroke="#fff" strokeWidth="3"/></g>}
          <text x="32" y="734" fill="#ae9cb5" fontSize="13" letterSpacing="2">{game.mode === 'scratch' ? 'CAMBIA DE DIRECCIÓN 3 VECES' : 'DESLIZA PARA CORTAR'}</text>
          <text x="608" y="734" textAnchor="end" fill="#ff789f" fontSize="17" fontWeight="900">{'♥'.repeat(game.lives)}{'♡'.repeat(5 - game.lives)}</text>
        </svg>
        {!running && <div className={`gn-overlay${ended ? ' gn-result' : ''}`}>
          <span className="gn-overlay-kicker">{ended ? 'TU SESIÓN' : game.status === 'paused' ? 'LA CABINA TE ESPERA' : `${game.mode === 'cut' ? 'VINYL CUT' : 'SCRATCH SESSION'} / 60 SEGUNDOS`}</span>
          <strong>{game.status === 'over' ? 'PARTY OVER' : game.status === 'complete' ? 'BUENA SESIÓN.' : game.status === 'paused' ? 'EN PAUSA.' : game.mode === 'cut' ? <>CORTA<br/>EL GROOVE.</> : <>DALE<br/>AL SCRATCH.</>}</strong>
          {ended ? <><span className="gn-final-score">{game.score.toLocaleString('es-ES')}</span><span className="gn-result-details">{game.hits} CORTES · {game.scratches} SCRATCH · COMBO {game.bestCombo}</span></>
            : <p>{game.status === 'paused' ? 'Reanuda cuando quieras.' : game.mode === 'cut' ? 'Desliza sobre los vinilos al vuelo. Corta varios en una pasada y esquiva los acoples rojos.' : 'Sujeta el plato y cambia de dirección tres veces sin soltar. Encadena scratches antes de que se agote el tiempo.'}</p>}
        </div>}
      </div>
      <div className="gn-flow"><span>FLOW</span><div role="meter" aria-label="Racha de la sesión" aria-valuemin={0} aria-valuemax={20} aria-valuenow={Math.min(20, game.combo)}><i style={{ width: `${Math.min(100, game.combo * 5)}%` }}/></div><strong>×{grooveMultiplier(game.combo)}</strong></div>
      <p className="gn-message" role="status">{game.message}</p>
      <div className="gn-actions"><button type="button" className="primary-btn" onClick={play}>{running ? 'PAUSAR' : ended ? 'OTRA SESIÓN' : game.status === 'paused' ? 'REANUDAR' : 'JUGAR GROOVE NINJA'} <span>↗</span></button><button type="button" className="outline-btn" onClick={toggleSound} aria-pressed={!muted}>{muted ? 'SONIDO OFF' : 'SONIDO ON'}</button></div>
      <div className="gn-bottom"><span>RÉCORD LOCAL {record.toLocaleString('es-ES')}</span><button type="button" onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp}>CÓMO JUGAR {showHelp ? '−' : '+'}</button></div>
      {audioIssue && <p className="gn-audio-issue" role="status">No se pudo activar el audio. Puedes seguir jugando sin sonido o volver a pulsar SONIDO.</p>}
    </div>
    {showHelp && <div className="gn-help"><h2>LA CABINA ES TUYA.</h2><p>VINYL CUT: corta los discos al vuelo deslizando el dedo o el ratón. Puedes cortar varios en una pasada. Si uno se escapa o cortas un acople rojo, pierdes una vida y tu racha.</p><p>SCRATCH SESSION: sujeta el disco grande y cambia de dirección tres veces sin soltar. Encadena platos: el tiempo para cada scratch se reduce a medida que avanza la sesión.</p><p>Cada cinco aciertos seguidos sube el multiplicador, hasta ×4. Tienes cinco vidas y un minuto en cada modo, con récords separados.</p><p>En teclado: 1–4 cortan vinilos del número marcado; ← y → alternan el scratch; espacio pausa; Esc sale de pantalla completa.</p><p>La música de ensayo acompaña la partida y no depende de los aciertos. Tus resultados se guardan solo en este navegador y no suman DANZPOINTS. Los temas del colectivo se incorporarán cuando estén disponibles.</p></div>}
  </section>
}
