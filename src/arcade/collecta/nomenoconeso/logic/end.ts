import type { NightConfig, NightEndReason, NightResult, NightState, ProgressionState } from '../types.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

/**
 * TODO(nomenoconeso): devolver el cierre, o null si la noche sigue.
 * vibe <= 0 → vibe-cero.
 * capacity > capacityMax o capacity > objectives.maxCapacity → aforo-reventado.
 * Esos dos son inmediatos, aunque quede tiempo.
 * Si elapsedMs >= durationMs y vibe >= minVibe y score >= minScore
 * y capacity <= maxCapacity → objetivos-cumplidos.
 * Si elapsedMs >= durationMs y no se cumple eso → objetivos-fallidos.
 * En pausa, lista y game-over no evaluar el reloj.
 * No tratar un fallo de objetivos como cierre duro.
 */
export function readEndCondition(state: NightState, night: NightConfig): NightEndReason | null {
  void state
  void night
  throw new NomeNoConEsoPendiente('readEndCondition')
}

/**
 * TODO(nomenoconeso): si result.passed, añadir la noche a nightsCleared
 * solo si es la siguiente, sumar doorMoneyEarned y reputationDelta
 * y guardar el récord con rememberRecord.
 * Si no passed, no tocar la hucha ni el desbloqueo. El récord de puntuación
 * sí puede guardarse, también en un cierre duro.
 * reason abandonada no guarda récord.
 * Rellenar pointsIntent con buildPointsIntent sin enviarlo a ningún sitio.
 * Después, recomputeProgression.
 */
export function applyNightResult(progress: ProgressionState, result: NightResult): ProgressionState {
  void progress
  void result
  throw new NomeNoConEsoPendiente('applyNightResult')
}
