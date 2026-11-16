export const PRINT_PROPS: Array<{
  id: string
  level: number
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "p3-printer", level: 2, src: "/idle/habbo/p3-printer.png", tile: [17, 1], dx: 0, dy: 0, z: 4 },
  { id: "p3-spools", level: 4, src: "/idle/habbo/p3-spools.png", tile: [18, 2], dx: 0, dy: 0, z: 3 },
  { id: "p3-bed", level: 6, src: "/idle/habbo/p3-bed.png", tile: [16, 2], dx: 0, dy: 0, z: 3 },
  { id: "p3-screen", level: 8, src: "/idle/habbo/p3-screen.png", tile: [19, 2], dx: 0, dy: -8, z: 4 },
  { id: "p3-scraper", level: 10, src: "/idle/habbo/p3-scraper.png", tile: [19, 1], dx: 0, dy: 0, z: 4 },
  { id: "p3-tweezers", level: 12, src: "/idle/habbo/p3-tweezers.png", tile: [16, 3], dx: 0, dy: 0, z: 4 },
  { id: "p3-caliper", level: 14, src: "/idle/habbo/p3-caliper.png", tile: [17, 3], dx: 0, dy: 0, z: 4 },
  { id: "p3-lamp", level: 16, src: "/idle/habbo/p3-lamp.png", tile: [17, 2], dx: 8, dy: -20, z: 5 },
  { id: "p3-shelf", level: 18, src: "/idle/habbo/p3-shelf.png", tile: [16, 1], dx: 0, dy: -8, z: 3 },
  { id: "p3-part", level: 20, src: "/idle/habbo/p3-part.png", tile: [18, 1], dx: 0, dy: 0, z: 4 },
  { id: "p3-box", level: 22, src: "/idle/habbo/p3-box.png", tile: [19, 3], dx: 0, dy: 0, z: 3 },
  { id: "p3-crate", level: 24, src: "/idle/habbo/p3-crate.png", tile: [18, 4], dx: 0, dy: 0, z: 3 },
  { id: "p3-pliers", level: 26, src: "/idle/habbo/p3-pliers.png", tile: [19, 4], dx: 0, dy: 0, z: 4 },
  { id: "p3-allen", level: 28, src: "/idle/habbo/p3-allen.png", tile: [16, 4], dx: 0, dy: 0, z: 4 },
  { id: "p3-gloves", level: 30, src: "/idle/habbo/p3-gloves.png", tile: [17, 4], dx: 0, dy: 0, z: 4 },
  { id: "p3-sand", level: 32, src: "/idle/habbo/p3-sand.png", tile: [18, 3], dx: 10, dy: 4, z: 4 },
  { id: "p3-paper", level: 34, src: "/idle/habbo/p3-paper.png", tile: [19, 3], dx: 12, dy: 6, z: 5 },
  { id: "p3-paint", level: 36, src: "/idle/habbo/p3-paint.png", tile: [16, 2], dx: 16, dy: 4, z: 4 },
  { id: "p3-brushes", level: 38, src: "/idle/habbo/p3-brushes.png", tile: [17, 1], dx: 14, dy: 4, z: 5 },
  { id: "p3-uv", level: 40, src: "/idle/habbo/p3-uv.png", tile: [18, 1], dx: 16, dy: -6, z: 5 },
  { id: "p3-glasses", level: 42, src: "/idle/habbo/p3-glasses.png", tile: [19, 2], dx: 14, dy: 8, z: 5 },
  { id: "p3-stool", level: 44, src: "/idle/habbo/p3-stool.png", tile: [18, 3], dx: -14, dy: 8, z: 3 },
  { id: "p3-tape", level: 46, src: "/idle/habbo/p3-tape.png", tile: [16, 3], dx: 14, dy: 6, z: 5 },
  { id: "p3-ship", level: 48, src: "/idle/habbo/p3-ship.png", tile: [17, 4], dx: 14, dy: 4, z: 4 },
  { id: "p3-labels", level: 50, src: "/idle/habbo/p3-labels.png", tile: [16, 3], dx: -8, dy: 10, z: 5 },
  { id: "p3-bigspool", level: 52, src: "/idle/habbo/p3-bigspool.png", tile: [19, 4], dx: 12, dy: -4, z: 4 },
  { id: "p3-finish", level: 54, src: "/idle/habbo/p3-finish.png", tile: [16, 4], dx: 12, dy: -8, z: 3 },
  { id: "p3-nozzles", level: 56, src: "/idle/habbo/p3-nozzles.png", tile: [19, 1], dx: 12, dy: 6, z: 5 },
  { id: "p3-photo", level: 58, src: "/idle/habbo/p3-photo.png", tile: [18, 1], dx: -16, dy: -16, z: 2 },
  { id: "p3-ready", level: 60, src: "/idle/habbo/p3-ready.png", tile: [18, 3], dx: 0, dy: -28, z: 6 },
]

const PRINT_NAMES: Record<number, string> = {
  2: "Impresora",
  4: "Bobinas",
  6: "Cama de impresión",
  8: "Pantalla",
  10: "Rascador",
  12: "Pinzas",
  14: "Calibre",
  16: "Lámpara",
  18: "Estantería de bobinas",
  20: "Pieza impresa",
  22: "Caja cerrada",
  24: "Caja de piezas",
  26: "Alicates",
  28: "Llaves allen",
  30: "Guantes",
  32: "Tabla de lijar",
  34: "Lijas",
  36: "Botes de pintura",
  38: "Pinceles",
  40: "Lámpara UV",
  42: "Gafas",
  44: "Banqueta",
  46: "Cinta de carrocero",
  48: "Caja para enviar",
  50: "Etiquetas",
  52: "Bobina grande",
  54: "Estante de acabados",
  56: "Boquillas",
  58: "Foto de la pieza",
  60: "Medalla",
}

export function printSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Sala vacía", srcs: [] }
  const props = PRINT_PROPS.filter((prop) => prop.level === level)
  if (!props.length) return null
  return { name: PRINT_NAMES[level] ?? "Pieza", srcs: props.map((prop) => prop.src) }
}
