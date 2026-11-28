import type { NightConfig } from '../types.ts'

/**
 * Dificultad de una noche, solo para ordenar el catálogo.
 * No es la puntuación de la partida.
 * 100 + cola×3 + round(12000/ritmo) + arquetipos×5 + eventos×7
 * + round(puntuación mínima/10) − hueco de aforo − hueco de rollo.
 */
export function nightDifficulty(night: NightConfig): number {
  const capacitySlack = night.start.capacityMax - night.start.capacity
  const vibeSlack = night.start.vibe - night.objectives.minVibe
  return 100
    + night.queueSize * 3
    + Math.round(12000 / night.spawnEveryMs)
    + night.archetypeIds.length * 5
    + night.eventIds.length * 7
    + Math.round(night.objectives.minScore / 10)
    - capacitySlack
    - vibeSlack
}
