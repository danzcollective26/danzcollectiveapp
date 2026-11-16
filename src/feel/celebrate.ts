import { prefersReducedMotion } from './motion.ts'

const colors = ['#d9ff6b', '#ff789f', '#ba9efa', '#f3f0e8']

/** A short burst of dots. Removed on its own and skipped when motion is reduced. */
export function celebrate(origin?: Element | { x: number; y: number } | null) {
  if (typeof document === 'undefined' || prefersReducedMotion()) return
  const box = origin instanceof Element ? origin.getBoundingClientRect() : null
  const point = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    : origin && 'x' in origin ? origin
    : { x: window.innerWidth / 2, y: window.innerHeight / 3 }
  const layer = document.createElement('div')
  layer.className = 'danz-particles'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.left = `${point.x}px`
  layer.style.top = `${point.y}px`
  for (let index = 0; index < 12; index += 1) {
    const bit = document.createElement('span')
    const angle = (Math.PI * 2 * index) / 12
    const distance = 34 + (index % 3) * 14
    bit.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
    bit.style.setProperty('--dy', `${Math.sin(angle) * distance}px`)
    bit.style.background = colors[index % colors.length]
    layer.append(bit)
  }
  document.body.append(layer)
  window.setTimeout(() => layer.remove(), 700)
}
