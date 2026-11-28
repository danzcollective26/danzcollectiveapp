import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { NIGHTS } from './data/nights.ts'
import { TRAITS } from './data/traits.ts'
import { VISUAL_CUES } from './data/cues.ts'
import { DIALOGUES } from './data/dialogues.ts'
import { ARCHETYPES } from './data/archetypes.ts'
import { MODE_NAME, PARTY_OVER_LABEL, PAUSE_LABEL } from './copy.ts'
import { createInitialNightState, reduceNight } from './logic/night.ts'
import { applyNightResult } from './logic/end.ts'
import { createProgression, loadProgression, saveProgression } from './logic/progression.ts'
import type { NightAction, NightState, Person, ProgressionState } from './types.ts'
import { prefersReducedMotion } from '../../../feel/motion.ts'
import { pulse } from '../../../feel/haptics.ts'
import './nomenoconeso.css'

const NIGHT = NIGHTS[0]
const TICKET_NAMES = { noche: 'Entrada de noche', lista: 'Lista', invitacion: 'Invitación', ninguno: 'Sin entrada' } as const
const END_TEXT = {
  'vibe-cero': 'El rollo se ha ido a cero. La pista se vacía.',
  'aforo-reventado': 'Aforo reventado. Cierra la puerta antes de que llegue la policía del cartel.',
  'objetivos-cumplidos': 'Noche superada. La pista estuvo llena y en paz.',
  'objetivos-fallidos': 'Se acabó la noche sin llegar a los objetivos.',
  abandonada: 'Has dejado la puerta. Esta noche no cuenta.',
} as const

function storage(): Storage | null { try { return localStorage } catch { return null } }
function readProgress(): ProgressionState {
  const store = storage()
  if (!store) return createProgression()
  return loadProgression(store).state
}

const ARCHETYPE_COLOR: Record<string, string> = { normal: '#8dd8c8', crew: '#efc267', escondite: '#ba9efa', vvip: '#f3f0e8', influencer: '#ff789f', hater: '#ff5d5d', cameo: '#d9ff6b' }
const initials = (name: string) => name.split(/\s+/).filter(word => word.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(word)).slice(0, 2).map(word => word[0]!.toUpperCase()).join('') || name.slice(0, 2).toUpperCase()

function personLine(person: Person): string {
  const id = person.dialogueIds.find(item => DIALOGUES.find(line => line.id === item)?.speaker !== 'puerta')
  return DIALOGUES.find(line => line.id === id)?.text ?? ''
}

function reducer(state: NightState, action: NightAction | { type: 'reiniciar' }): NightState {
  if (action.type === 'reiniciar') return createInitialNightState(NIGHT, state.reducedMotion)
  return reduceNight(state, action)
}

