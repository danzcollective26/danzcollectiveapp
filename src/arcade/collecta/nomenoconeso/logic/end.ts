import type { NightConfig, NightEndReason, NightResult, NightState, ProgressionState } from '../types.ts'
import { BANK_LIMIT } from '../data/balance.ts'
import { buildPointsIntent } from './points.ts'
import { recomputeProgression, rememberRecord } from './progression.ts'
import { NIGHTS } from '../data/nights.ts'

const ACTIVE = new Set(['puerta', 'cacheo', 'escaner'])

/** Close reason, or null while the night goes on. Vibe and capacity end it at once. */
export function readEndCondition(state: NightState, night: NightConfig): NightEndReason | null {
  if (!ACTIVE.has(state.phase)) return null
  const m = state.metrics
  if (m.vibe <= 0) return 'vibe-cero'
  if (m.capacity > m.capacityMax || m.capacity > night.objectives.maxCapacity) return 'aforo-reventado'
  if (state.elapsedMs < night.durationMs) return null
  const goals = night.objectives
  return m.vibe >= goals.minVibe && m.score >= goals.minScore && m.capacity <= goals.maxCapacity ? 'objetivos-cumplidos' : 'objetivos-fallidos'
}

export function buildNightResult(state: NightState, reason: NightEndReason): NightResult {
  const passed = reason === 'objetivos-cumplidos'
  return {
    nightId: state.nightId,
    passed,
    hard: reason === 'vibe-cero' || reason === 'aforo-reventado',
    reason,
    metrics: { ...state.metrics },
    score: state.metrics.score,
    doorMoneyEarned: state.metrics.doorMoney,
    reputationDelta: state.metrics.reputation,
  }
}

/** Records, bank and unlocks after a night. Abandoned nights keep nothing. */
export function applyNightResult(progress: ProgressionState, result: NightResult): ProgressionState {
  let next: ProgressionState = { ...progress, nightsCleared: [...progress.nightsCleared], bestScoreByNight: { ...progress.bestScoreByNight }, upgradeIds: [...progress.upgradeIds] }
  if (result.reason !== 'abandonada') next = rememberRecord(next, result.nightId, result.score)
  const expected = NIGHTS[next.nightsCleared.length]?.id
  if (result.passed && result.nightId === expected) {
    next = {
      ...next,
      nightsCleared: [...next.nightsCleared, result.nightId],
      doorMoney: Math.min(BANK_LIMIT, next.doorMoney + Math.max(0, result.doorMoneyEarned)),
      reputation: Math.min(BANK_LIMIT, next.reputation + Math.max(0, result.reputationDelta)),
    }
  }
  next = { ...next, pointsIntent: buildPointsIntent(result.nightId, result.score) }
  return recomputeProgression(next)
}
