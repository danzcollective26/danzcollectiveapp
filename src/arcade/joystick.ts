import type { LocalDirection } from './versusView'
export type StickVector = { x: number; y: number }
export const STICK_REACH = 42
export const STICK_DEAD_ZONE = .16
/** Radial dead zone and bounded analog output; diagonals never exceed unit speed. */
export function joystickVector(x: number, y: number): StickVector {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 }
  const length = Math.hypot(x, y), magnitude = Math.min(1, length / STICK_REACH)
  if (magnitude <= STICK_DEAD_ZONE) return { x: 0, y: 0 }
  const scale = (magnitude - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE) / length
  return { x: x * scale, y: y * scale }
}
/** The tile-based Arena uses four directions, with hysteresis near the diagonal. */
export function cardinalDirection(v: StickVector, previous: LocalDirection | null = null): LocalDirection | null {
  const x = Math.abs(v.x), y = Math.abs(v.y)
  if (!Number.isFinite(x+y) || x+y < .0001) return null
  if (previous && Math.abs(x-y) < .12 * Math.hypot(x, y)) {
    if ((previous === 'left' && v.x < 0) || (previous === 'right' && v.x > 0) || (previous === 'up' && v.y < 0) || (previous === 'down' && v.y > 0)) return previous
  }
  return x > y ? v.x < 0 ? 'left' : 'right' : v.y < 0 ? 'up' : 'down'
}
