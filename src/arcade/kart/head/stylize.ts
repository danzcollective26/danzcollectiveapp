/** On-device caricature. No network, no model download, no retained photo. */

export const GAME_PALETTE: readonly [number, number, number][] = [
  [34, 59, 62], [24, 46, 55], [27, 48, 48], [238, 232, 213], [232, 227, 208],
  [228, 209, 176], [240, 210, 180], [196, 138, 106], [201, 153, 69], [237, 182, 68],
  [141, 90, 69], [107, 64, 52], [58, 42, 36], [217, 250, 105], [130, 218, 221],
  [245, 149, 183], [242, 116, 82], [198, 247, 237], [255, 241, 224],
]

export type FaceBox = { x: number; y: number; width: number; height: number }
export type RgbaBuffer = { width: number; height: number; data: Uint8ClampedArray }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function nearestPalette(r: number, g: number, b: number): [number, number, number] {
  let best = GAME_PALETTE[0], score = Infinity
  for (const color of GAME_PALETTE) {
    const dr = r - color[0], dg = g - color[1], db = b - color[2]
    const next = dr * dr + dg * dg + db * db
    if (next < score) { score = next; best = color }
  }
  return best
}

/** Skin in YCbCr, loose enough for varied photos and tight enough to ignore asphalt. */
export function skinScore(r: number, g: number, b: number): number {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
  return cb > 80 && cb < 140 && cr > 133 && cr < 180 && r > 70 && r > g - 5 ? 1 : 0
}

export function faceBoxFromPixels(width: number, height: number, data: Uint8ClampedArray): FaceBox {
  let minX = width, minY = height, maxX = 0, maxY = 0, count = 0
  const step = Math.max(1, Math.floor(Math.min(width, height) / 180))
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const i = (y * width + x) * 4
    if (!skinScore(data[i], data[i + 1], data[i + 2])) continue
    count++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  if (count < 12) {
    const side = Math.round(Math.min(width, height) * 0.62)
    return { x: Math.round((width - side) / 2), y: Math.round(height * 0.12), width: side, height: side }
  }
  const padX = (maxX - minX) * 0.18, padY = (maxY - minY) * 0.22
  const x = clamp(minX - padX, 0, width - 1), y = clamp(minY - padY, 0, height - 1)
  return { x, y, width: clamp(maxX - minX + padX * 2, 8, width - x), height: clamp(maxY - minY + padY * 2, 8, height - y) }
}

function punch(r: number, g: number, b: number): [number, number, number] {
  const avg = (r + g + b) / 3, gain = 1.16
  return [clamp(avg + (r - avg) * gain, 0, 255), clamp(avg + (g - avg) * gain, 0, 255), clamp(avg + (b - avg) * gain, 0, 255)]
}

function sample(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): [number, number, number, number] {
  const sx = clamp(x, 0, width - 1), sy = clamp(y, 0, height - 1)
  const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1)
  const tx = sx - x0, ty = sy - y0
  const at = (px: number, py: number) => {
    const i = (py * width + px) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const
  }
  const a = at(x0, y0), b = at(x1, y0), c = at(x0, y1), d = at(x1, y1)
  return [0, 1, 2, 3].map(channel =>
    (a[channel] * (1 - tx) + b[channel] * tx) * (1 - ty) + (c[channel] * (1 - tx) + d[channel] * tx) * ty
  ) as [number, number, number, number]
}

