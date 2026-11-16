export const SALA_PROPS: Array<{
  id: string
  level: number
  name: string
  src: string
  tile: [number, number]
  dx: number
  dy: number
  z: number
}> = [
  { id: "sala-sofa", level: 2, name: "Sofá", src: "/idle/habbo/sala-sofa.png", tile: [11, 8], dx: 0, dy: 0, z: 4 },
  { id: "sala-floor", level: 4, name: "Pista", src: "/idle/habbo/sala-floor.png", tile: [13, 8], dx: 0, dy: 4, z: 2 },
  { id: "sala-console", level: 6, name: "Consola", src: "/idle/habbo/sala-console.png", tile: [14, 9], dx: 0, dy: 0, z: 4 },
  { id: "sala-pouf", level: 8, name: "Puff", src: "/idle/habbo/sala-pouf.png", tile: [12, 9], dx: 0, dy: 0, z: 4 },
  { id: "sala-ball", level: 10, name: "Bola de disco", src: "/idle/habbo/sala-ball.png", tile: [13, 7], dx: 0, dy: -18, z: 6 },
]

export function salaSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Sala vacía", srcs: [] }
  const prop = SALA_PROPS.find((item) => item.level === level)
  if (!prop) return null
  return { name: prop.name, srcs: [prop.src] }
}
