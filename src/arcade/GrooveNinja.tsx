import GameSurface from './GameSurface'
import ClubRig from './ClubRig'
import GrooveDestruction from './GrooveDestruction'
import ArcadeLaunch from './ArcadeLaunch'
import SelectionReel from './SelectionReel'
import { useMusicAccess } from '../music/useMusicAccess'
import { memo, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { GrooveAudio } from './GrooveAudio'
import { advanceGroove, beginGrooveCut, cutGroove, discPosition, GROOVE_COLORS, GROOVE_DIRECTIONS, GROOVE_DURATION, GROOVE_VINYLS, GROOVE_WEAPONS, SCRATCH_PATTERNS, selectGrooveWeapon, grooveMultiplier, grooveStage, initialGroove, keyCutGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, scratchOffset, setGroovePlaying, type GrooveCutDirection, type GrooveDisc, type GrooveMode, type GrooveSpecial, type GrooveWeapon, type GroovePoint, type GrooveState } from './groove'
import { GrooveMusic, GROOVE_MUSIC_CHOICES, GROOVE_MUSIC_KEY, grooveSong, readGrooveMusic, type GrooveMusicStatus } from './grooveMusic'
import ArcadeIntro from './ArcadeIntro'
import { browserSession, readArcadeIntroSeen, shouldPlayArcadeIntro } from './arcadeIntros'
import { useGameScreen } from './useGameScreen'
import { CLUB_UNLOCK_CUTS, GROOVE_PREFERENCES_KEY, readGroovePreferences } from './groovePreferences'
import './groove.css'

const Vinyl = memo(function Vinyl({ layer, radius = 56, special = 'normal' }: { layer: number; radius?: number; special?: GrooveSpecial }) {
  return <g transform={`scale(${radius / 56})`}>
    <circle cy="3" r="57" fill="#030303" stroke="#000" strokeWidth="2"/>
    <circle r="56" fill={special === 'gold' ? 'url(#gn-brass)' : special === 'freeze' ? '#214556' : 'url(#gn-disc)'} stroke={special === 'gold' ? '#fff0a5' : special === 'freeze' ? '#adf7ff' : '#77776c'} strokeWidth={special === 'normal' ? 1.5 : 3}/>
    {special === 'gold' && <circle r="49" fill="none" stroke="#fff0b0" strokeWidth="2" strokeDasharray="3 7"/>}
    {special === 'freeze' && <path d="M0-49V49M-42-24 42 24M-42 24 42-24" stroke="#a6faff" strokeWidth="2" opacity=".8"/>}
    {special === 'combo' && <><circle r="51" fill="none" stroke="#ffe69a" strokeWidth="5" strokeDasharray="12 5"/><text y="-29" textAnchor="middle" fill="#fff0ad" fontSize="22" fontWeight="900">×2</text></>}
    {special === 'split' && <><path d="M-44-26 44 26M-44 26 44-26" stroke="#9af5d0" strokeWidth="5"/><circle r="51" fill="none" stroke="#9af5d0" strokeWidth="3"/></>}
    {Array.from({ length: 12 }, (_, i) => <circle key={i} r={29 + i * 2.1} fill="none" stroke={i % 3 ? '#99999a' : '#dedaca'} strokeOpacity={i % 3 ? '.2' : '.32'} strokeWidth=".65"/>)}
    <path d="M-52-18A55 55 0 0 1 30-46L15-24A28 28 0 0 0-27-9Z" fill="url(#gn-reflection)"/>
    <path d="M52 18A55 55 0 0 1-30 46L-15 24A28 28 0 0 0 27 9Z" fill="#b7c9d2" opacity=".14"/>
    <circle r="26" fill={special === 'gold' ? '#ffe18b' : special === 'freeze' ? '#95f0ff' : GROOVE_COLORS[layer]} stroke="#fff2c0" strokeOpacity=".7"/>
    <circle r="23" fill="url(#gn-label)"/><circle r="19" fill="none" stroke="#1b1814" strokeOpacity=".45" strokeWidth=".7"/>
    <path d="M-14-14A20 20 0 0 1 14-14M-14 14A20 20 0 0 0 14 14" fill="none" stroke="#211913" strokeWidth="1.5"/>
    <circle r="13" fill="#1a1718"/><image href="/brand/danz-flower.svg" x="-9" y="-9" width="18" height="18"/>
    <circle r="2.6" fill="#d5be91" stroke="#080808" strokeWidth="1"/>
  </g>
})
function DirectionCue({ disc, game }: { disc: GrooveDisc; game: GrooveState }) {
  if (disc.special !== 'arrow') return null
  const cue = disc.direction ? GROOVE_DIRECTIONS[disc.direction] : null
  const next = disc.sequence === game.cutSequence?.id && disc.step === game.cutSequence?.next
  return <g className="gn-direction-cue" data-next={next}>
    <title>{`Disco ${(disc.step ?? 0) + 1}: cortar hacia ${cue?.label ?? 'la flecha'}${next ? ', siguiente' : ''}`}</title>
    <circle r="60" fill="none" stroke={next ? '#e8ff93' : '#fff2cc'} strokeWidth={next ? 5 : 2} strokeDasharray={next ? undefined : '4 6'}/>
    <g transform={`rotate(${cue?.angle ?? (disc.axis === 'x' ? 0 : 90)})`}>
      <path d="M-35 0H35M16-18 35 0 16 18" fill="none" stroke="#151b18" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M-35 0H35M16-18 35 0 16 18" fill="none" stroke="#fff4d0" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round"/>
    </g>
    {disc.step !== undefined && <g transform="translate(-43 -43)"><circle r="19" fill={next ? '#e8ff93' : '#e9debf'} stroke="#15211b" strokeWidth="3"/><text y="7" textAnchor="middle" fill="#15211b" fontSize="23" fontWeight="900">{disc.step + 1}</text></g>}
  </g>
}
function ScratchDeck({ game }: { game: GrooveState }) {
  const scratch = game.scratch
  if (!scratch) return null
  const pattern = SCRATCH_PATTERNS[scratch.pattern], step = pattern.steps[scratch.turns]
  const target = scratch.firstAt + scratchOffset(game, step.offset)
  const phase = (game.elapsed % game.beatMs) / game.beatMs
  const movement = scratch.anchor === null ? 0 : Math.max(0, Math.min(1, (scratch.pointer - scratch.anchor) * step.direction / step.distance))
  const duration = scratchOffset(game, pattern.steps.at(-1)!.offset) + game.beatMs * 2
  const cursor = Math.max(0, Math.min(1, (game.elapsed - scratch.firstAt + game.beatMs) / duration))
  return <g className="gn-scratch" data-turns={scratch.turns} data-pattern={scratch.pattern} data-target={target} data-distance={step.distance} data-direction={step.direction} transform="translate(320 355)">
    <text y="-237" textAnchor="middle" fill="#f3d193" fontSize="19" fontWeight="900" letterSpacing="2">{pattern.name}</text>
    <text y="-185" textAnchor="middle" fill={Math.abs(game.elapsed - target) <= scratch.window ? '#d9ff6b' : '#fff3db'} fontSize="44" fontWeight="900">{step.direction > 0 ? '→' : '←'} {step.distance > 60 ? 'LARGO' : 'CORTO'}</text>
    <text y="-153" textAnchor="middle" fill="#cdbfa7" fontSize="17">{game.elapsed < target - scratch.window ? 'PREPARA · TERMINA EL GESTO EN EL PULSO' : '¡AHORA! SIGUE LA FLECHA'}</text>
    <circle r="127" fill="#ff789f" opacity=".07"/>
    <circle r="121" fill="none" stroke="#695445" strokeWidth="9"/>
    <circle r="121" fill="none" stroke="#efc97f" strokeWidth="9" strokeDasharray={`${(1 - phase) * 760} 760`} opacity={.5 + .5 * (1 - phase)} transform="rotate(-90)"/>
    <g transform={`rotate(${scratch.pointer * .65})`}><Vinyl layer={1} radius={101}/><path d="M0-96V-66" stroke="#fff4ce" strokeWidth="6" strokeLinecap="round"/></g>
    <text y="155" textAnchor="middle" fill={game.judgement === 'PERFECTO' ? '#d9ff6b' : '#ffe0a2'} fontSize="22" fontWeight="900">{game.judgement}</text>
    <path d="M-100 124H100" stroke="#493a32" strokeWidth="7"/><path d={`M-100 124H${-100 + movement * 200}`} stroke="#ffacd1" strokeWidth="7"/>
    {pattern.steps.map((note, i) => {
      const x = (i - (pattern.steps.length - 1) / 2) * 100
      return <g key={i} transform={`translate(${x} 193)`}><rect x="-41" y="-24" width="82" height="48" rx="8" fill={i < scratch.turns ? '#304626' : i === scratch.turns ? '#7e4f32' : '#201c18'} stroke={i === scratch.turns ? '#ffe0a2' : '#66533c'} strokeWidth="2"/><text y="4" textAnchor="middle" fill={i < scratch.turns ? '#d9ff6b' : '#fff2d2'} fontSize="26" fontWeight="900">{i < scratch.turns ? '✓' : note.direction > 0 ? '→' : '←'}</text><text y="37" textAnchor="middle" fill="#d5c5ad" fontSize="13">{note.distance > 60 ? 'LARGO' : 'CORTO'}</text></g>
    })}
    <path d="M-215 262H215" stroke="#6b5539" strokeWidth="5"/>
    {pattern.steps.map((note, i) => <g key={i} transform={`translate(${-215 + (scratchOffset(game, note.offset) + game.beatMs) / duration * 430} 262)`}><rect x={-scratch.window / duration * 430} y="-12" width={scratch.window * 2 / duration * 430} height="24" fill="#e8c06c" opacity=".2"/><circle r="7" fill={i < scratch.turns ? '#d9ff6b' : '#f6cb76'}/></g>)}
    <path d={`M${-215 + cursor * 430} 245v34`} stroke="#fff" strokeWidth="4"/>
    <text y="307" textAnchor="middle" fill="#cdbba2" fontSize="15">{scratch.turns}/{pattern.steps.length} GESTOS · {Math.round(60_000 / game.beatMs)} BPM · LEVANTAR RECOLOCA LA MANO</text>
  </g>
}
const STAGES = ['ABRE LA CABINA', 'SUBE LA MEZCLA', 'SUELTA EL DROP']
const CabinetDetails = memo(function CabinetDetails() {
  return <g className="gn-cabinet-details" pointerEvents="none">
    <path d="M25 88V645M615 88V645" stroke="#0b100f" strokeWidth="15"/>
    <path d="M25 88V645M615 88V645" stroke="#bc9b65" strokeWidth="2" opacity=".55"/>
    {[29, 611].map(x => <g key={x}>{Array.from({ length: 23 }, (_, i) => <path key={i} d={`M${x-4} ${130+i*20}h8`} stroke="#8d9279" strokeWidth="3" opacity={i%4 ? '.3' : '.6'}/>)}</g>)}
    <path d="M43 647H597L610 698H30Z" fill="url(#gn-metal)" stroke="#928363" strokeWidth="2"/>
    {[65, 115, 165, 475, 525, 575].map(x => <g key={x}><ellipse cx={x} cy="677" rx="15" ry="13" fill="#090e10" stroke="#665c4b" strokeWidth="2"/><path d={`M${x} 666v9`} stroke="#d4c59d" strokeWidth="2"/></g>)}
    <path d="M215 670H425M215 685H425" stroke="#0a1111" strokeWidth="5"/>
    <path d="M215 670H292M215 685H371" stroke="#88b9a3" strokeWidth="3"/>
    <text x="320" y="694" textAnchor="middle" fill="#a5a68e" fontSize="9" letterSpacing="4">DANZ / ANALOG SERIES</text>
  </g>
})

export default function GrooveNinja({ onBack, autoEnter = false }: { onBack: () => void; autoEnter?: boolean }) {
  const [musicId, setMusicId] = useState(readGrooveMusic)
  const [game, setGame] = useState(() => initialGroove(27, 'cut', 'katana', grooveSong(musicId)?.bpm))
  const song = grooveSong(musicId)
  const musicAccess = useMusicAccess(song?.id)
  const [musicStatus, setMusicStatus] = useState<GrooveMusicStatus>('idle')
  const musicElement = useRef<HTMLAudioElement>(null)
  const music = useRef<GrooveMusic | null>(null)
  const [destructionOpen,setDestructionOpen]=useState(false)
  const current = useRef(game)
  const [record, setRecord] = useState(() => readGrooveRecord('cut', musicId))
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('danz-groove-muted') === 'true' } catch { return false } })
  const [audioIssue, setAudioIssue] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [preferences, setPreferences] = useState(readGroovePreferences)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const options = useRef<HTMLDivElement>(null), optionsButton = useRef<HTMLButtonElement>(null)
  const sound = useRef<GrooveAudio | null>(null)
  const board = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ id: number; point: GroovePoint; scratch: number | null } | null>(null)
  const keyboardDirection = useRef<GrooveCutDirection>('right')
  const trail = useRef<(GroovePoint & { at: number })[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const screen = useGameScreen(pause)
  const [introOpen, setIntroOpen] = useState(() => {
    let reduced = false
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { reduced = false }
    return shouldPlayArcadeIntro('groove', readArcadeIntroSeen('groove', browserSession()), reduced)
  })
  const dismissIntro = () => { setIntroOpen(false); if (autoEnter) screen.enter() }
  useEffect(() => { if (autoEnter && !introOpen) screen.enter() }, [autoEnter, introOpen])
  const wasImmersive = useRef(false)
  useEffect(() => {
    if (autoEnter && wasImmersive.current && !screen.active && !destructionOpen) onBack()
    wasImmersive.current = screen.active
  }, [screen.active, destructionOpen])
  const ended = game.status === 'over' || game.status === 'complete'
  const running = game.status === 'playing'
  const stage = grooveStage(game.elapsed)
  const multicut = game.sparks.filter(spark => spark.label.startsWith('MULTICORTE')).at(-1)?.id
  useEffect(() => {
    if (!multicut || preferences.effects === 'lite' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const recoil = board.current?.animate([{transform:'translateX(0)'},{transform:'translateX(-2px)'},{transform:'translateX(2px)'},{transform:'translateX(0)'}],{duration:160,easing:'ease-out'})
    return () => recoil?.cancel()
  }, [multicut, preferences.effects])
  useEffect(() => { setPreferences(previous => game.hits > previous.bestCuts ? { ...previous, bestCuts: game.hits } : previous) }, [game.hits])
  useEffect(() => { try { localStorage.setItem(GROOVE_PREFERENCES_KEY, JSON.stringify(preferences)) } catch { /* Local cosmetics are optional. */ } }, [preferences])
  useEffect(() => { if (optionsOpen) options.current?.querySelector<HTMLButtonElement>('button')?.focus() }, [optionsOpen])
  const closeOptions = () => { setOptionsOpen(false); optionsButton.current?.focus() }

  function commit(next: GrooveState) {
    const previous = current.current
    if (next === previous) return
    current.current = next; setGame(next)
    if (next.hits > previous.hits) sound.current?.slice(next.sparks.at(-1)?.layer ?? 0)
    if (next.misses > previous.misses) sound.current?.stumble()
    if (next.status !== 'playing') { sound.current?.pause(); music.current?.pause() }
  }
  function pause() { gesture.current = null; trail.current = []; commit(setGroovePlaying(current.current, false)); sound.current?.pause(); music.current?.pause(); setMusicStatus('idle') }
  function chooseMusic(id: string) {
    if (id === musicId || (id !== 'practice' && !grooveSong(id))) return
    pause(); music.current?.destroy(); music.current = null; setMusicId(id as typeof musicId); setAudioIssue(false)
    const previous = current.current
    commit(initialGroove(Date.now(), previous.mode, previous.weapon, grooveSong(id)?.bpm))
    setRecord(readGrooveRecord(previous.mode, id))
    try { localStorage.setItem(GROOVE_MUSIC_KEY, id) } catch { /* Optional preference. */ }
  }
  function chooseMode(mode: GrooveMode) {
    if (mode === current.current.mode) return
    keyboardDirection.current = 'right'
    pause(); commit(initialGroove(Date.now(), mode, current.current.weapon, song?.bpm)); setRecord(readGrooveRecord(mode, musicId))
  }
  useEffect(() => {
    if (!song) return
    pause(); music.current?.destroy(); music.current = null
  }, [musicAccess.owner])
  function play() {
    if (current.current.status === 'playing') { pause(); return }
    const source = song ? musicAccess.freshSource() : null
    if (song && !source) { musicAccess.prepare(); return false }
    const previous = current.current
    const next = setGroovePlaying(previous.status === 'over' || previous.status === 'complete' ? initialGroove(Date.now(), previous.mode, previous.weapon, song?.bpm) : previous, true)
    commit(next); screen.enter()
    setAudioIssue(false)
    if (song && musicElement.current) {
      music.current ??= new GrooveMusic(musicElement.current, setMusicStatus, () => { pause(); setAudioIssue(true); setMusicStatus('error') })
      void music.current.start({ ...song, src: source! }, next.elapsed, muted)
    }
    if (!muted) {
      sound.current ??= new GrooveAudio()
      void sound.current.start(next.elapsed, false, !song).then(ok => { if (ok === false && current.current.status === 'playing' && !song) setAudioIssue(true) })
    }
  }
  function toggleSound() {
    const next = !muted; setMuted(next)
    try { localStorage.setItem('danz-groove-muted', String(next)) } catch { /* Optional preference. */ }
    music.current?.mute(next)
    if (next) sound.current?.mute(true)
    else if (current.current.status === 'playing') {
      sound.current ??= new GrooveAudio()
      void sound.current.start(current.current.elapsed, false, !song).then(ok => { if (ok !== null && !song) setAudioIssue(!ok) })
    }
  }
  // Mount-only: closing the intro must not tear down the session audio.
  useEffect(() => { if (!introOpen) heading.current?.focus({ preventScroll: true }); return () => { sound.current?.destroy(); sound.current = null; music.current?.destroy(); music.current = null } }, [])
  useEffect(() => {
    if (game.score > record) setRecord(saveGrooveRecord(game.score, game.mode, musicId))
  }, [game.score, game.mode, record, musicId])
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause() }
    const blur = () => pause()
    const orientation=window.matchMedia('(orientation: landscape)')
    document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', blur)
    orientation.addEventListener('change',blur)
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', blur);orientation.removeEventListener('change',blur) }
  }, [])
  useEffect(() => {
    if (!running) return
    let frame = 0, last = 0
    const tick = (now: number) => {
      if (last) {
        // Preserve active frame time so visual pulses stay with the audio clock.
        const clock = song ? music.current?.clock() : null
        let remaining = song ? (clock === null || clock === undefined ? 0 : Math.max(0, clock - current.current.elapsed)) : Math.min(1000, now - last)
        if (remaining > 1000) { pause(); return }
        let next = current.current
        while (remaining > 0 && next.status === 'playing') { const step = Math.min(100, remaining); next = advanceGroove(next, step); remaining -= step }
        commit(next)
      }
      last = now
      if (current.current.status === 'playing') frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, musicId])
  useEffect(() => {
    if (!running) return
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
      if (event.repeat) return
      const digit = /^Digit[1-4]$/.test(event.code) ? Number(event.code.slice(-1)) : /^[1-4]$/.test(event.key) ? Number(event.key) : 0
      if (digit) { event.preventDefault(); commit(keyCutGroove(current.current, digit - 1, event.shiftKey ? 'down' : keyboardDirection.current)) }
      if (current.current.mode === 'cut' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); keyboardDirection.current = event.key.slice(5).toLowerCase() as GrooveCutDirection
      }
      if (current.current.mode === 'cut' && ['q', 'w', 'e'].includes(event.key.toLowerCase())) { event.preventDefault(); commit(selectGrooveWeapon(current.current, (['katana', 'twin', 'needle'] as const)[['q', 'w', 'e'].indexOf(event.key.toLowerCase())])) }
      if (current.current.scratch && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        let next = current.current
        if (next.scratch?.anchor === null) next = scratchGroove(next, 320)
        const direction = event.key === 'ArrowRight' ? 1 : -1
        next = scratchGroove(next, (next.scratch?.anchor ?? 320) + direction * (next.scratch ? SCRATCH_PATTERNS[next.scratch.pattern].steps[next.scratch.turns].distance : 56))
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
    else if (current.current.mode === 'cut') commit(beginGrooveCut(current.current))
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
      } else if (!current.current.scratch) {
        // Keep the anchor until there is enough travel, including slow/coalesced input.
        if (Math.hypot(p.x - active.point.x, p.y - active.point.y) < 7) continue
        commit(cutGroove(current.current, active.point, p))
      }
      active.point = p
      trail.current = [...trail.current.slice(preferences.style === 'club' ? -23 : -11), { ...p, at: current.current.elapsed }]
    }
  }
  function release(event: ReactPointerEvent<SVGSVGElement>) {
    if (gesture.current?.id !== event.pointerId) return
    if (current.current.scratch) commit(scratchGroove(current.current, gesture.current.point.x, true))
    else if (current.current.strokeDoubleUntil) commit({ ...current.current, strokeDoubleUntil: 0 })
    gesture.current = null
  }
  const path = trail.current.filter(p => game.elapsed - p.at < (preferences.style === 'club' ? 230 : 130)).map(p => `${p.x},${p.y}`).join(' ')
  const progress = Math.round(game.elapsed / GROOVE_DURATION * 100)
  const musicNotice = song && musicAccess.status !== 'ready' ? <div className="gn-music-access" role="status">
    <p>{musicAccess.status === 'signin' ? 'Inicia sesión para escuchar los temas. Ensayo funciona sin cuenta.' : musicAccess.status === 'error' ? 'No se pudo preparar la música. Reintenta o juega con Ensayo.' : 'Preparando acceso a la música…'}</p>
    {musicAccess.status === 'signin' && <a href="/?seccion=cuenta">INICIAR SESIÓN</a>}
    {musicAccess.status === 'error' && <button type="button" onClick={musicAccess.prepare}>REINTENTAR MÚSICA</button>}
    <button type="button" onClick={() => chooseMusic('practice')}>USAR ENSAYO</button>
  </div> : null
  if(destructionOpen)return <GrooveDestruction onBack={()=>{screen.enter();setDestructionOpen(false)}}/>
  return <section className="content inner-page gn-page" aria-label="GROOVE NINJA">
    {introOpen && <ArcadeIntro gameId="groove" onDone={dismissIntro} />}
    <button type="button" className="back" onClick={onBack}>← VOLVER A ARCADANZ</button>
    <div className="gn-mode-picker" role="group" aria-label="Modo de Groove Ninja"><button type="button" aria-pressed={game.mode === 'cut'} onClick={() => chooseMode('cut')}><strong>VINYL CUT</strong><small>CORTES AL VUELO</small></button><button type="button" aria-pressed={game.mode === 'scratch'} onClick={() => chooseMode('scratch')}><strong>SCRATCH SESSION</strong><small>PATRONES AL RITMO</small></button><button type="button" className="gn-destruction-launch" onClick={()=>{pause();screen.leave();setDestructionOpen(true)}}><strong>DESTRUCCIÓN ✹</strong><small>8 ARMAS · VINILOS AL VUELO</small></button></div>
    <div className="gn-intro">
      <div className="eyebrow">ARCADANZ / GAME 003 · PRIMERA SESIÓN</div>
      <h1 ref={heading} tabIndex={-1}>GROOVE<br/><em>NINJA.</em></h1>
      <p>{game.mode === 'cut' ? <>Vinilos al vuelo. Cortes al beat.</> : <>Lee el patrón. Clava el gesto. Domina el pulso.</>}<br/>La cabina es tuya.</p>
      <figure className="gn-cover"><img src="/arcade/groove-ninja-approved-mobile.webp" alt="DJ con gafas negras y katana con la flor de DANZ" width="1086" height="1448" decoding="async"/><figcaption>CORTA. MEZCLA. REPITE.</figcaption></figure>
      <p className="gn-practice">PRÁCTICA · Récord separado para cada modo, en este navegador. Esta sesión no otorga DANZPOINTS.</p>
      <p className="gn-sound-note">Elige Funky Fiesta, WTHIMH o el ensayo sin conexión en AJUSTES. Cambiar de tema empieza otra sesión; cada tema y modo conserva su récord.</p>
    </div>
    <div ref={screen.panel} data-weapon={game.weapon} data-stage={stage} data-effects={preferences.effects} data-style={preferences.style} className={`gn-panel${screen.active ? ' gn-immersive' : ''}`} data-status={game.status} data-mode={game.mode} data-elapsed={game.elapsed.toFixed(1)}>
      <audio ref={musicElement} className="gn-music-audio" preload="none" controlsList="nodownload noremoteplayback" hidden />
      {screen.active && <ArcadeLaunch game="groove" mode={game.mode} running={running} onPlay={play} startDisabled={Boolean(song && musicAccess.status !== 'ready')} notice={musicNotice} onExit={()=>{screen.leave();onBack()}} onModeChange={chooseMode} onDestruction={()=>{pause();setDestructionOpen(true);screen.leave()}}><button type="button" className="outline-btn" onClick={toggleSound} aria-pressed={!muted}>{muted?'SONIDO OFF':'SONIDO ON'}</button><SelectionReel compact label="Música de Groove" choices={GROOVE_MUSIC_CHOICES} value={musicId} onChange={chooseMusic}/><p className="gn-music-note">Los temas necesitan sesión e Internet. Ensayo funciona sin conexión. Cambiar de tema inicia otra sesión.</p></ArcadeLaunch>}
      <div className="gn-top"><span>GROOVE NINJA <small>{game.mode === 'cut' ? 'VINYL CUT' : 'SCRATCH SESSION'}</small><small className="gn-track-name" aria-label="Música de la sesión" title={song?.artist} data-track={musicId}>{song?.title ?? 'ENSAYO'} · {Math.round(60_000 / game.beatMs)} BPM{muted ? ' · SILENCIO' : ''}</small></span>{screen.active && <button type="button" onClick={() => { screen.leave(); onBack() }} className="outline-btn">SALIR DEL JUEGO ↗</button>}</div>
      <div className="gn-hud" aria-label="Marcador de Groove Ninja">
        <span className="gn-score"><i className="gn-hud-vinyl" aria-hidden="true"/><span>PUNTUACIÓN<strong data-testid="groove-score">{String(game.score).padStart(5, '0')}</strong></span></span>
        <span>COMBO<strong className="gn-combo">×{grooveMultiplier(game.combo)} <small>{game.doubleUntil > game.elapsed ? `×2 LISTO · ${Math.ceil((game.doubleUntil-game.elapsed)/1000)}s` : game.strokeDoubleUntil > game.elapsed ? 'CORTE ×2' : `${game.combo} SEGUIDOS`}</small></strong></span>
        <span>TIEMPO<strong>{String(Math.ceil((GROOVE_DURATION - game.elapsed) / 1000)).padStart(2, '0')}<small>s</small></strong></span>
      </div>
      <div className="gn-challenge-bar">
        {game.mode === 'cut' ? <div className="gn-weapons" role="group" aria-label="Arma de corte">{(Object.keys(GROOVE_WEAPONS) as GrooveWeapon[]).map((key, i) => <button key={key} type="button" aria-pressed={game.weapon === key} onClick={() => { trail.current = []; commit(selectGrooveWeapon(current.current, key)) }}><span aria-hidden="true">{['╱', '〢', '✧'][i]}</span><span>{GROOVE_WEAPONS[key].name}<small>{GROOVE_WEAPONS[key].detail}</small></span></button>)}</div>
          : <div className="gn-scratch-instruction"><strong>LEE → MUEVE → CLAVA EL PULSO</strong><small>FLECHA = DIRECCIÓN · CORTO / LARGO = RECORRIDO</small></div>}
      </div>
      <GameSurface ratio={640/760} className="gn-play-slot" enabled={screen.active}><div className="gn-play-area">
        <svg ref={board} className="gn-board" viewBox="0 0 640 760" preserveAspectRatio="none" role="img" aria-label={`Cabina de Groove Ninja, ${game.hits} cortes, ${game.scratches} scratches, ${game.lives} vidas`} onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={() => pause()} onLostPointerCapture={release}>
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
          <ellipse cx="320" cy="355" rx="330" ry="280" fill={GROOVE_WEAPONS[game.weapon].color} opacity=".065"/>
          <CabinetDetails/><ClubRig id="gn-rig"/>
          <rect className="gn-stage-light" width="640" height="760" fill={stage === 1 ? '#c07431' : stage === 2 ? '#154d72' : '#692f65'} opacity=".14"/>
          {stage > 1 && <g className="gn-stage-beams" opacity={stage === 3 ? .2 : .12} fill={stage === 3 ? '#f38be7' : '#71caff'}><path d="M20 0 120 0 420 650 240 650Z"/><path d="M520 0 620 0 390 650 220 650Z"/></g>}
          {game.freezeUntil > game.elapsed && !game.cutSequence && <g className="gn-freeze-effect"><rect x="19" y="80" width="602" height="575" rx="6" fill="#94edff" opacity=".14" stroke="#9eeaff" strokeWidth="4"/><text x="320" y="111" textAnchor="middle" fill="#c6f8ff" fontSize="19" fontWeight="900">❄ CÁMARA LENTA · {Math.ceil((game.freezeUntil - game.elapsed) / 1000)}s</text></g>}
          {game.mode === 'cut' && !game.cutSequence && game.freezeUntil <= game.elapsed && <text x="320" y="108" textAnchor="middle" fill="#efcf91" fontSize="16" fontWeight="900">{game.golds >= 3 ? '✓ RETO DORADO COMPLETO +750' : `RETO: 3 DORADOS · ${game.golds}/3 · BONUS +750`}</text>}
          {game.cutSequence && <g className="gn-cut-sequence" data-next={game.cutSequence.next} data-length={game.cutSequence.directions.length}>
            <rect x="113" y="85" width="414" height="41" rx="7" fill="#12201d" stroke="#b9d67e"/>
            <text x="320" y="113" textAnchor="middle" fill="#e8ff93" fontSize="23" fontWeight="900">{`EN ORDEN ${game.cutSequence.next + 1}/${game.cutSequence.directions.length} · ${game.cutSequence.directions.map((d, i) => i < game.cutSequence!.next ? '✓' : GROOVE_DIRECTIONS[d].arrow).join('  ')}`}</text>
          </g>}
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
            const p = discPosition(disc, game.flightTime)
            return <g key={disc.id} className={`gn-target gn-${disc.kind}`} data-disc-id={disc.id} data-special={disc.special ?? 'normal'} data-axis={disc.axis} data-direction={disc.direction} data-sequence={disc.sequence} data-step={disc.step} data-layer={disc.layer} data-fragment={disc.fragment || undefined} data-x={p.x.toFixed(1)} data-y={p.y.toFixed(1)} transform={`translate(${p.x} ${p.y})`}>
              {disc.kind === 'vinyl' ? <g transform={`scale(${disc.size ?? 1})`}><ellipse cy="15" rx="61" ry="54" fill="#050303" opacity=".4"/><g transform={`rotate(${(game.flightTime - disc.born) * .035 + disc.spin * 40})`}><Vinyl layer={disc.layer} special={disc.special}/></g><rect x="-35" y="62" width="70" height="24" rx="4" fill="#1a130e" stroke={GROOVE_COLORS[disc.layer]} strokeOpacity=".8"/><text y="79" textAnchor="middle" fill={GROOVE_COLORS[disc.layer]} fontSize="14" fontWeight="900">{disc.special === 'gold' ? 'ORO ×3' : disc.special === 'freeze' ? 'HIELO' : disc.special === 'arrow' ? `${disc.step !== undefined ? `${disc.step + 1} · ` : ''}${disc.direction ? GROOVE_DIRECTIONS[disc.direction].arrow : disc.axis === 'x' ? '↔' : '↕'} CUT ${disc.layer + 1}` : disc.special === 'combo' ? 'COMBO ×2' : disc.special === 'split' ? 'SPLIT DISC' : disc.fragment ? 'MINI BONUS' : GROOVE_VINYLS[disc.layer]}</text><DirectionCue disc={disc} game={game}/></g>
                : <g className="gn-feedback-speaker"><path d="M-38-48-48-35V43L-35 52H36L47 40V-36L36-48Z" fill="url(#gn-metal)" stroke="#ff645f" strokeWidth="3"/><rect x="-34" y="-38" width="68" height="80" rx="7" fill="#270c0b" stroke="#952e25"/><circle cy="9" r="26" fill="#120b09" stroke="#c54630" strokeWidth="3"/><circle cy="9" r="18" fill="#4b1712"/><circle cy="9" r="10" fill="url(#gn-brass)"/><circle cy="-23" r="7" fill="#fb6c49"/><path d="M-54-27-62-11-53-3M54-27 62-11 53-3" fill="none" stroke="#ffb775" strokeWidth="3"/><path d="M-8-64 0-79 4-68 13-82" fill="none" stroke="#f7d55e" strokeWidth="3"/><text y="77" textAnchor="middle" fill="#ff9a78" stroke="#20110a" strokeWidth="4" paintOrder="stroke" fontSize="17" fontWeight="900">! ACOPLE</text></g>}
            </g>
          })}
          <ScratchDeck game={game}/>
          {game.sparks.map(spark => {
            const seconds = (game.elapsed - spark.born) / 1000
            const age = seconds / .75
            return <g key={spark.id} transform={`translate(${spark.x} ${spark.y})`} opacity={1 - age}>
              {spark.layer !== undefined && <g className="gn-cut-pieces" transform={`translate(${(spark.velocity?.x ?? 0) * seconds} ${(spark.velocity?.y ?? -90) * seconds + 370 * seconds * seconds}) rotate(${spark.angle ?? 0}) scale(${spark.size ?? 1})`}>{[-1, 1].map(sign => <g key={sign} transform={`translate(0 ${sign * (5 + seconds * 175)}) rotate(${age * sign * 100})`}><g clipPath={`url(#gn-half-${sign < 0 ? 'a' : 'b'})`}><g transform={`rotate(${(spark.rotation ?? 0) - (spark.angle ?? 0)})`}><Vinyl layer={spark.layer!} special={spark.special}/></g></g><path d={`M-52 0H52`} stroke="#f9dc9d" strokeOpacity=".7" strokeWidth="1.5"/></g>)}</g>}
              <g className="gn-fragments">{Array.from({ length: 12 }, (_, i) => {
                const angle = i * Math.PI / 6, distance = age * (85 + i % 3 * 36)
                const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance + age * age * 52
                return i % 4 === 0 ? <text key={i} className="gn-music-note" transform={`translate(${x} ${y}) rotate(${i * 25 + age * 75})`} fill={spark.color} stroke="#1b1008" strokeWidth="2" paintOrder="stroke" fontSize="24" fontWeight="900">{i % 8 ? '♫' : '♪'}</text>
                  : <path key={i} d={`M${x} ${y}l${Math.cos(angle) * 12} ${Math.sin(angle) * 12}`} stroke={i % 2 ? spark.color : '#ffe6a9'} strokeWidth={5 * (1 - age)} strokeLinecap="round"/>
              })}</g>
              <text y={-28 - age * 55} textAnchor="middle" fill={spark.color} stroke="#120e1b" strokeWidth="4" paintOrder="stroke" fontSize={spark.label.startsWith('MULTICORTE') ? 39 : 31} fontWeight="900">{spark.label}</text>
            </g>
          })}
          {path && <g className="gn-trail" fill="none" strokeLinejoin="round" strokeLinecap="round"><polyline points={path} stroke={GROOVE_WEAPONS[game.weapon].color} strokeWidth="25" opacity=".5" filter="url(#gn-glow)"/><polyline points={path} stroke={GROOVE_WEAPONS[game.weapon].color} strokeWidth={game.weapon === 'twin' ? 23 : game.weapon === 'needle' ? 5 : 14} opacity=".4"/><polyline points={path} stroke="url(#gn-slash)" strokeWidth={game.weapon === 'needle' ? 3 : 8}/>{game.weapon === 'twin' && <polyline points={path} transform="translate(9 0)" stroke="#ffc6e8" strokeWidth="4"/>}<polyline points={path} stroke="#fff" strokeWidth="3"/></g>}
          {path && game.mode === 'cut' && trail.current.at(-1) && <g className="gn-weapon-tip" transform={`translate(${trail.current.at(-1)!.x} ${trail.current.at(-1)!.y}) rotate(-38)`} pointerEvents="none">
            {game.weapon === 'needle' ? <><path d="M0-31 4-4 0 5-4-4Z" fill="#fff7cc" stroke="#d0a14c" strokeWidth="2"/><path d="M0 6V22" stroke="#d8a353" strokeWidth="5"/></> : <><path d="M0-44Q13-21 6 4H-3Z" fill="url(#gn-reflection)" stroke="#e8faff" strokeWidth="2"/><path d="M-11 5H14M2 9V29" stroke="#deb369" strokeWidth="5"/>{game.weapon === 'twin' && <path d="M17-38 23 3 16 3Z" fill="#ffe4f4" stroke="#fff" strokeWidth="2"/>}</>}
          </g>}
          <text x="32" y="734" fill="#ae9cb5" fontSize="13" letterSpacing="2">{game.mode === 'scratch' ? 'SIGUE EL PATRÓN EN CADA PULSO' : `${GROOVE_WEAPONS[game.weapon].name} · DESLIZA PARA CORTAR`}</text>
          <text x="608" y="734" textAnchor="end" fill="#ff789f" fontSize="17" fontWeight="900">{'♥'.repeat(game.lives)}{'♡'.repeat(5 - game.lives)}</text>
        </svg>
        {!running && <div className={`gn-overlay${ended ? ' gn-result' : ''}`}>
          {game.status === 'ready' && screen.active && <div className="gn-quick-modes" role="group" aria-label="Elegir modo antes de jugar"><button type="button" aria-pressed={game.mode === 'cut'} onClick={() => chooseMode('cut')}>VINYL CUT</button><button type="button" aria-pressed={game.mode === 'scratch'} onClick={() => chooseMode('scratch')}>SCRATCH SESSION</button></div>}
          <span className="gn-overlay-kicker">{ended ? 'TU SESIÓN' : game.status === 'paused' ? 'LA CABINA TE ESPERA' : `${game.mode === 'cut' ? 'VINYL CUT' : 'SCRATCH SESSION'} / 60 SEGUNDOS`}</span>
          <strong>{game.status === 'over' ? 'PARTY OVER' : game.status === 'complete' ? 'BUENA SESIÓN.' : game.status === 'paused' ? 'EN PAUSA.' : game.mode === 'cut' ? <>CORTA<br/>EL GROOVE.</> : <>DALE<br/>AL SCRATCH.</>}</strong>
          {ended ? <><span className="gn-final-score">{game.score.toLocaleString('es-ES')}</span><span className="gn-result-details">{game.mode === 'cut' ? `${game.hits} CORTES · ${game.multiCuts} MULTICORTES · ${game.sequences} SECUENCIAS · ${game.golds} DORADOS` : `${game.scratches} FRASES · ${game.perfects} GESTOS PERFECTOS`} · COMBO {game.bestCombo}</span></>
            : <p>{game.status === 'paused' ? 'Reanuda cuando quieras.' : game.mode === 'cut' ? 'Desliza sobre los vinilos al vuelo. Corta varios en una pasada y esquiva los acoples rojos.' : 'Sigue las flechas y el recorrido corto o largo. Termina cada gesto cuando el cursor llegue al pulso dorado. Puedes levantar el dedo para recolocarlo.'}</p>}
          {musicStatus === 'error' && <div className="gn-music-error" role="alert"><p>No se pudo reproducir el tema. Reintenta con REANUDAR o empieza otra sesión con ENSAYO.</p><button type="button" onClick={() => chooseMusic('practice')}>USAR ENSAYO</button></div>}
          {!optionsOpen && musicNotice}
        </div>}
      </div></GameSurface>
      <div className="gn-flow"><span>FLOW</span><div role="meter" aria-label="Racha de la sesión" aria-valuemin={0} aria-valuemax={20} aria-valuenow={Math.min(20, game.combo)}><i style={{ width: `${Math.min(100, game.combo * 5)}%` }}/></div><strong>×{grooveMultiplier(game.combo)}</strong></div>
      <p className="gn-message" role="status">{running && song && musicStatus === 'loading' ? `CARGANDO ${song.title.toUpperCase()} · LA SESIÓN ESPERA A LA MÚSICA` : game.message}</p>
      <div className="gn-actions"><button type="button" className="primary-btn" disabled={Boolean(song && !running && musicAccess.status !== 'ready')} onClick={play}>{running ? 'PAUSAR' : ended ? 'OTRA SESIÓN' : game.status === 'paused' ? 'REANUDAR' : 'JUGAR GROOVE NINJA'} <span>↗</span></button><button type="button" className="outline-btn" onClick={toggleSound} aria-pressed={!muted}>{muted ? 'SONIDO OFF' : 'SONIDO ON'}</button><button ref={optionsButton} type="button" className="outline-btn gn-options-button" onClick={() => { pause(); setOptionsOpen(true) }}>AJUSTES</button></div>
      {optionsOpen && <div ref={options} className="gn-options" role="dialog" aria-modal="true" aria-labelledby="gn-options-title" onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeOptions() }
        if (event.key === 'Tab') { const items = [...options.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]; const first = items[0], last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() } }
      }}><header><h2 id="gn-options-title">TU CABINA.</h2><button type="button" onClick={closeOptions} aria-label="Cerrar ajustes de Groove">CERRAR ×</button></header>
      <p>La sesión queda en pausa. Cambiar de tema empieza otra sesión; los ajustes visuales conservan la partida.</p>
      <h3>MÚSICA</h3><SelectionReel compact label="Música de Groove" choices={GROOVE_MUSIC_CHOICES} value={musicId} onChange={chooseMusic}/>
      {musicNotice}
      <h3>ESTILO DE CORTE</h3><div role="group" aria-label="Estilo de corte"><button type="button" aria-pressed={preferences.style === 'classic'} onClick={() => { trail.current = []; setPreferences(p => ({ ...p, style: 'classic' })) }}>CLÁSICO<small>Trazo corto y preciso</small></button><button type="button" disabled={preferences.bestCuts < CLUB_UNLOCK_CUTS} aria-pressed={preferences.style === 'club'} onClick={() => { trail.current = []; setPreferences(p => ({ ...p, style: 'club' })) }}>TRAZO CLUB<small>{preferences.bestCuts >= CLUB_UNLOCK_CUTS ? 'Estela larga · desbloqueado' : `${Math.min(preferences.bestCuts, CLUB_UNLOCK_CUTS)}/${CLUB_UNLOCK_CUTS} cortes en una sesión`}</small></button></div>
      <h3>EFECTOS VISUALES</h3><div role="group" aria-label="Efectos visuales"><button type="button" aria-pressed={preferences.effects === 'auto'} onClick={() => setPreferences(p => ({ ...p, effects: 'auto' }))}>AUTOMÁTICOS<small>Respeta reducir movimiento</small></button><button type="button" aria-pressed={preferences.effects === 'lite'} onClick={() => setPreferences(p => ({ ...p, effects: 'lite' }))}>SUAVES<small>Sin sacudidas ni luces animadas</small></button></div><p>Trazo Club se consigue al cortar 20 vinilos en una sesión. Se guarda en este navegador. No aumenta alcance, puntos, vidas ni duración.</p></div>}
      <div className="gn-bottom"><span>RÉCORD LOCAL {record.toLocaleString('es-ES')}</span><button type="button" onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp}>CÓMO JUGAR {showHelp ? '−' : '+'}</button></div>
      {audioIssue && <p className="gn-audio-issue" role="status">No se pudo activar el audio. Puedes seguir jugando sin sonido o volver a pulsar SONIDO.</p>}
    </div>
    {showHelp && <div className="gn-help"><h2>LA CABINA ES TUYA.</h2><p>VINYL CUT: elige Katana (100 puntos), Doble Filo (80, más alcance y más riesgo de acoples) o Aguja (125, exige precisión). Cambia de arma durante la partida. Los dorados valen el triple: corta tres para un bonus de 750. El hielo ralentiza el vuelo tres segundos. Los discos con flecha exigen el sentido exacto: arriba, abajo, izquierda o derecha, y valen el doble. Corta los vinilos numerados en orden para ganar un bonus de 300. Un gesto incorrecto permite reintentar; perder la secuencia cuesta una vida en total. Combo Disc prepara una pasada ×2 durante cuatro segundos; un gesto sin aciertos no lo consume. Split Disc se divide en dos minivinilos de bonus que también puedes cortar; dejarlos caer no resta vidas. Cortar varios de una pasada da bonus. Los acoples rojos y los discos perdidos cuestan una vida.</p><p>SCRATCH SESSION: completa Baby Scratch, Long Pull, Double Time y Boomerang. Cada flecha indica dirección y recorrido: corto o largo. Termina el gesto al cruzar el pulso dorado de la línea de tiempo. La indicación PERFECTO premia la precisión. La puntuación se concede al completar toda la frase. Puedes levantar el dedo para recolocarlo; no cuenta como gesto. Un pulso perdido cuesta una vida y aparece otra frase. Primero practicas dos patrones, luego entran los cuatro y se reduce el margen de tiempo.</p><p>Cada cinco aciertos seguidos sube el multiplicador, hasta ×4. Tienes cinco vidas y un minuto en cada modo, con récords separados por tema y modo.</p><p>En teclado: Q/W/E cambian de arma; elige el sentido con ↑/↓/←/→ y pulsa 1–4 para cortar el vinilo CUT de ese número (Mayús + 1–4 corta hacia abajo); ← y → ejecutan el gesto de scratch al pulso; espacio pausa; Esc sale de pantalla completa.</p><p>Funky Fiesta y WTHIMH usan su audio real y un pulso aproximado de 127 BPM: las oleadas y los patrones siguen el reloj de la canción. Si el audio carga, la sesión espera. Pausar conserva el punto del tema. El ensayo original funciona sin conexión a 120 BPM. Cambiar de tema empieza otra sesión. La música es continua y no depende de los aciertos. Tus resultados se guardan solo en este navegador y no suman DANZPOINTS.</p></div>}
  </section>
}
