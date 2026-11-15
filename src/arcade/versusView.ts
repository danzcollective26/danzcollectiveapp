export type VersusPlayer = 0 | 1
export type LocalDirection = 'up' | 'down' | 'left' | 'right'
const PORTRAIT: Record<LocalDirection, LocalDirection> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const LEFT_EDGE: Record<LocalDirection, LocalDirection> = { up: 'right', right: 'down', down: 'left', left: 'up' }
const RIGHT_EDGE: Record<LocalDirection, LocalDirection> = { up: 'left', left: 'down', down: 'right', right: 'up' }

/** Directions are relative to the person facing their controller, not the page. */
export function worldDirection(direction: LocalDirection, player: VersusPlayer, landscape: boolean): LocalDirection {
  return landscape ? (player === 0 ? LEFT_EDGE : RIGHT_EDGE)[direction] : player === 0 ? direction : PORTRAIT[direction]
}
export const directionVector: Record<LocalDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
}
