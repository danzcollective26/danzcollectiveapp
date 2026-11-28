import type { NightAction, NightConfig, NightState, Person } from '../types.ts'
import { NIGHTS } from '../data/nights.ts'
import { scannerFromUpgrades } from './scanner.ts'
import { NomeNoConEsoPendiente } from './pending.ts'
import { generatePerson } from './people.ts'
import { resolveInspection } from './inspection.ts'
import { updateMetrics } from './metrics.ts'
import { buildNightResult, readEndCondition } from './end.ts'

const ACTIVE = new Set<NightState['phase']>(['puerta', 'cacheo', 'escaner'])

/** Estado en blanco, en la lista, sin cola y sin resultado. */
export function createInitialNightState(night: NightConfig, reducedMotion = false): NightState {
  return {
    phase: 'lista',
    resumePhase: null,
    pauseReason: null,
    nightId: night.id,
    elapsedMs: 0,
    metrics: { ...night.start },
    queue: [],
    current: null,
    scanner: scannerFromUpgrades([]),
    activeEventId: null,
    reducedMotion,
    result: null,
    seed: 1,
    nextIndex: 0,
    lastDecision: null,
  }
}

function draft(state: NightState, night: NightConfig, index: number): Person {
  return generatePerson({ nightId: night.id, index, seed: state.seed, archetypeIds: night.archetypeIds })
}

/** Next person, skipping a copy of whoever is just ahead in line (variety; still deterministic). */
function draftAfter(state: NightState, night: NightConfig, index: number, ahead: Person | undefined): { person: Person; used: number } {
  for (let offset = 0; offset < 4; offset++) {
    const person = draft(state, night, index + offset)
    if (!ahead || person.displayName !== ahead.displayName) return { person, used: offset + 1 }
  }
  return { person: draft(state, night, index), used: 1 }
}

function closeIfDone(state: NightState, night: NightConfig): NightState {
  const reason = readEndCondition(state, night)
  if (!reason) return state
  const result = buildNightResult(state, reason)
  return { ...state, phase: result.hard ? 'game-over' : 'cierre', resumePhase: null, pauseReason: null, result }
}

/**
 * Night state machine (docs/NOMENOCONESO_PLAN.md §4). Pure: never mutates its
 * input, never uses Math.random. Frisk, scanner and events belong to v1 and
 * still throw NomeNoConEsoPendiente; the MVP screen does not offer them.
 */
export function reduceNight(state: NightState, action: NightAction): NightState {
  const night = NIGHTS.find(item => item.id === state.nightId)
  if (!night) return state
  switch (action.type) {
    case 'empezar': {
      if (state.phase !== 'lista') return state
      const seeded: NightState = { ...state, seed: Number.isInteger(action.seed) ? action.seed! : state.seed }
      const people: Person[] = []
      let index = 0
      while (people.length < Math.max(1, night.queueSize)) {
        const next = draftAfter(seeded, night, index, people[people.length - 1])
        people.push(next.person); index += next.used
      }
      return { ...seeded, phase: 'puerta', current: people[0], queue: people.slice(1), nextIndex: index, elapsedMs: 0 }
    }
    case 'pausar':
      if (!ACTIVE.has(state.phase)) return state
      return { ...state, phase: 'pausa', resumePhase: state.phase, pauseReason: action.reason }
    case 'reanudar':
      if (state.phase !== 'pausa') return state
      return { ...state, phase: state.resumePhase ?? 'puerta', resumePhase: null, pauseReason: null }
    case 'tick': {
      if (!ACTIVE.has(state.phase) || !Number.isFinite(action.dtMs) || action.dtMs <= 0) return state
      return closeIfDone({ ...state, elapsedMs: Math.min(night.durationMs, state.elapsedMs + action.dtMs) }, night)
    }
    case 'decidir': {
      if (state.phase !== 'puerta' || !state.current) return state
      const person = state.current
      const resolution = resolveInspection({ person, choice: action.choice, revealedItem: false, frisked: false })
      const metrics = updateMetrics(state.metrics, resolution)
      // The queue never runs dry: each decision adds the next generated person at the back.
      const incoming = draftAfter(state, night, state.nextIndex, state.queue[state.queue.length - 1] ?? person)
      const line = [...state.queue, incoming.person]
      return closeIfDone({
        ...state,
        metrics,
        current: line[0],
        queue: line.slice(1),
        nextIndex: state.nextIndex + incoming.used,
        lastDecision: { personName: person.displayName, choice: action.choice, correct: resolution.correct, line: resolution.line },
      }, night)
    }
    case 'salir': {
      if (state.phase === 'cierre' || state.phase === 'game-over') return state
      return { ...state, phase: 'cierre', resumePhase: null, pauseReason: null, result: buildNightResult(state, 'abandonada') }
    }
    case 'cachear':
    case 'resolver-cacheo':
    case 'escanear':
    case 'cerrar-escaner':
      throw new NomeNoConEsoPendiente('reduceNight')
  }
}
