import type { InspectionResolution, Metrics } from '../types.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

/**
 * TODO(nomenoconeso): devolver métricas nuevas, sin mutar las de entrada.
 * Sumar el delta. vibe se recorta a 0..VIBE_MAX. vvipHappiness a 0..VVIP_MAX.
 * capacity no baja en el MVP: solo sube al dejar pasar.
 * score, reputation y doorMoney no bajan de 0. score no pasa de SCORE_LIMIT.
 * El dinero de esta noche no entra en la hucha hasta un cierre superado.
 */
export function updateMetrics(metrics: Metrics, resolution: InspectionResolution): Metrics {
  void metrics
  void resolution
  throw new NomeNoConEsoPendiente('updateMetrics')
}
