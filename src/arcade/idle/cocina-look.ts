export const COCINA_PROPS: Array<{
  id: string
  level: number
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "kit-micro", level: 2, src: "/idle/habbo/kit-micro.png", tile: [1, 7], dx: 0, dy: -6, z: 4 },
  { id: "kit-mugs", level: 4, src: "/idle/habbo/kit-mugs.png", tile: [3, 7], dx: 0, dy: 0, z: 4 },
  { id: "kit-coffee", level: 6, src: "/idle/habbo/kit-coffee.png", tile: [1, 8], dx: 0, dy: -4, z: 4 },
  { id: "kit-table", level: 8, src: "/idle/habbo/kit-table.png", tile: [3, 8], dx: 0, dy: 0, z: 3 },
]

export const MUG_SETS = ["/idle/habbo/kit-mugs.png", "/idle/habbo/kit-mugs-b.png", "/idle/habbo/kit-mugs-c.png"]

export function cocinaSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Rincón vacío", srcs: [] }
  const props = COCINA_PROPS.filter((prop) => prop.level === level)
  if (!props.length) return null
  const srcs = props.flatMap((prop) => (prop.id === "kit-mugs" ? [...MUG_SETS] : [prop.src]))
  const name = props[0]?.id === "kit-mugs" ? "Tazas, tres juegos" : props[0]?.id === "kit-micro" ? "Microondas" : props[0]?.id === "kit-coffee" ? "Cafetera" : "Mesa"
  return { name, srcs }
}
