import type { InspectionResolution, Metrics } from '../types.ts'
import { SCORE_LIMIT, VIBE_MAX, VVIP_MAX } from '../data/balance.ts'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** New metrics; the input is never mutated. Capacity only grows in the MVP. */
export function updateMetrics(metrics: Metrics, resolution: InspectionResolution): Metrics {
  return {
    capacity: metrics.capacity + Math.max(0, resolution.capacity),
    capacityMax: metrics.capacityMax,
    vibe: clamp(metrics.vibe + resolution.vibe, 0, VIBE_MAX),
    score: clamp(metrics.score + resolution.score, 0, SCORE_LIMIT),
    reputation: clamp(metrics.reputation + resolution.reputation, 0, SCORE_LIMIT),
    doorMoney: clamp(metrics.doorMoney + resolution.money, 0, SCORE_LIMIT),
    vvipHappiness: clamp(metrics.vvipHappiness + resolution.vvip, 0, VVIP_MAX),
  }
}
