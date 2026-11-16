export function menuIndex(index: number, step: number, count: number) {
  if (count <= 0) return 0
  return ((index + step) % count + count) % count
}
export function swipeMenuStep(dx: number, dy: number) {
  return Math.abs(dx) >= 38 && Math.abs(dx) > Math.abs(dy) * 1.25 ? (dx < 0 ? 1 : -1) : 0
}
