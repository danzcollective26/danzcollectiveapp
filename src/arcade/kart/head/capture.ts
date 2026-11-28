import { faceBoxFromPixels, renderBalloon, type FaceBox, type RgbaBuffer } from './stylize.ts'

type Detector = { detect: (source: CanvasImageSource) => Promise<{ boundingBox?: DOMRectReadOnly }[]> }

function read(canvas: HTMLCanvasElement): RgbaBuffer {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas no disponible')
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { width: frame.width, height: frame.height, data: frame.data }
}

/** FaceDetector when the browser has it. Otherwise the pixel crop in stylize.ts. */
export async function detectFace(canvas: HTMLCanvasElement, pixels: RgbaBuffer): Promise<FaceBox> {
  const FaceDetectorCtor = (globalThis as { FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => Detector }).FaceDetector
  if (FaceDetectorCtor) {
    try {
      const found = await new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 }).detect(canvas)
      const box = found[0]?.boundingBox
      if (box && box.width > 12 && box.height > 12) return { x: box.x, y: box.y, width: box.width, height: box.height }
    } catch { /* The pixel crop still produces a head. */ }
  }
  return faceBoxFromPixels(pixels.width, pixels.height, pixels.data)
}

export async function drawSnapshot(source: CanvasImageSource, width: number, height: number, mirror = false): Promise<Blob> {
  const scale = Math.min(1, 640 / Math.max(width, height, 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) throw new Error('No se ha podido guardar el encuadre')
  return blob
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function stylizeBlob(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width; canvas.height = bitmap.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.drawImage(bitmap, 0, 0)
    const pixels = read(canvas)
    const box = await detectFace(canvas, pixels)
    const balloon = renderBalloon(pixels, box)
    canvas.width = balloon.width; canvas.height = balloon.height
    const pixelsOut = new Uint8ClampedArray(balloon.width * balloon.height * 4)
    pixelsOut.set(balloon.data)
    ctx.putImageData(new ImageData(pixelsOut, balloon.width, balloon.height), 0, 0)
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!png) throw new Error('No se ha podido dibujar el cabezón')
    return blobToDataUrl(png)
  } finally { bitmap.close() }
}
