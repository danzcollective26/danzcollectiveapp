import { DRIVERS } from '../garage'
import { portraitFor } from './store'

const portraits = new Map<string, HTMLImageElement>()

export function portraitImage(driver: string): HTMLImageElement | null {
  const url = portraitFor(driver)
  if (!url) return null
  let image = portraits.get(url)
  if (!image) { image = new Image(); image.src = url; portraits.set(url, image) }
  return image.complete && image.naturalWidth > 0 ? image : null
}

export function watchPortrait(driver: string, redraw: () => void) {
  const url = portraitFor(driver)
  if (!url || portraitImage(driver)) return
  const image = portraits.get(url)
  if (image) image.addEventListener('load', redraw, { once: true })
}

/** Top-down balloon. The body sprite stays underneath; this one is transformed per frame. */
export function drawHeadArt(c: CanvasRenderingContext2D, driverId: string, accent: string) {
  const driver = DRIVERS.find(d => d.id === driverId) ?? DRIVERS[0]
  c.clearRect(0, 0, 160, 160)
  c.save(); c.translate(80, 78)
  c.fillStyle = '#06182088'; c.beginPath(); c.ellipse(0, 58, 46, 10, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(0, 0, 62, 68, 0, 0, Math.PI * 2); c.fillStyle = driver.helmet; c.fill(); c.lineWidth = 7; c.strokeStyle = '#182e37'; c.stroke()
  const photo = portraitImage(driverId)
  if (photo) {
    c.save(); c.beginPath(); c.ellipse(0, 0, 54, 60, 0, 0, Math.PI * 2); c.clip(); c.drawImage(photo, -54, -60, 108, 120); c.restore()
  } else {
    c.fillStyle = '#182e37'; c.beginPath(); c.ellipse(10, -2, 26, 30, 0.2, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#c6f7ed'; c.fillRect(28, -16, 3, 22)
    c.fillStyle = accent
    for (let n = 0; n < 6; n++) { const a = n * Math.PI / 3; c.beginPath(); c.arc(Math.cos(a) * 10 - 6, Math.sin(a) * 10 - 46, 7, 0, Math.PI * 2); c.fill() }
    c.beginPath(); c.arc(-6, -46, 8, 0, Math.PI * 2); c.fill()
  }
  c.fillStyle = '#fff6'; c.beginPath(); c.ellipse(-22, -28, 14, 8, -0.6, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#e4d1b0'; c.fillRect(-8, 62, 16, 14)
  c.restore()
}
