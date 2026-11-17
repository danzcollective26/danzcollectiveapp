/** Shared cabezón proportions. The mesh and the tests both read these numbers. */
export const BODY_RADIUS = 5.5
export const CABEZON_SCALE = 2.12
export const HEAD_RADIUS = BODY_RADIUS * CABEZON_SCALE
export const HEAD_CENTER = { x: -2, y: 33.5, z: 0 }
/** Seat tub half-width. The head is wider, so it clears the cockpit. */
export const SEAT_HALF_WIDTH = 8.5
export const CHASSIS_TOP = 11
/** Head draws after the chassis; the face draws after the balloon. */
export const HEAD_RENDER_ORDER = 3
export const FACE_RENDER_ORDER = 4

export type CabezonInput = {
  time: number
  steer: number
  speed: number
  boosting: number
  /** Seconds since the last hit. Anything outside 0–0.45 is a rest pose. */
  impactAge: number
  /** 0–1 disturbance from a bump, scrape or hard steer. */
  bump: number
  reduced: boolean
}
export type CabezonPose = {
  offsetY: number
  lean: number
  pitch: number
  squashX: number
  squashY: number
  squashZ: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback

/** Transform only. The geometry stays put so a frame is a matrix update. */
export function cabezonPose(input: CabezonInput): CabezonPose {
  const steer = clamp(finite(input.steer), -1, 1)
  const speed = Math.max(0, finite(input.speed))
  const boosting = Math.max(0, finite(input.boosting))
  const bump = clamp(finite(input.bump), 0, 1)
  const time = finite(input.time)
  const impactAge = finite(input.impactAge, 99)
  const hit = impactAge >= 0 && impactAge < 0.45 ? Math.cos((impactAge / 0.45) * Math.PI / 2) : 0
  if (input.reduced) return { offsetY: 0, lean: steer * 0.06, pitch: 0, squashX: 1, squashY: 1, squashZ: 1 }
  const bob = Math.sin(time * 7.2) * (0.22 + Math.min(0.9, speed / 260))
  const boost = Math.min(1, boosting / 1.2)
  const lean = steer * 0.36 + Math.sin(time * 3.1) * 0.02 * Math.min(1, speed / 90)
  const pitch = -boost * 0.18 + bump * 0.1 + hit * 0.2
  const squashY = clamp(1 + boost * 0.1 - hit * 0.22, 0.74, 1.14)
  const squashX = clamp(1 - boost * 0.045 + hit * 0.15, 0.9, 1.2)
  const squashZ = clamp(1 / (squashX * squashY), 0.88, 1.14)
  return { offsetY: bob + bump * 0.7 - hit * 1.15, lean, pitch, squashX, squashY, squashZ }
}
