import { NIGHTS } from '../data/nights.ts'
import type { DanzPointsIntent } from '../types.ts'
import { SCORE_LIMIT } from '../data/balance.ts'

/**
 * TODO(nomenoconeso): no enviar esto a DANZPOINTS ni a Supabase.
 * El cliente no suma puntos. Cuando exista una regla de servidor,
 * este objeto solo informa de la puntuación local. claim se queda en false.
 * Ver docs/DANZPOINTS_PILOTO_2026-11-13.md.
 */
export function buildPointsIntent(nightId: string, localScore: number): DanzPointsIntent {
  if (!NIGHTS.some((night) => night.id === nightId)) {
    throw new Error('Noche desconocida para el aviso de puntos.')
  }
  if (!Number.isSafeInteger(localScore) || localScore < 0 || localScore > SCORE_LIMIT) {
    throw new Error('La puntuación local no sirve para un aviso de puntos.')
  }
  return {
    schemaVersion: 1,
    gameId: 'collecta-nomenoconeso',
    claim: false,
    status: 'no-implementado',
    nightId,
    localScore,
  }
}
