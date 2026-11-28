import { prefersReducedMotion } from '../../feel/motion.ts'

/** Shared ARCADANZ game feel: short, optional and always skipped with reduced motion. */

export const DANZ_SPARK_COLORS = ['#d9ff6b', '#ff789f', '#ba9efa', '#f3f0e8'] as const

type Point = { x: number; y: number }
export type BurstOptions = { count?: number; spread?: number; colors?: readonly string[]; size?: number }

const vibrationPatterns = {
  hit: 10,
  crash: [28, 40, 70],
  level: [14, 30, 14, 30, 40],
} as const
export type Buzz = keyof typeof vibrationPatterns

/** Particle offsets for a radial burst. Pure, so it can be tested without a DOM. */
export function burstOffsets(count: number, spread: number): Point[] {
  const safe = Math.max(1, Math.min(48, Math.round(count)))
  return Array.from({ length: safe }, (_, index) => {
    const angle = (Math.PI * 2 * index) / safe + (index % 2 ? 0.18 : -0.12)
    const distance = spread * (0.62 + (index % 3) * 0.19)
    return { x: Math.round(Math.cos(angle) * distance * 10) / 10, y: Math.round(Math.sin(angle) * distance * 10) / 10 }
  })
}

function centre(origin: Element | Point): Point {
  if ('x' in origin && 'y' in origin && !(origin instanceof Element)) return origin
  const box = (origin as Element).getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/** Radial burst of dots at an element or viewport point. Removes itself. */
export function burst(origin: Element | Point | null | undefined, options: BurstOptions = {}) {
  if (!origin || typeof document === 'undefined' || prefersReducedMotion()) return
  const { count = 10, spread = 34, colors = DANZ_SPARK_COLORS, size = 6 } = options
  const point = centre(origin)
  const layer = document.createElement('div')
  layer.className = 'danz-particles arcade-burst'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.left = `${point.x}px`
  layer.style.top = `${point.y}px`
  burstOffsets(count, spread).forEach((offset, index) => {
    const bit = document.createElement('span')
    bit.style.setProperty('--dx', `${offset.x}px`)
    bit.style.setProperty('--dy', `${offset.y}px`)
    bit.style.width = bit.style.height = `${size}px`
    bit.style.background = colors[index % colors.length]
    layer.append(bit)
  })
  document.body.append(layer)
  window.setTimeout(() => layer.remove(), 700)
}

/** Brief camera shake on an element using the Web Animations API. */
export function shake(element: Element | null | undefined, strength = 6, duration = 280) {
  if (!element || prefersReducedMotion() || typeof (element as HTMLElement).animate !== 'function') return
  const s = Math.max(1, Math.min(14, strength))
  try {
    ;(element as HTMLElement).animate([
      { transform: 'translate(0,0)' },
      { transform: `translate(${-s}px,${s * 0.4}px)` },
      { transform: `translate(${s * 0.8}px,${-s * 0.5}px)` },
      { transform: `translate(${-s * 0.5}px,${-s * 0.3}px)` },
      { transform: `translate(${s * 0.3}px,${s * 0.2}px)` },
      { transform: 'translate(0,0)' },
    ], { duration, easing: 'ease-out' })
  } catch { /* Optional feedback. */ }
}

/** Short flash ring on an element (CSS class removed after the animation). */
export function flash(element: Element | null | undefined, className = 'arcade-flash', duration = 420) {
  if (!element || prefersReducedMotion()) return
  element.classList.remove(className)
  void (element as HTMLElement).offsetWidth
  element.classList.add(className)
  window.setTimeout(() => element.classList.remove(className), duration)
}

/** Game vibration patterns on devices that expose them. */
export function buzz(kind: Buzz) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try { navigator.vibrate(vibrationPatterns[kind] as number | number[]) } catch { /* Optional feedback. */ }
}
