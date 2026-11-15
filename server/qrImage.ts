import { createRequire } from 'node:module'
import jsQR from 'jsqr'
import QRCode from 'qrcode'

const { PNG } = createRequire(import.meta.url)('pngjs') as {
  PNG: { sync: {
    read: (bytes: Buffer) => { width: number; height: number; data: Buffer }
    write: (image: { width: number; height: number; data: Buffer }) => Buffer
  } }
}

/** Keep the generated texture, reinforcing the requested module grid only
 * when the original art cannot be decoded. No extra inference or paid retry. */
export function reinforceQrArt(bytes: Buffer, content: string): Buffer {
  if (verifyQrPng(bytes, content)) return bytes
  if (bytes.length < 24 || bytes.length > MAX_IMAGE_BYTES || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') return bytes
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20)
  if (!width || !height || width > 2048 || height > 2048) return bytes
  try {
    const original = PNG.sync.read(bytes)
    const matrix = QRCode.create(content, { errorCorrectionLevel: 'H' }).modules
    const total = matrix.size + 8
    // Integer module boundaries and a four-module quiet zone keep the grid crisp.
    const cell = Math.floor(Math.min(width, height) / total)
    if (cell < 3) return bytes
    const left = Math.floor((width - total * cell) / 2), top = Math.floor((height - total * cell) / 2)
    for (const opacity of [0.65, 0.85]) {
      const data = Buffer.from(original.data)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const col = Math.floor((x - left) / cell) - 4, row = Math.floor((y - top) / cell) - 4
        const outside = col < 0 || row < 0 || col >= matrix.size || row >= matrix.size
        const dark = !outside && matrix.get(row, col)
        const offset = (y * width + x) * 4
        for (let channel = 0; channel < 3; channel++) data[offset + channel] = outside ? 255 : Math.round(data[offset + channel] * (1 - opacity) + (dark ? 0 : 255) * opacity)
        data[offset + 3] = 255
      }
      const png = PNG.sync.write({ width, height, data })
      if (verifyQrPng(png, content)) return png
    }
  } catch { /* The caller rejects any image that still cannot be verified. */ }
  return bytes
}
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Decode bounded PNG bytes and compare the actual payload, not a model's claim. */
export function verifyQrPng(bytes: Buffer, content: string): boolean {
  if (bytes.length < 24 || bytes.length > MAX_IMAGE_BYTES || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') return false
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20)
  if (!width || !height || width > 2048 || height > 2048) return false
  try {
    const image = PNG.sync.read(bytes)
    const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height, { inversionAttempts: 'attemptBoth' })
    return decoded?.data === content
  } catch { return false }
}
