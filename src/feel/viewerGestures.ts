export type SwipeDecision = 'ignore' | 'next' | 'previous' | 'dismiss'

/** Horizontal pass, downward dismiss, or nothing. Zoomed photos keep their pan. */
export function decideSwipe(dx: number, dy: number, zoomed: boolean, moved: boolean): SwipeDecision {
  if (!moved || zoomed) return 'ignore'
  if (dy >= 88 && dy > Math.abs(dx) * 1.35) return 'dismiss'
  if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.3) return dx < 0 ? 'next' : 'previous'
  return 'ignore'
}

export function clampScale(scale: number) {
  return Math.max(1, Math.min(3, scale))
}
