export const SELLO_PROPS: Array<{
  id: string
  level: number
  name: string
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "sello-desk", level: 2, name: "Mesa de contratos", src: "/idle/habbo/sello-desk.png", tile: [8, 9], dx: 0, dy: 0, z: 4 },
  { id: "sello-phone", level: 4, name: "Teléfono", src: "/idle/habbo/sello-phone.png", tile: [8, 9], dx: 22, dy: 4, z: 5 },
  { id: "sello-stamp", level: 6, name: "Tampón", src: "/idle/habbo/sello-stamp.png", tile: [7, 10], dx: 0, dy: 0, z: 4 },
  { id: "sello-flex", level: 8, name: "Flexo", src: "/idle/habbo/sello-flex.png", tile: [7, 9], dx: 0, dy: -8, z: 5 },
  { id: "sello-wall", level: 10, name: "Pared de discos", src: "/idle/habbo/sello-wall.png", tile: [7, 8], dx: 0, dy: -8, z: 3 },
  { id: "sello-deck", level: 12, name: "Tocadiscos", src: "/idle/habbo/sello-deck.png", tile: [7, 11], dx: 0, dy: 0, z: 4 },
  { id: "sello-cal", level: 14, name: "Calendario de lanzamientos", src: "/idle/habbo/sello-cal.png", tile: [8, 8], dx: 0, dy: -18, z: 3 },
  { id: "sello-frame", level: 16, name: "Contrato", src: "/idle/habbo/sello-frame.png", tile: [6, 8], dx: 0, dy: -16, z: 3 },
  { id: "sello-sofa", level: 18, name: "Sofá de audiciones", src: "/idle/habbo/sello-sofa.png", tile: [6, 12], dx: 0, dy: 0, z: 4 },
  { id: "sello-neon", level: 20, name: "Neón del sello", src: "/idle/habbo/sello-neon.png", tile: [9, 8], dx: 0, dy: -18, z: 5 },
  { id: "sello-gram", level: 22, name: "Gramófono", src: "/idle/habbo/sello-gram.png", tile: [9, 9], dx: 0, dy: 0, z: 4 },
  { id: "sello-lamp", level: 24, name: "Lámpara de pie", src: "/idle/habbo/sello-lamp.png", tile: [9, 11], dx: 0, dy: -10, z: 5 },
  { id: "sello-award", level: 26, name: "Premio del sello", src: "/idle/habbo/sello-award.png", tile: [8, 12], dx: 0, dy: -4, z: 4 },
  { id: "sello-press", level: 28, name: "Prensa", src: "/idle/habbo/sello-press.png", tile: [6, 9], dx: 0, dy: 0, z: 4 },
  { id: "sello-crate", level: 30, name: "Caja de lanzamientos", src: "/idle/habbo/sello-crate.png", tile: [9, 10], dx: 0, dy: 0, z: 4 },
  { id: "sello-singles", level: 32, name: "Estantería de singles", src: "/idle/habbo/sello-singles.png", tile: [6, 10], dx: 0, dy: -6, z: 4 },
  { id: "sello-mail", level: 34, name: "Sobres y sellos", src: "/idle/habbo/sello-mail.png", tile: [8, 11], dx: 0, dy: 0, z: 4 },
  { id: "sello-gigs", level: 36, name: "Calendario de bolos", src: "/idle/habbo/sello-gigs.png", tile: [7, 12], dx: 0, dy: -16, z: 3 },
  { id: "sello-safe", level: 38, name: "Caja fuerte", src: "/idle/habbo/sello-safe.png", tile: [9, 12], dx: 0, dy: 0, z: 4 },
  { id: "sello-staff", level: 40, name: "Foto de la plantilla", src: "/idle/habbo/sello-staff.png", tile: [8, 12], dx: 16, dy: -28, z: 3 },
  { id: "sello-meet", level: 42, name: "Mesa de reuniones", src: "/idle/habbo/sello-meet.png", tile: [8, 10], dx: 24, dy: 6, z: 4 },
  { id: "sello-clock", level: 44, name: "Reloj de pared", src: "/idle/habbo/sello-clock.png", tile: [7, 8], dx: 22, dy: -22, z: 3 },
  { id: "sello-presser", level: 46, name: "Prensa de vinilo", src: "/idle/habbo/sello-presser.png", tile: [9, 10], dx: 22, dy: -4, z: 5 },
  { id: "sello-masters", level: 48, name: "Estantería de másters", src: "/idle/habbo/sello-masters.png", tile: [6, 10], dx: 22, dy: -18, z: 3 },
  { id: "sello-busy", level: 50, name: "Luz de ocupado", src: "/idle/habbo/sello-busy.png", tile: [8, 7], dx: 0, dy: -22, z: 6 },
  { id: "sello-chair", level: 52, name: "Segunda silla", src: "/idle/habbo/sello-chair.png", tile: [9, 11], dx: 18, dy: 8, z: 4 },
  { id: "sello-rug", level: 54, name: "Alfombra", src: "/idle/habbo/sello-rug.png", tile: [8, 10], dx: 0, dy: 8, z: 1 },
  { id: "sello-glass", level: 56, name: "Cristal de oficina", src: "/idle/habbo/sello-glass.png", tile: [8, 9], dx: -28, dy: -8, z: 5 },
  { id: "sello-diamond", level: 58, name: "Disco de diamante", src: "/idle/habbo/sello-diamond.png", tile: [9, 8], dx: 22, dy: -8, z: 3 },
  { id: "sello-plaque", level: 60, name: "Placa de León y Tomy", src: "/idle/habbo/sello-plaque.png", tile: [7, 8], dx: -8, dy: -28, z: 4 },
]

export function selloSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Oficina vacía", srcs: [] }
  const prop = SELLO_PROPS.find((item) => item.level === level)
  if (!prop) return null
  return { name: prop.name, srcs: [prop.src] }
}
