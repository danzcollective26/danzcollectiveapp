import type { FriskAttempt, InspectionInput, InspectionResolution, MetricDelta, Person, ProhibitionReason } from '../types.ts'
import { ADMIT_CORRECT, ADMIT_WRONG, REJECT_CORRECT, REJECT_WRONG, VVIP_ADMIT_BONUS, VVIP_REJECT_PENALTY } from '../data/balance.ts'
import { DIALOGUES } from '../data/dialogues.ts'

export function addDelta(a: MetricDelta, b: MetricDelta): MetricDelta {
  return { vibe: a.vibe + b.vibe, score: a.score + b.score, capacity: a.capacity + b.capacity, reputation: a.reputation + b.reputation, vvip: a.vvip + b.vvip, money: a.money + b.money }
}

const LINE_BY_REASON: Record<ProhibitionReason, string> = {
  'sin-entrada': 'puerta-sin',
  hater: 'puerta-hater',
  'mal-rollo': 'puerta-criterio',
  'botella-exterior': 'puerta-botella',
  'objeto-peligroso': 'puerta-arma',
  expulsado: 'puerta-expulsado',
  'energia-negativa': 'puerta-drama',
  menor: 'puerta-menor',
}

/** Door line id for a decision, exactly as docs/NOMENOCONESO_PLAN.md §4.4 maps it. */
export function doorLineId(person: Person, choice: InspectionInput['choice']): string {
  const reason = person.prohibition
  if (reason === 'mal-rollo' && person.traitIds.includes('grabando')) return 'puerta-grabando'
  if (reason) return LINE_BY_REASON[reason]
  return choice === 'pasa' ? 'puerta-pase' : 'puerta-criterio'
}

export function lineText(id: string): string {
  return DIALOGUES.find(line => line.id === id)?.text ?? ''
}

/** Correct when a clean person passes or a prohibited one stays out. Clues never change the verdict. */
export function resolveInspection(input: InspectionInput): InspectionResolution {
  const { person, choice } = input
  const allowed = person.prohibition === null
  const correct = allowed ? choice === 'pasa' : choice === 'fuera'
  let delta: MetricDelta = choice === 'pasa' ? (allowed ? ADMIT_CORRECT : ADMIT_WRONG) : (allowed ? REJECT_WRONG : REJECT_CORRECT)
  if (person.archetypeId === 'vvip' && allowed) delta = addDelta(delta, choice === 'pasa' ? VVIP_ADMIT_BONUS : VVIP_REJECT_PENALTY)
  return { ...delta, correct, prohibition: person.prohibition, angered: false, line: lineText(doorLineId(person, choice)) }
}

/** A hit inside the window reveals the hidden item (or confirms there is none). */
export function resolveFrisk(person: Person, attempt: FriskAttempt): { hit: boolean; itemId: Person['hiddenItemId'] } {
  const hit = attempt.hitAtMs !== null && attempt.hitAtMs >= attempt.startedAtMs && attempt.hitAtMs <= attempt.startedAtMs + attempt.windowMs
  return { hit, itemId: hit ? person.hiddenItemId : null }
}