/** Pull samples toward the feature so eyes and mouth read a little larger. */
export function enlargeFeatures(source: RgbaBuffer): RgbaBuffer {
  const { width, height, data } = source
  const out = new Uint8ClampedArray(data.length)
  const eyes = [{ x: width * 0.36, y: height * 0.4 }, { x: width * 0.64, y: height * 0.4 }]
  const mouth = { x: width * 0.5, y: height * 0.68 }
  const features = [...eyes.map(point => ({ ...point, radius: width * 0.16, pull: 0.2 })), { ...mouth, radius: width * 0.14, pull: 0.12 }]
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sx = x, sy = y
    for (const feature of features) {
      const dx = x - feature.x, dy = y - feature.y, distance = Math.hypot(dx, dy)
      if (distance <= 0 || distance >= feature.radius) continue
      const weight = (1 - distance / feature.radius) ** 2 * feature.pull
      sx -= dx * weight; sy -= dy * weight
    }
    const pixel = sample(data, width, height, sx, sy)
    const i = (y * width + x) * 4
    out[i] = pixel[0]; out[i + 1] = pixel[1]; out[i + 2] = pixel[2]; out[i + 3] = pixel[3]
  }
  return { width, height, data: out }
}

export function posterize(buffer: RgbaBuffer): void {
  const { data } = buffer
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) { data[i + 3] = 0; continue }
    const [r, g, b] = punch(data[i], data[i + 1], data[i + 2])
    const color = nearestPalette(r, g, b)
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255
  }
}

export function inkOutline(buffer: RgbaBuffer): void {
  const { width, height, data } = buffer
  const source = data.slice()
  const luma = (i: number) => source[i] * 0.3 + source[i + 1] * 0.5 + source[i + 2] * 0.2
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = (y * width + x) * 4
    if (source[i + 3] < 8) continue
    const edge = Math.abs(luma(i) - luma(i + 4)) + Math.abs(luma(i) - luma(i + width * 4))
    if (edge < 42) continue
    data[i] = 24; data[i + 1] = 46; data[i + 2] = 55
  }
}

function cropSquare(source: RgbaBuffer, box: FaceBox): RgbaBuffer {
  const side = Math.max(box.width, box.height)
  const size = 192
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const pixel = sample(source.data, source.width, source.height, box.x + (x / size) * side, box.y + (y / size) * side)
    const i = (y * size + x) * 4
    data[i] = pixel[0]; data[i + 1] = pixel[1]; data[i + 2] = pixel[2]; data[i + 3] = pixel[3] || 255
  }
  return { width: size, height: size, data }
}

/** Balloon sprite: the face stays inside, the corners stay empty, the ink ring is the game outline. */
export function renderBalloon(source: RgbaBuffer, box: FaceBox): RgbaBuffer {
  const face = enlargeFeatures(cropSquare(source, box))
  posterize(face); inkOutline(face)
  const size = 256, data = new Uint8ClampedArray(size * size * 4)
  const cx = 128, cy = 124, rx = 102, ry = 112
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x - cx) / rx, ny = (y - cy) / ry, falloff = nx * nx + ny * ny
    if (falloff > 1) continue
    const u = clamp((nx * 0.86 + 1) / 2, 0, 0.999), v = clamp((ny * 0.9 + 1) / 2, 0, 0.999)
    const pixel = sample(face.data, face.width, face.height, u * face.width, v * face.height)
    const i = (y * size + x) * 4
    const rim = falloff > 0.78
    data[i] = rim ? 24 : pixel[0]
    data[i + 1] = rim ? 46 : pixel[1]
    data[i + 2] = rim ? 55 : pixel[2]
    data[i + 3] = 255
    if (!rim && nx < -0.15 && ny < -0.25 && nx * nx + ny * ny < 0.18) {
      data[i] = Math.min(255, data[i] + 40); data[i + 1] = Math.min(255, data[i + 1] + 36); data[i + 2] = Math.min(255, data[i + 2] + 28)
    }
  }
  for (let y = 214; y < 248; y++) for (let x = 108; x < 148; x++) {
    const neck = Math.abs(x - 128) < 10 + (y - 214) * 0.15
    if (!neck) continue
    const i = (y * size + x) * 4
    data[i] = 228; data[i + 1] = 209; data[i + 2] = 176; data[i + 3] = 255
  }
  return { width: size, height: size, data }
}
