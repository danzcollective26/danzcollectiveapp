import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { GrooveAudio } from './GrooveAudio'
import { advanceGroove, cutGroove, discPosition, GROOVE_COLORS, GROOVE_DURATION, GROOVE_VINYLS, grooveMultiplier, grooveStage, initialGroove, keyCutGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, setGroovePlaying, type GrooveMode, type GroovePoint, type GrooveState } from './groove'
import { useGameScreen } from './useGameScreen'
import './groove.css'

function Vinyl({ layer, radius = 56 }: { layer: number; radius?: number }) {
  return <g transform={`scale(${radius / 56})`}>
    <circle cy="3" r="57" fill="#030303" stroke="#000" strokeWidth="2"/>
    <circle r="56" fill="url(#gn-disc)" stroke="#77776c" strokeWidth="1.5"/>
    {Array.from({ length: 12 }, (_, i) => <circle key={i} r={29 + i * 2.1} fill="none" stroke={i % 3 ? '#99999a' : '#dedaca'} strokeOpacity={i % 3 ? '.2' : '.32'} strokeWidth=".65"/>)}
    <path d="M-52-18A55 55 0 0 1 30-46L15-24A28 28 0 0 0-27-9Z" fill="url(#gn-reflection)"/>
    <path d="M52 18A55 55 0 0 1-30 46L-15 24A28 28 0 0 0 27 9Z" fill="#b7c9d2" opacity=".14"/>
    <circle r="26" fill={GROOVE_COLORS[layer]} stroke="#fff2c0" strokeOpacity=".7"/>
    <circle r="23" fill="url(#gn-label)"/><circle r="19" fill="none" stroke="#1b1814" strokeOpacity=".45" strokeWidth=".7"/>
    <path d="M-14-14A20 20 0 0 1 14-14M-14 14A20 20 0 0 0 14 14" fill="none" stroke="#211913" strokeWidth="1.5"/>
    <circle r="13" fill="#1a1718"/><image href="/brand/danz-flower.svg" x="-9" y="-9" width="18" height="18"/>
    <circle r="2.6" fill="#d5be91" stroke="#080808" strokeWidth="1"/>
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
        <span className="gn-score"><i className="gn-hud-vinyl" aria-hidden="true"/><span>PUNTUACIÓN<strong data-testid="groove-score">{String(game.score).padStart(5, '0')}</strong></span></span>
        <span>COMBO<strong className="gn-combo">×{grooveMultiplier(game.combo)} <small>{game.combo} SEGUIDOS</small></strong></span>
        <span>TIEMPO<strong>{String(Math.ceil((GROOVE_DURATION - game.elapsed) / 1000)).padStart(2, '0')}<small>s</small></strong></span>
      </div>
      <div className="gn-play-area">
        <svg ref={board} className="gn-board" viewBox="0 0 640 760" role="img" aria-label={`Cabina de Groove Ninja, ${game.hits} cortes, ${game.scratches} scratches, ${game.lives} vidas`} onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={() => pause()}>
          <defs>
            <radialGradient id="gn-disc" cx="32%" cy="22%" r="80%"><stop stopColor="#505258"/><stop offset=".3" stopColor="#1b1c21"/><stop offset=".66" stopColor="#303137"/><stop offset="1" stopColor="#050607"/></radialGradient>
            <linearGradient id="gn-reflection" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f7f0d7" stopOpacity=".6"/><stop offset=".48" stopColor="#e2f2ff" stopOpacity=".08"/><stop offset="1" stopColor="#b5c9d3" stopOpacity=".3"/></linearGradient>
            <linearGradient id="gn-label" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2b0" stopOpacity=".7"/><stop offset=".5" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#30200c" stopOpacity=".4"/></linearGradient>
            <linearGradient id="gn-floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#452615"/><stop offset=".47" stopColor="#73452b"/><stop offset="1" stopColor="#24150f"/></linearGradient>
            <radialGradient id="gn-light"><stop stopColor="#f4b650" stopOpacity=".18"/><stop offset="1" stopColor="#130a05" stopOpacity=".6"/></radialGradient>
            <linearGradient id="gn-metal" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#68655b"/><stop offset=".1" stopColor="#373932"/><stop offset=".18" stopColor="#181a18"/><stop offset="1" stopColor="#070b0a"/></linearGradient>
            <linearGradient id="gn-brass"><stop stopColor="#745022"/><stop offset=".3" stopColor="#f9d992"/><stop offset=".55" stopColor="#b07a30"/><stop offset=".8" stopColor="#efd29a"/><stop offset="1" stopColor="#6c461d"/></linearGradient>
            <linearGradient id="gn-slash"><stop stopColor="#a7faff" stopOpacity="0"/><stop offset=".5" stopColor="#fff"/><stop offset="1" stopColor="#87f3ff"/></linearGradient>
            <pattern id="gn-grain" width="160" height="145" patternUnits="userSpaceOnUse"><path d="M0 1H160M0 144H160" stroke="#140b06" strokeWidth="4"/><path d="M0 5H160" stroke="#e1b27f" strokeOpacity=".17"/>{[18, 34, 63, 89, 114, 132].map((y, i) => <path key={y} d={`M-20 ${y}Q35 ${y - 12 - i} 85 ${y + 3}T180 ${y - 4}`} fill="none" stroke={i % 2 ? '#e4b781' : '#1c0d08'} strokeWidth={i % 2 ? '.7' : '1.3'} opacity=".2"/>)}<ellipse cx="93" cy="65" rx="28" ry="4" fill="none" stroke="#1a0c07" strokeOpacity=".22"/><path d="M20 5v135M22 5v135" stroke="#1d100a" strokeOpacity=".14"/></pattern>
            <filter id="gn-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
            <clipPath id="gn-half-a"><rect x="-60" y="-60" width="120" height="60"/></clipPath>
            <clipPath id="gn-half-b"><rect x="-60" y="0" width="120" height="60"/></clipPath>
          </defs>
          <rect width="640" height="760" fill="url(#gn-floor)"/>
          <rect width="640" height="760" fill="url(#gn-grain)"/><rect width="640" height="760" fill="url(#gn-light)"/>
          <g opacity=".08" transform="translate(320 350)"><circle r="159" fill="none" stroke="#ffe0a2" strokeWidth="3"/><circle r="148" fill="none" stroke="#ffe0a2"/><image href="/brand/danz-flower.svg" x="-70" y="-70" width="140" height="140"/><text y="115" textAnchor="middle" fill="#ffe0a2" fontSize="15" fontWeight="900" letterSpacing="7">SOUND DOJO</text></g>
          <rect x="13" y="13" width="614" height="734" rx="8" fill="none" stroke="#c89d5c" strokeOpacity=".38"/>
          {[26, 614].flatMap(x => [27, 733].map(y => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><circle r="5" fill="url(#gn-brass)"/><path d="M-2 2 2-2" stroke="#553816" strokeWidth="1.5"/></g>))}
          <path d="M32 20H608V78H32Z" fill="#160d09" opacity=".75"/>
          <text x="48" y="48" fill="#f4d8a6" fontSize="15" fontWeight="800" letterSpacing="2">{STAGES[stage - 1]}</text>
          <text x="592" y="48" textAnchor="end" fill="#f9cc6b" fontSize="16" fontWeight="900">0{stage} / 03</text>
          <path d="M48 66H592" stroke="#624323" strokeWidth="3"/><path d={`M48 66H${48 + progress * 5.44}`} stroke="#edbe63" strokeWidth="3"/>
          <g transform="translate(0 665)" opacity=".95">
            <path d="M0 0Q320-40 640 0V95H0Z" fill="url(#gn-metal)" stroke="#b99b67" strokeWidth="2"/>
            {[112, 528].map(x => <g key={x} transform={`translate(${x} 43)`}><circle r="65" fill="#080b09" stroke="url(#gn-brass)" strokeWidth="4"/><circle r="55" fill="url(#gn-disc)" stroke="#737264" strokeDasharray="2 5" strokeWidth="3"/><circle r="38" fill="none" stroke="#4c4d46"/><circle r="19" fill="#c09b54"/><circle r="7" fill="#141711"/><path d="M35-40 50-26 36 16 22 20" fill="none" stroke="#bcbab0" strokeWidth="5" strokeLinejoin="round"/><circle cx="35" cy="-40" r="6" fill="#4d4d43" stroke="#e0c58d"/></g>)}
            <rect x="247" y="-5" width="146" height="71" rx="4" fill="#090d0c" stroke="#5b5d4d"/>
            {[268, 294, 320, 346, 372].map((x, i) => <g key={x}><path d={`M${x} 9v43`} stroke="#4f5546" strokeWidth="3"/><rect x={x - 7} y={20 + i % 3 * 8} width="14" height="6" rx="1" fill="url(#gn-brass)"/>{[0, 1, 2].map(n => <rect key={n} x={x - 2} y={n * 5 - 2} width="4" height="3" fill={n === 2 ? '#ef7a5e' : '#d9ff6b'}/>)}</g>)}
            <text x="320" y="83" textAnchor="middle" fill="#b6b2a1" fontSize="9" fontWeight="800" letterSpacing="4">DANZ SOUND SYSTEM</text>
          </g>
          {game.status === 'ready' && <g opacity=".45"><g transform="translate(155 325) rotate(-22)"><Vinyl layer={0} radius={74}/></g><g transform="translate(465 400) rotate(18)"><Vinyl layer={1} radius={85}/></g></g>}
          {game.discs.map(disc => {
            const p = discPosition(disc, game.elapsed)
            return <g key={disc.id} className={`gn-target gn-${disc.kind}`} data-disc-id={disc.id} data-layer={disc.layer} data-x={p.x.toFixed(1)} data-y={p.y.toFixed(1)} transform={`translate(${p.x} ${p.y})`}>
              {disc.kind === 'vinyl' ? <><ellipse cy="15" rx="61" ry="54" fill="#050303" opacity=".4"/><g transform={`rotate(${(game.elapsed - disc.born) * .035 + disc.spin * 40})`}><Vinyl layer={disc.layer}/></g><rect x="-35" y="62" width="70" height="24" rx="4" fill="#1a130e" stroke={GROOVE_COLORS[disc.layer]} strokeOpacity=".8"/><text y="79" textAnchor="middle" fill={GROOVE_COLORS[disc.layer]} fontSize="14" fontWeight="900">{GROOVE_VINYLS[disc.layer]}</text></>
                : <g className="gn-feedback-speaker"><path d="M-38-48-48-35V43L-35 52H36L47 40V-36L36-48Z" fill="url(#gn-metal)" stroke="#ff645f" strokeWidth="3"/><rect x="-34" y="-38" width="68" height="80" rx="7" fill="#270c0b" stroke="#952e25"/><circle cy="9" r="26" fill="#120b09" stroke="#c54630" strokeWidth="3"/><circle cy="9" r="18" fill="#4b1712"/><circle cy="9" r="10" fill="url(#gn-brass)"/><circle cy="-23" r="7" fill="#fb6c49"/><path d="M-54-27-62-11-53-3M54-27 62-11 53-3" fill="none" stroke="#ffb775" strokeWidth="3"/><path d="M-8-64 0-79 4-68 13-82" fill="none" stroke="#f7d55e" strokeWidth="3"/><text y="77" textAnchor="middle" fill="#ff9a78" stroke="#20110a" strokeWidth="4" paintOrder="stroke" fontSize="17" fontWeight="900">! ACOPLE</text></g>}
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
            const seconds = (game.elapsed - spark.born) / 1000
            const age = seconds / .75
            return <g key={spark.id} transform={`translate(${spark.x} ${spark.y})`} opacity={1 - age}>
              {spark.layer !== undefined && <g className="gn-cut-pieces" transform={`translate(${(spark.velocity?.x ?? 0) * seconds} ${(spark.velocity?.y ?? -90) * seconds + 370 * seconds * seconds}) rotate(${spark.angle ?? 0})`}>{[-1, 1].map(sign => <g key={sign} transform={`translate(0 ${sign * (5 + seconds * 175)}) rotate(${age * sign * 100})`}><g clipPath={`url(#gn-half-${sign < 0 ? 'a' : 'b'})`}><g transform={`rotate(${(spark.rotation ?? 0) - (spark.angle ?? 0)})`}><Vinyl layer={spark.layer!}/></g></g><path d={`M-52 0H52`} stroke="#f9dc9d" strokeOpacity=".7" strokeWidth="1.5"/></g>)}</g>}
              <g className="gn-fragments">{Array.from({ length: 12 }, (_, i) => {
                const angle = i * Math.PI / 6, distance = age * (85 + i % 3 * 36)
                const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance + age * age * 52
                return i % 4 === 0 ? <text key={i} className="gn-music-note" transform={`translate(${x} ${y}) rotate(${i * 25 + age * 75})`} fill={spark.color} stroke="#1b1008" strokeWidth="2" paintOrder="stroke" fontSize="24" fontWeight="900">{i % 8 ? '♫' : '♪'}</text>
                  : <path key={i} d={`M${x} ${y}l${Math.cos(angle) * 12} ${Math.sin(angle) * 12}`} stroke={i % 2 ? spark.color : '#ffe6a9'} strokeWidth={5 * (1 - age)} strokeLinecap="round"/>
              })}</g>
              <text y={-28 - age * 55} textAnchor="middle" fill={spark.color} stroke="#120e1b" strokeWidth="4" paintOrder="stroke" fontSize="31" fontWeight="900">{spark.label}</text>
            </g>
          })}
          {path && <g className="gn-trail" fill="none" strokeLinejoin="round" strokeLinecap="round"><polyline points={path} stroke="#72ecff" strokeWidth="25" opacity=".5" filter="url(#gn-glow)"/><polyline points={path} stroke="#a7faff" strokeWidth="14" opacity=".4"/><polyline points={path} stroke="url(#gn-slash)" strokeWidth="8"/><polyline points={path} stroke="#fff" strokeWidth="3"/></g>}
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
