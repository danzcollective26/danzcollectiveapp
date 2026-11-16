/** Piezas de Moda. Entran en los niveles pares. */

export const FASHION_PROPS: Array<{
  id: string
  level: number
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "cut-table", level: 2, src: "/idle/habbo/cut-table.png", tile: [7, 1], dx: 0, dy: 0, z: 3 },
  { id: "mannequin", level: 4, src: "/idle/habbo/mannequin.png", tile: [8, 2], dx: 0, dy: -4, z: 4 },
  { id: "rolls", level: 6, src: "/idle/habbo/rolls.png", tile: [6, 2], dx: 0, dy: 0, z: 3 },
  { id: "sewer", level: 8, src: "/idle/habbo/sewer.png", tile: [9, 2], dx: 0, dy: 0, z: 3 },
  { id: "mirror", level: 10, src: "/idle/habbo/mirror.png", tile: [9, 1], dx: 0, dy: -16, z: 2 },
  { id: "moda-neon", level: 12, src: "/idle/habbo/neon-moda.png", tile: [7, 1], dx: 8, dy: -52, z: 4 },
  { id: "rack", level: 14, src: "/idle/habbo/cloth-rack.png", tile: [6, 3], dx: 0, dy: 0, z: 4 },
  { id: "shirts", level: 16, src: "/idle/habbo/shirts.png", tile: [7, 3], dx: 0, dy: 0, z: 3 },
  { id: "iron", level: 18, src: "/idle/habbo/iron.png", tile: [7, 2], dx: 6, dy: 0, z: 4 },
  { id: "poster-moda", level: 20, src: "/idle/habbo/poster-moda.png", tile: [6, 1], dx: 0, dy: -28, z: 2 },
  { id: "lamp-moda", level: 22, src: "/idle/habbo/lamp.png", tile: [8, 1], dx: 0, dy: -8, z: 3 },
  { id: "dtf", level: 24, src: "/idle/habbo/dtf.png", tile: [9, 3], dx: 0, dy: 0, z: 4 },
  { id: "film", level: 26, src: "/idle/habbo/film.png", tile: [8, 4], dx: 0, dy: 0, z: 3 },
  { id: "transfers", level: 28, src: "/idle/habbo/transfers.png", tile: [9, 4], dx: 0, dy: 0, z: 3 },
  { id: "gloves", level: 30, src: "/idle/habbo/gloves.png", tile: [9, 3], dx: -18, dy: -6, z: 5 },
  { id: "shelf-moda", level: 32, src: "/idle/habbo/shelf-moda.png", tile: [6, 4], dx: 0, dy: -10, z: 3 },
  { id: "press-light", level: 34, src: "/idle/habbo/press-light.png", tile: [9, 3], dx: 8, dy: -36, z: 5 },
  { id: "scraps", level: 36, src: "/idle/habbo/scraps.png", tile: [7, 4], dx: 0, dy: 0, z: 3 },
  { id: "tote", level: 38, src: "/idle/habbo/tote.png", tile: [8, 3], dx: -16, dy: 0, z: 3 },
  { id: "sizes", level: 40, src: "/idle/habbo/sizes.png", tile: [8, 1], dx: 18, dy: -30, z: 2 },
  { id: "threads", level: 42, src: "/idle/habbo/threads.png", tile: [6, 2], dx: 16, dy: 4, z: 4 },
  { id: "stool-moda", level: 44, src: "/idle/habbo/stool.png", tile: [8, 3], dx: 16, dy: 4, z: 3 },
  { id: "fit-light", level: 46, src: "/idle/habbo/fit-light.png", tile: [8, 2], dx: 0, dy: -40, z: 5 },
  { id: "ship-box", level: 48, src: "/idle/habbo/ship-box.png", tile: [6, 3], dx: 18, dy: 6, z: 4 },
  { id: "tape", level: 50, src: "/idle/habbo/tape.png", tile: [7, 4], dx: 18, dy: 2, z: 4 },
  { id: "labels", level: 52, src: "/idle/habbo/labels.png", tile: [6, 3], dx: -12, dy: 10, z: 5 },
  { id: "mannequin-2", level: 54, src: "/idle/habbo/mannequin.png", tile: [9, 4], dx: 8, dy: -4, z: 4 },
  { id: "curtain", level: 56, src: "/idle/habbo/curtain.png", tile: [9, 1], dx: 16, dy: -20, z: 2 },
  { id: "lookbook", level: 58, src: "/idle/habbo/lookbook.png", tile: [8, 1], dx: -22, dy: -36, z: 2 },
  { id: "moda-ready", level: 60, src: "/idle/habbo/moda-ready.png", tile: [8, 3], dx: 0, dy: -34, z: 6 },
]

const FASHION_NAMES: Record<number, string> = {
  2: "Mesa de corte",
  4: "Maniquí",
  6: "Rollos de tela",
  8: "Máquina de coser",
  10: "Espejo",
  12: "Neón DANZFLOR",
  14: "Burro",
  16: "Pila de camisetas",
  18: "Plancha",
  20: "Cartel de la colección",
  22: "Lámpara",
  24: "Plancha de DTF",
  26: "Rollo de film",
  28: "Transfers",
  30: "Guantes de calor",
  32: "Estantería",
  34: "Foco de la plancha",
  36: "Cesto de retales",
  38: "Bolsa de tela",
  40: "Cartel de tallas",
  42: "Cajón de hilos",
  44: "Banqueta",
  46: "Luz del probador",
  48: "Caja para enviar",
  50: "Cinta de embalar",
  52: "Etiquetas DANZ",
  54: "Segundo maniquí",
  56: "Cortina del probador",
  58: "Foto de la colección",
  60: "Medalla",
}

export function fashionSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Sala vacía", srcs: [] }
  const props = FASHION_PROPS.filter((prop) => prop.level === level)
  if (!props.length) return null
  return { name: FASHION_NAMES[level] ?? "Pieza", srcs: props.map((prop) => prop.src) }
}