/** NomeNoConEso MVP: night 1 at the door of the after (docs/NOMENOCONESO_PLAN.md §9). */
export default function NomeNoConEso({ onBack }: { onBack: () => void }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialNightState(NIGHT, prefersReducedMotion()))
  const [progress, setProgress] = useState(readProgress)
  const saved = useRef<NightState['result']>(null)
  const card = useRef<HTMLDivElement>(null)
  const active = state.phase === 'puerta'

  // Clock: one rAF loop only while the door is open; stops on pause and close.
  useEffect(() => {
    if (!active) return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => { dispatch({ type: 'tick', dtMs: Math.min(250, now - last) }); last = now; frame = requestAnimationFrame(loop) }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active])

  // Pause on hidden tab, lost focus and rotation (plan §8).
  useEffect(() => {
    const hidden = () => { if (document.hidden) dispatch({ type: 'pausar', reason: 'pestana' }) }
    const blur = () => dispatch({ type: 'pausar', reason: 'foco' })
    const rotate = () => dispatch({ type: 'pausar', reason: 'giro' })
    const orientation = screen.orientation
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('blur', blur)
    orientation?.addEventListener?.('change', rotate)
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', blur); orientation?.removeEventListener?.('change', rotate) }
  }, [])

  // Save the result once per night.
  useEffect(() => {
    if (!state.result || saved.current === state.result) return
    saved.current = state.result
    setProgress(previous => {
      const next = applyNightResult(previous, state.result!)
      const store = storage()
      if (store) saveProgression(store, next)
      return next
    })
  }, [state.result])

  // Feedback for each decision: short pulse; a wrong call shakes the card unless motion is reduced.
  const decisions = useRef(0)
  useEffect(() => {
    if (!state.lastDecision) return
    decisions.current += 1
    pulse(state.lastDecision.correct ? 'tap' : 'confirm')
    if (!state.lastDecision.correct && !state.reducedMotion) {
      card.current?.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' })
    }
  }, [state.lastDecision, state.reducedMotion])

  const decide = useCallback((choice: 'pasa' | 'fuera') => dispatch({ type: 'decidir', choice }), [])
  useEffect(() => {
    if (!active) return
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'p') { event.preventDefault(); decide('pasa') }
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'f') { event.preventDefault(); decide('fuera') }
      if (event.key === 'Escape') dispatch({ type: 'pausar', reason: 'boton' })
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [active, decide])

  const m = state.metrics
  const remaining = Math.max(0, Math.ceil((NIGHT.durationMs - state.elapsedMs) / 1000))
  const best = progress.bestScoreByNight[NIGHT.id]
  const person = state.current

  return (
    <section className="nnc" aria-label={`${MODE_NAME}, la puerta del after`}>
      <header className="nnc-top">
        <button type="button" className="nnc-back" onClick={() => { if (state.phase === 'puerta' || state.phase === 'pausa') dispatch({ type: 'salir' }); onBack() }} aria-label="Volver a los modos de DANZ Collecta">←</button>
        <div><p className="nnc-kicker">DANZ COLLECTA · LA PUERTA</p><h1>NOMENOCONESO</h1></div>
        {active && <button type="button" className="nnc-pause" onClick={() => dispatch({ type: 'pausar', reason: 'boton' })}>PAUSA</button>}
      </header>

      {state.phase !== 'lista' && <div className="nnc-hud" role="group" aria-label="Estado de la puerta">
        <span><small>TIEMPO</small><b>{remaining}s</b></span>
        <span><small>ROLLO</small><b>{m.vibe}</b><i className="nnc-meter" style={{ ['--v' as string]: `${m.vibe}%` }} /></span>
        <span><small>AFORO</small><b>{m.capacity}/{m.capacityMax}</b></span>
        <span><small>PUNTOS</small><b>{m.score}</b></span>
      </div>}

      {state.phase === 'lista' && <div className="nnc-brief">
        <p className="nnc-night">NOCHE {NIGHT.index} · {NIGHT.name.toUpperCase()}</p>
        <p>{NIGHT.briefing}</p>
        <ul className="nnc-goals" aria-label="Objetivos de la noche">
          <li>Rollo ≥ {NIGHT.objectives.minVibe}</li><li>Puntos ≥ {NIGHT.objectives.minScore}</li><li>Aforo ≤ {NIGHT.objectives.maxCapacity}</li>
        </ul>
        <p className="nnc-help">Mira la ficha. <b>PASA</b> si puede entrar, <b>FUERA</b> si no. Menores, sin entrada, botellas de fuera y mal rollo se quedan en la calle.</p>
        {best !== undefined && <p className="nnc-best">Récord de esta noche: {best}</p>}
        <button type="button" className="nnc-primary" onClick={() => dispatch({ type: 'empezar', seed: (Date.now() % 2147483647) | 0 })}>ABRIR LA PUERTA →</button>
      </div>}

      {(state.phase === 'puerta' || state.phase === 'pausa') && person && <>
        <div className="nnc-card" ref={card} aria-live="polite">
          <div className="nnc-portrait" style={{ ['--nnc-type' as string]: ARCHETYPE_COLOR[person.archetypeId] ?? '#efc267' }} aria-hidden="true">
            <span>{initials(person.displayName)}</span>
            <small>{ARCHETYPES.find(item => item.id === person.archetypeId)?.name ?? ''}</small>
          </div>
          <p className="nnc-name">{person.displayName}</p>
          <dl>
            <div><dt>Edad</dt><dd>{person.age === null ? 'Sin DNI' : person.age}</dd></div>
            <div><dt>Entrada</dt><dd className={person.ticket.valid ? 'ok' : 'ko'}>{TICKET_NAMES[person.ticket.kind]}{person.ticket.kind !== 'ninguno' ? (person.ticket.valid ? ' · válida' : ' · no válida') : ''}</dd></div>
            {person.ticket.holder && person.ticket.holder !== person.displayName && <div><dt>A nombre de</dt><dd className="ko">{person.ticket.holder}</dd></div>}
          </dl>
          <ul className="nnc-tags" aria-label="Lo que se ve">
            {person.traitIds.map(id => TRAITS.find(t => t.id === id)).filter(t => t?.visible).map(t => <li key={t!.id} title={t!.blurb}>{t!.name}</li>)}
            {person.visualCueIds.map(id => VISUAL_CUES.find(c => c.id === id)).filter(Boolean).map(c => <li key={c!.id} className="cue" title={c!.hint}>{c!.label}</li>)}
          </ul>
          <blockquote>«{personLine(person)}»</blockquote>
          <p className="nnc-queue">En la cola: {state.queue.length}</p>
        </div>
        {state.lastDecision && <p key={decisions.current} className={`nnc-verdict ${state.lastDecision.correct ? 'good' : 'bad'}`} role="status">{state.lastDecision.correct ? '✓' : '✗'} {state.lastDecision.line}</p>}
        <div className="nnc-actions">
          <button type="button" className="nnc-out" disabled={!active} onClick={() => decide('fuera')}>FUERA</button>
          <button type="button" className="nnc-in" disabled={!active} onClick={() => decide('pasa')}>PASA</button>
        </div>
      </>}

      {state.phase === 'pausa' && <div className="nnc-overlay" role="dialog" aria-modal="true" aria-label={PAUSE_LABEL}>
        <h2>{PAUSE_LABEL}</h2>
        <button type="button" className="nnc-primary" onClick={() => dispatch({ type: 'reanudar' })}>VOLVER A LA PUERTA</button>
        <button type="button" className="nnc-secondary" onClick={() => { dispatch({ type: 'salir' }); onBack() }}>DEJAR LA PUERTA</button>
      </div>}

      {(state.phase === 'cierre' || state.phase === 'game-over') && state.result && <div className="nnc-overlay" role="dialog" aria-modal="true" aria-label="Fin de la noche">
        <h2>{state.result.passed ? 'NOCHE SUPERADA' : PARTY_OVER_LABEL}</h2>
        <p>{END_TEXT[state.result.reason]}</p>
        <p className="nnc-score">PUNTOS {state.result.score}{best !== undefined ? ` · RÉCORD ${Math.max(best, state.result.reason === 'abandonada' ? 0 : state.result.score)}` : ''}</p>
        <button type="button" className="nnc-primary" onClick={() => dispatch({ type: 'reiniciar' })}>OTRA NOCHE</button>
        <button type="button" className="nnc-secondary" onClick={onBack}>VOLVER A LOS MODOS</button>
      </div>}
    </section>
  )
}
