/** Piezas de Música. Entran en los niveles pares. Los impares no añaden objeto. */

export type MusicBeat = {
  level: number
  seen: string
  idea: string
}

export const MUSIC_BEATS: MusicBeat[] = [
  { level: 2, seen: "Ordenador mejor y lámpara", idea: "el ordenador mejora y aparece la lámpara" },
  { level: 4, seen: "Micro y cascos", idea: "se ponen el micro y los cascos" },
  { level: 6, seen: "Monitores y ON AIR", idea: "entran los monitores y se enciende el ON AIR" },
  { level: 8, seen: "Filtro en el micro", idea: "el micro gana el filtro" },
  { level: 10, seen: "Mesa de mezclas", idea: "entra la mesa de mezclas" },
  { level: 12, seen: "Espuma en la pared", idea: "la pared se cubre de espuma" },
  { level: 14, seen: "Estantería de vinilos", idea: "aparece la estantería de vinilos" },
  { level: 16, seen: "Sofá para escuchar", idea: "entra el sofá para escuchar la toma" },
  { level: 18, seen: "Neón danzcollective", idea: "se enciende el neón rojo de danzcollective" },
  { level: 20, seen: "Caja de ritmos", idea: "entra la caja de ritmos" },
  { level: 22, seen: "Segundo micro", idea: "se pone el segundo micro" },
  { level: 24, seen: "Disco de oro", idea: "cuelgan el disco de oro" },
  { level: 26, seen: "Planta", idea: "aparece la planta" },
  { level: 28, seen: "Foco de techo", idea: "se enciende el foco de techo" },
  { level: 30, seen: "Placa de máster", idea: "la sala cuelga la placa de máster" },
  { level: 32, seen: "Atril con la letra", idea: "entra el atril con la letra" },
  { level: 34, seen: "Caja de cintas", idea: "aparece la caja de cintas" },
  { level: 36, seen: "Alfombra gruesa", idea: "el suelo gana la alfombra gruesa" },
  { level: 38, seen: "Perchero", idea: "entra el perchero" },
  { level: 40, seen: "Taburete del segundo micro", idea: "se pone el taburete del segundo micro" },
  { level: 42, seen: "Cartel del presskit", idea: "cuelgan el cartel de Danz Collective" },
  { level: 44, seen: "Persiana", idea: "baja la persiana" },
  { level: 46, seen: "Regleta", idea: "los cables se recogen en la regleta" },
  { level: 48, seen: "Pizarra del setlist", idea: "entra la pizarra del setlist" },
  { level: 50, seen: "Cajón de vinilos", idea: "aparece el cajón de vinilos" },
  { level: 52, seen: "Luz roja en la puerta", idea: "se enciende la luz roja de la puerta" },
  { level: 54, seen: "Mesa de agua", idea: "entra la mesa de agua y tazas" },
  { level: 56, seen: "Cristal de cabina", idea: "la cabina se cierra con cristal" },
  { level: 58, seen: "Disco de plata", idea: "cuelgan el disco de plata" },
  { level: 60, seen: "Sala lista", idea: "la sala cuelga el cartel de sala lista" },
]

export function musicSeen(level: number) {
  const hit = [...MUSIC_BEATS].reverse().find((beat) => level >= beat.level)
  return hit?.seen ?? "Puesto pelado"
}

export function musicSoon(level: number) {
  const next = MUSIC_BEATS.find((beat) => beat.level > level)
  return next ? `Al ${next.level}, ${next.idea}.` : ""
}

export function musicIdea(level: number) {
  const next = MUSIC_BEATS.find((beat) => beat.level > level)
  return next ? `Idea: al ${next.level} ${next.idea}.` : null
}

export function musicSheet(level: number): { name: string; srcs: string[] } | null {
  if (level === 1) return { name: "Puesto pelado", srcs: ["/idle/habbo/desk.png", "/idle/habbo/chair.png"] }
  const beat = MUSIC_BEATS.find((item) => item.level === level)
  if (!beat) return null
  return { name: beat.seen, srcs: MUSIC_PROPS.filter((prop) => prop.level === level).map((prop) => prop.src) }
}

