/** Piezas de Vídeo. Entran en los niveles pares. */

export const VIDEO_PROPS: Array<{
  id: string
  level: number
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "edit-desk", level: 2, src: "/idle/habbo/edit-desk.png", tile: [12, 1], dx: 0, dy: 0, z: 3 },
  { id: "camera", level: 4, src: "/idle/habbo/camera.png", tile: [13, 2], dx: 0, dy: -4, z: 4 },
  { id: "video-spot", level: 6, src: "/idle/habbo/video-spot.png", tile: [11, 1], dx: 0, dy: -20, z: 4 },
  { id: "playback", level: 8, src: "/idle/habbo/playback.png", tile: [14, 1], dx: 0, dy: -18, z: 3 },
  { id: "tripod", level: 10, src: "/idle/habbo/tripod.png", tile: [14, 2], dx: 0, dy: 0, z: 4 },
  { id: "leon", level: 12, src: "/idle/habbo/leon-poster.png", tile: [12, 1], dx: 28, dy: -46, z: 2 },
  { id: "slate", level: 14, src: "/idle/habbo/slate.png", tile: [12, 2], dx: 0, dy: 0, z: 4 },
  { id: "edit-chair", level: 16, src: "/idle/habbo/edit-chair.png", tile: [12, 3], dx: 0, dy: 0, z: 4 },
  { id: "drives", level: 18, src: "/idle/habbo/drives.png", tile: [11, 2], dx: 0, dy: 0, z: 3 },
  { id: "cans", level: 20, src: "/idle/habbo/phones.png", tile: [11, 3], dx: 0, dy: -6, z: 4 },
  { id: "board-video", level: 22, src: "/idle/habbo/storyboard.png", tile: [11, 1], dx: 22, dy: -36, z: 2 },
  { id: "softbox", level: 24, src: "/idle/habbo/softbox.png", tile: [14, 3], dx: 0, dy: -8, z: 4 },
  { id: "boom", level: 26, src: "/idle/habbo/boom.png", tile: [13, 3], dx: 0, dy: -16, z: 5 },
  { id: "cards", level: 28, src: "/idle/habbo/cards.png", tile: [12, 4], dx: 0, dy: 0, z: 3 },
  { id: "video-neon", level: 30, src: "/idle/habbo/neon-video.png", tile: [13, 1], dx: 0, dy: -48, z: 4 },
  { id: "director", level: 32, src: "/idle/habbo/director.png", tile: [13, 4], dx: 0, dy: 0, z: 4 },
  { id: "cam-bag", level: 34, src: "/idle/habbo/cam-bag.png", tile: [14, 4], dx: 0, dy: 0, z: 3 },
  { id: "lenses", level: 36, src: "/idle/habbo/lenses.png", tile: [14, 1], dx: 22, dy: -8, z: 4 },
  { id: "bounce", level: 38, src: "/idle/habbo/bounce.png", tile: [11, 3], dx: 16, dy: 4, z: 4 },
  { id: "flight", level: 40, src: "/idle/habbo/flight.png", tile: [12, 4], dx: 16, dy: 0, z: 4 },
  { id: "script", level: 42, src: "/idle/habbo/script.png", tile: [12, 2], dx: 16, dy: 6, z: 5 },
  { id: "rec-light", level: 44, src: "/idle/habbo/rec-light.png", tile: [14, 2], dx: 8, dy: -28, z: 5 },
  { id: "grade", level: 46, src: "/idle/habbo/grade.png", tile: [13, 4], dx: -18, dy: 2, z: 4 },
  { id: "tape-shelf", level: 48, src: "/idle/habbo/tape-shelf.png", tile: [14, 4], dx: 14, dy: -16, z: 3 },
  { id: "teleprompter", level: 50, src: "/idle/habbo/teleprompter.png", tile: [13, 2], dx: 18, dy: 4, z: 5 },
  { id: "cables", level: 52, src: "/idle/habbo/cables.png", tile: [14, 3], dx: 14, dy: 6, z: 3 },
  { id: "gels", level: 54, src: "/idle/habbo/gels.png", tile: [11, 4], dx: 14, dy: 4, z: 4 },
  { id: "monitor-2", level: 56, src: "/idle/habbo/monitor-2.png", tile: [14, 1], dx: -18, dy: -8, z: 3 },
  { id: "shoot-photo", level: 58, src: "/idle/habbo/shoot-photo.png", tile: [11, 2], dx: 16, dy: 4, z: 4 },
  { id: "video-ready", level: 60, src: "/idle/habbo/video-ready.png", tile: [13, 3], dx: 0, dy: -36, z: 6 },
]

const VIDEO_NAMES: Record<number, string> = {
  2: "Mesa de edición",
  4: "Cámara",
  6: "Foco",
  8: "Pantalla",
  10: "Trípode",
  12: "Cartel de Léon",
  14: "Claqueta",
  16: "Silla de edición",
  18: "Discos duros",
  20: "Cascos",
  22: "Storyboard",
  24: "Softbox",
  26: "Micro de caña",
  28: "Tarjetas",
  30: "Neón Red Flame",
  32: "Silla de director",
  34: "Bolsa de cámara",
  36: "Objetivos",
  38: "Reflector",
  40: "Cajas de vuelo",
  42: "Guion",
  44: "Luz roja",
  46: "Mesa de color",
  48: "Estantería de cintas",
  50: "Teleprompter",
  52: "Cables",
  54: "Geles",
  56: "Segundo monitor",
  58: "Foto del rodaje",
  60: "Medalla",
}

export function videoSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Sala vacía", srcs: [] }
  const props = VIDEO_PROPS.filter((prop) => prop.level === level)
  if (!props.length) return null
  return { name: VIDEO_NAMES[level] ?? "Pieza", srcs: props.map((prop) => prop.src) }
}
