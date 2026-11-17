import type { MetricDelta, ScannerState } from '../types.ts'

/** Escáner de serie, antes de mejoras. El coste se resta a los puntos de la noche. */
export const SCANNER_BASE: ScannerState = {
  precision: 0.55,
  cooldownMs: 8000,
  cost: 8,
  failRisk: 0.35,
  angerRisk: 0.2,
  friskWindowMs: 700,
  readyAtMs: 0,
}

export const VIBE_MAX = 100
export const VVIP_MAX = 100
export const SCORE_LIMIT = 1_000_000
export const BANK_LIMIT = 1_000_000

/** Acierto al dejar pasar a quien puede entrar. */
export const ADMIT_CORRECT: MetricDelta = { vibe: 2, score: 10, capacity: 1, reputation: 0, vvip: 0, money: 1 }
/** Dejar pasar a quien está prohibido. */
export const ADMIT_WRONG: MetricDelta = { vibe: -14, score: 0, capacity: 1, reputation: -2, vvip: 0, money: 0 }
/** Echar a quien tocaba echar. */
export const REJECT_CORRECT: MetricDelta = { vibe: 3, score: 12, capacity: 0, reputation: 1, vvip: 0, money: 1 }
/** Echar a quien tenía que entrar. */
export const REJECT_WRONG: MetricDelta = { vibe: -8, score: 0, capacity: 0, reputation: -1, vvip: 0, money: 0 }
/** Se suma a ADMIT_CORRECT si la persona es VVIP y podía entrar. */
export const VVIP_ADMIT_BONUS: MetricDelta = { vibe: 2, score: 10, capacity: 0, reputation: 2, vvip: 8, money: 0 }
/** Se suma a REJECT_WRONG si se echa a un VVIP que podía entrar. */
export const VVIP_REJECT_PENALTY: MetricDelta = { vibe: -10, score: 0, capacity: 0, reputation: -3, vvip: -16, money: 0 }

export const SCAN_FAIL = { vibe: -3 }
export const SCAN_ANGER = { vibe: -8, vvip: -6 }

export const SCANNER_LIMITS = {
  precision: [0.05, 0.95],
  cooldownMs: [1500, 20_000],
  cost: [1, 50],
  risk: [0, 0.8],
  friskWindowMs: [400, 1600],
} as const