export const MUSIC_PROPS: Array<{
  id: string
  level: number
  src: string
  anchor: "desk" | "chair" | "tile"
  tile?: [number, number]
  dx: number
  dy: number
  z: number
  glow?: boolean
}> = [
  { id: "lamp", level: 2, src: "/idle/habbo/lamp.png", anchor: "desk", dx: -34, dy: -8, z: 4 },
  { id: "mic", level: 4, src: "/idle/habbo/mic.png", anchor: "chair", dx: 36, dy: -6, z: 6 },
  { id: "phones", level: 4, src: "/idle/habbo/phones.png", anchor: "desk", dx: 28, dy: -36, z: 4 },
  { id: "speaker-l", level: 6, src: "/idle/habbo/speaker.png", anchor: "desk", dx: -18, dy: 18, z: 4 },
  { id: "speaker-r", level: 6, src: "/idle/habbo/speaker.png", anchor: "desk", dx: 22, dy: 8, z: 4 },
  { id: "onair", level: 6, src: "/idle/habbo/onair.png", anchor: "desk", dx: -6, dy: -52, z: 4 },
  { id: "pop", level: 8, src: "/idle/habbo/pop.png", anchor: "chair", dx: 22, dy: -28, z: 6 },
  { id: "mixer", level: 10, src: "/idle/habbo/mixer.png", anchor: "desk", dx: 10, dy: 24, z: 4 },
  { id: "foam", level: 12, src: "/idle/habbo/foam.png", anchor: "desk", dx: -4, dy: -70, z: 2 },
  { id: "shelf", level: 14, src: "/idle/habbo/shelf.png", anchor: "tile", tile: [1, 2], dx: 0, dy: -6, z: 3 },
  { id: "sofa", level: 16, src: "/idle/habbo/sofa.png", anchor: "tile", tile: [1, 4], dx: 0, dy: 0, z: 3 },
  { id: "neon", level: 18, src: "/idle/habbo/neon-danz.png", anchor: "desk", dx: 48, dy: -74, z: 4, glow: true },
  { id: "beat", level: 20, src: "/idle/habbo/beatbox.png", anchor: "tile", tile: [4, 2], dx: 0, dy: 0, z: 3 },
  { id: "mic2", level: 22, src: "/idle/habbo/mic2.png", anchor: "tile", tile: [4, 3], dx: -8, dy: -4, z: 4 },
  { id: "gold", level: 24, src: "/idle/habbo/gold.png", anchor: "desk", dx: -52, dy: -66, z: 2 },
  { id: "plant", level: 26, src: "/idle/habbo/plant.png", anchor: "tile", tile: [4, 4], dx: 0, dy: 0, z: 3 },
  { id: "spot", level: 28, src: "/idle/habbo/spot.png", anchor: "desk", dx: 8, dy: -96, z: 2 },
  { id: "master", level: 30, src: "/idle/habbo/master.png", anchor: "tile", tile: [1, 1], dx: 6, dy: -20, z: 2 },
  { id: "stand", level: 32, src: "/idle/habbo/stand.png", anchor: "tile", tile: [2, 3], dx: 0, dy: 0, z: 4 },
  { id: "tapes", level: 34, src: "/idle/habbo/tapes.png", anchor: "tile", tile: [1, 3], dx: 0, dy: 0, z: 3 },
  { id: "rug", level: 36, src: "/idle/habbo/rug.png", anchor: "tile", tile: [3, 3], dx: 0, dy: 8, z: 1 },
  { id: "rack", level: 38, src: "/idle/habbo/coatrack.png", anchor: "tile", tile: [4, 1], dx: 0, dy: -8, z: 3 },
  { id: "stool", level: 40, src: "/idle/habbo/stool.png", anchor: "tile", tile: [3, 3], dx: 16, dy: -4, z: 3 },
  { id: "poster", level: 42, src: "/idle/habbo/poster.png", anchor: "tile", tile: [3, 1], dx: 0, dy: -28, z: 2 },
  { id: "blind", level: 44, src: "/idle/habbo/blind.png", anchor: "desk", dx: -62, dy: -88, z: 2 },
  { id: "strip", level: 46, src: "/idle/habbo/strip.png", anchor: "tile", tile: [2, 2], dx: 8, dy: 6, z: 2 },
  { id: "board", level: 48, src: "/idle/habbo/board.png", anchor: "tile", tile: [4, 1], dx: 8, dy: -36, z: 2 },
  { id: "crate", level: 50, src: "/idle/habbo/crate-vinyl.png", anchor: "tile", tile: [2, 4], dx: 0, dy: 0, z: 3 },
  { id: "doorlight", level: 52, src: "/idle/habbo/doorlight.png", anchor: "tile", tile: [5, 2], dx: 0, dy: -22, z: 4, glow: true },
  { id: "drinks", level: 54, src: "/idle/habbo/drinks.png", anchor: "tile", tile: [3, 4], dx: 18, dy: 4, z: 3 },
  { id: "glass", level: 56, src: "/idle/habbo/glass.png", anchor: "chair", dx: 8, dy: -18, z: 4 },
  { id: "silver", level: 58, src: "/idle/habbo/silver.png", anchor: "desk", dx: -28, dy: -48, z: 2 },
  { id: "ready", level: 60, src: "/idle/habbo/ready.png", anchor: "tile", tile: [5, 3], dx: 0, dy: -18, z: 4 },
]
