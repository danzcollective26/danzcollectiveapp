export const TW = 108
export const TH = 54
export const WORLD_W = 1760
export const WORLD_H = 1180
export const VIEW_SCALE = 1

const OX = 640
const OY = 140

export type Tile = { tx: number; ty: number }

export type RoomId = "music" | "fashion" | "video" | "print" | "cocina" | "sala" | "sello" | "seguridad" | "bano"

type RoomDef = {
  id: RoomId
  x0: number
  y0: number
  x1: number
  y1: number
  floor: number
  wall: number
}

/** Cada sala tiene su rectángulo. Se puede agrandar sin tocar a las demás. */
export const ROOM_DEFS: RoomDef[] = [
  { id: "music", x0: 1, y0: 1, x1: 4, y1: 6, floor: 0, wall: 0 },
  { id: "fashion", x0: 6, y0: 1, x1: 9, y1: 6, floor: 1, wall: 1 },
  { id: "video", x0: 11, y0: 1, x1: 14, y1: 6, floor: 2, wall: 2 },
  { id: "print", x0: 16, y0: 1, x1: 19, y1: 6, floor: 3, wall: 3 },
  { id: "cocina", x0: 1, y0: 7, x1: 3, y1: 8, floor: 1, wall: 4 },
  { id: "sala", x0: 11, y0: 7, x1: 14, y1: 9, floor: 4, wall: 5 },
  { id: "sello", x0: 6, y0: 8, x1: 9, y1: 12, floor: 2, wall: 2 },
  { id: "seguridad", x0: 5, y0: 4, x1: 5, y1: 6, floor: 5, wall: 5 },
  { id: "bano", x0: 4, y0: 9, x1: 5, y1: 10, floor: 3, wall: 5 },
]

export const FLOOR_COLORS = ["#c9a36a", "#e6d3b0", "#8d6a45", "#7f9a90", "#3e4e78", "#d07a6a"]
export const WALL_COLORS = ["#6d4e9c", "#8d4d68", "#355a9a", "#3e6248", "#f3eee6", "#2c2c32"]
export const FLOOR_NAMES = ["Pino", "Baldosa clara", "Nogal", "Moqueta verde", "Baldosa azul", "Moqueta teja"]
export const WALL_NAMES = ["Morado", "Rosa", "Azul", "Verde", "Blanco", "Negro"]

const ROOMS: Array<[number, number, number, number]> = ROOM_DEFS.map((room) => [room.x0, room.y0, room.x1, room.y1])
const DOORS = new Set(["5,2", "5,3", "10,2", "10,3", "15,2", "15,3", "7,7", "8,7"])
const DOOR_OF: Record<string, RoomId> = {
  "5,2": "fashion",
  "5,3": "fashion",
  "10,2": "video",
  "10,3": "video",
  "15,2": "print",
  "15,3": "print",
  "7,7": "sello",
  "8,7": "sello",
}
/** Puerta visible. Cocina y Sala se cierran en el primer paso de la sala. */
export const ROOM_DOORS: Array<{ id: RoomId; tx: number; ty: number }> = [
  { id: "fashion", tx: 5, ty: 2 },
  { id: "video", tx: 10, ty: 2 },
  { id: "print", tx: 15, ty: 2 },
  { id: "sello", tx: 7, ty: 7 },
  { id: "cocina", tx: 2, ty: 7 },
  { id: "sala", tx: 12, ty: 7 },
  { id: "seguridad", tx: 5, ty: 4 },
]
/** Tabiques con puerta: el office queda separado de Música, salvo el hueco. */
const PARTITIONS = new Set(["1,7:back", "3,7:back", "11,7:back", "13,7:back", "14,7:back", "6,8:back", "7,8:back", "9,8:back"])
const BLOCKED = new Set(["2,1", "11,8", "1,5", "6,5", "11,5", "16,5", "6,11", "6,12", "4,9", "5,9", "4,10", "5,10"])
const CLOSED = new Set<RoomId>(["bano"])
let closedRooms = new Set<RoomId>(["bano"])

export function setClosedRooms(ids: string[]) {
  closedRooms = new Set<RoomId>(["bano", ...(ids.filter((id) => id !== "music" && id !== "envios") as RoomId[])])
}

const ANCHORS: Record<string, Tile> = {
  music: { tx: 3, ty: 3 },
  fashion: { tx: 8, ty: 3 },
  video: { tx: 13, ty: 3 },
  print: { tx: 18, ty: 3 },
  cocina: { tx: 2, ty: 7 },
  sala: { tx: 13, ty: 8 },
  sello: { tx: 8, ty: 10 },
  seguridad: { tx: 5, ty: 5 },
  envios: { tx: 1, ty: 6 },
}

const CHAIR: Tile = { tx: 3, ty: 2 }
const DESK: Tile = { tx: 2, ty: 1 }
const SPAWN_TILE: Tile = { tx: 3, ty: 4 }

export const ROOM_SIGNS: Array<{ id: string; name: string; tx: number; ty: number }> = [
  { id: "fashion", name: "Moda", tx: 5, ty: 2 },
  { id: "video", name: "Vídeo", tx: 10, ty: 2 },
  { id: "print", name: "Primos", tx: 15, ty: 2 },
  { id: "cocina", name: "Office", tx: 2, ty: 7 },
  { id: "sala", name: "Sala", tx: 12, ty: 7 },
  { id: "sello", name: "Sello", tx: 8, ty: 7 },
  { id: "seguridad", name: "Seguridad", tx: 5, ty: 6 },
  { id: "bano", name: "Baño", tx: 4, ty: 9 },
]

export function topOf(tx: number, ty: number) {
  return { x: OX + (tx - ty) * (TW / 2), y: OY + (tx + ty) * (TH / 2) }
}

export function frontOf(tx: number, ty: number) {
  const top = topOf(tx, ty)
  return { x: top.x, y: top.y + TH }
}

export function tileAt(x: number, y: number): Tile {
  const lx = x - OX
  const ly = y - OY - TH / 2
  return {
    tx: Math.round((lx / (TW / 2) + ly / (TH / 2)) / 2),
    ty: Math.round((ly / (TH / 2) - lx / (TW / 2)) / 2),
  }
}

export function roomAt(tile: Tile): RoomId | null {
  const room = ROOM_DEFS.find((entry) => tile.tx >= entry.x0 && tile.tx <= entry.x1 && tile.ty >= entry.y0 && tile.ty <= entry.y1)
  return room?.id ?? null
}

export function stationHome(id: string): RoomId | null {
  if (id === "envios") return "music"
  return ROOM_DEFS.some((room) => room.id === id) ? (id as RoomId) : null
}

export function onFloor(tile: Tile) {
  if (DOORS.has(`${tile.tx},${tile.ty}`)) return true
  return ROOMS.some(([x0, y0, x1, y1]) => tile.tx >= x0 && tile.tx <= x1 && tile.ty >= y0 && tile.ty <= y1)
}

export function walkable(tile: Tile) {
  const key = `${tile.tx},${tile.ty}`
  if (!onFloor(tile) || BLOCKED.has(key)) return false
  const door = DOOR_OF[key]
  if (door && closedRooms.has(door)) return false
  const room = roomAt(tile)
  if (room && closedRooms.has(room)) return false
  return true
}

export function canWalk(x: number, y: number) {
  return walkable(tileAt(x, y - TH / 2))
}

export const SPAWN = frontOf(SPAWN_TILE.tx, SPAWN_TILE.ty)
export const ROOM_FOCUS = frontOf(3, 3)

const chairFeet = frontOf(CHAIR.tx, CHAIR.ty)
const deskFeet = frontOf(DESK.tx, DESK.ty)

const fashionFeet = frontOf(8, 3)
const videoFeet = frontOf(13, 3)
const printFeet = frontOf(18, 3)
const selloFeet = frontOf(8, 10)

export const SEATS: Record<string, { x: number; y: number; pose: "sit" | "stand"; face: number; drawX?: number; drawY?: number }> = {
  music: { x: chairFeet.x, y: chairFeet.y, pose: "sit", face: 1, drawX: chairFeet.x + 4, drawY: chairFeet.y + 16 },
  fashion: { x: fashionFeet.x, y: fashionFeet.y, pose: "sit", face: -1, drawX: fashionFeet.x + 6, drawY: fashionFeet.y + 2 },
  video: { x: videoFeet.x, y: videoFeet.y, pose: "sit", face: -1, drawX: videoFeet.x + 6, drawY: videoFeet.y + 2 },
  print: { x: printFeet.x, y: printFeet.y, pose: "sit", face: -1, drawX: printFeet.x + 6, drawY: printFeet.y + 2 },
  cocina: { ...frontOf(2, 7), pose: "stand", face: -1 },
  sala: { ...frontOf(13, 8), pose: "stand", face: 1 },
  sello: { x: selloFeet.x, y: selloFeet.y, pose: "sit", face: -1, drawX: selloFeet.x + 6, drawY: selloFeet.y + 2 },
  seguridad: { ...frontOf(5, 5), pose: "stand", face: 1 },
  envios: { ...frontOf(1, 6), pose: "stand", face: 1 },
}

export function postAt(x: number, y: number, reach = 56): string | null {
  let best: string | null = null
  let nearest = reach
  for (const [id, seat] of Object.entries(SEATS)) {
    const dist = Math.hypot(seat.x - x, seat.y - y)
    if (dist < nearest) {
      nearest = dist
      best = id
    }
  }
  return best
}

export function anchorOf(id: string) {
  const tile = ANCHORS[id] ?? SPAWN_TILE
  return frontOf(tile.tx, tile.ty)
}

export const FURNITURE = {
  desk: { x: deskFeet.x - 36, y: deskFeet.y - 22, dy: -8 },
  chair: { ...chairFeet, dy: 6 },
}

export const SIDE_SEATS: Record<string, Tile> = {
  music: { tx: 4, ty: 5 },
  fashion: { tx: 9, ty: 4 },
  video: { tx: 14, ty: 4 },
  print: { tx: 19, ty: 4 },
  sello: { tx: 9, ty: 11 },
}

const DIRS: Tile[] = [
  { tx: 1, ty: 0 },
  { tx: -1, ty: 0 },
  { tx: 0, ty: 1 },
  { tx: 0, ty: -1 },
]

export function findPath(from: Tile, goal: Tile): Tile[] {
  const target = walkable(goal) ? goal : DIRS.map((dir) => ({ tx: goal.tx + dir.tx, ty: goal.ty + dir.ty })).find(walkable)
  if (!target || !walkable(from)) return []
  if (from.tx === target.tx && from.ty === target.ty) return [from]
  const key = (tile: Tile) => `${tile.tx},${tile.ty}`
  const queue: Tile[] = [from]
  const prev = new Map<string, string | null>([[key(from), null]])
  while (queue.length) {
    const current = queue.shift()!
    if (current.tx === target.tx && current.ty === target.ty) break
    for (const dir of DIRS) {
      const next = { tx: current.tx + dir.tx, ty: current.ty + dir.ty }
      const id = key(next)
      if (prev.has(id) || !walkable(next)) continue
      prev.set(id, key(current))
      queue.push(next)
    }
  }
  if (!prev.has(key(target))) return []
  const path: Tile[] = []
  let cursor: string | null = key(target)
  while (cursor) {
    const [tx, ty] = cursor.split(",").map(Number)
    path.push({ tx: tx!, ty: ty! })
    cursor = prev.get(cursor) ?? null
  }
  return path.reverse()
}

export function floorTiles() {
  return [] as Array<Tile & { wall: boolean; blocked: boolean }>
}

export type RoomStyle = { floor: number; wall: number }

const ROOM_KEY = "danz-idle-rooms-v1"

export function defaultRoomStyle(): Record<RoomId, RoomStyle> {
  return Object.fromEntries(ROOM_DEFS.map((room) => [room.id, { floor: room.floor, wall: room.wall }])) as Record<RoomId, RoomStyle>
}

export function loadRoomStyle(storage: Pick<Storage, "getItem">): Record<RoomId, RoomStyle> {
  const base = defaultRoomStyle()
  try {
    const raw = storage.getItem(ROOM_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<Record<RoomId, RoomStyle>>
    for (const room of ROOM_DEFS) {
      const next = parsed[room.id]
      if (!next) continue
      if (Number.isInteger(next.floor) && next.floor >= 0 && next.floor < FLOOR_COLORS.length) base[room.id].floor = next.floor
      if (Number.isInteger(next.wall) && next.wall >= 0 && next.wall < WALL_COLORS.length) base[room.id].wall = next.wall
    }
  } catch {
    /* se queda el de serie */
  }
  return base
}

export function saveRoomStyle(storage: Pick<Storage, "setItem">, style: Record<RoomId, RoomStyle>) {
  storage.setItem(ROOM_KEY, JSON.stringify(style))
}

function shift(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (shiftBy: number) => Math.max(0, Math.min(255, ((n >> shiftBy) & 255) + amount))
  const r = channel(16)
  const g = channel(8)
  const b = channel(0)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export type RoomPoly = { id: string; points: string; fill: string }

export function roomPolys(style: Record<RoomId, RoomStyle>): { floors: RoomPoly[]; walls: RoomPoly[]; trim: RoomPoly[] } {
  const floors: RoomPoly[] = []
  const walls: RoomPoly[] = []
  const trim: RoomPoly[] = []
  const height = 96
  const hw = TW / 2
  const hh = TH / 2
  const paintFloor = (id: string, tx: number, ty: number, floor: string, pattern: number) => {
    const top = topOf(tx, ty)
    const x = top.x
    const y = top.y
    const diamond = `${x},${y} ${x + hw},${y + hh} ${x},${y + TH} ${x - hw},${y + hh}`
    const checker = pattern === 1
    floors.push({ id, points: diamond, fill: checker && (tx + ty) % 2 === 1 ? shift(floor, -16) : floor })
    const band = (v: number, thick: number, fill: string, name: string) => {
      const clamped = Math.max(0.12, Math.min(0.88, v))
      const half = clamped <= 0.5 ? (clamped / 0.5) * hw : ((1 - clamped) / 0.5) * hw
      const yy = y + clamped * TH
      trim.push({
        id: `${id}:${name}`,
        points: `${x - half + 4},${yy} ${x + half - 4},${yy} ${x + half - 4},${yy + thick} ${x - half + 4},${yy + thick}`,
        fill,
      })
    }
    if (pattern === 0) {
      band(0.3, 2, shift(floor, -32), "p0")
      band(0.5, 2, shift(floor, 16), "p1")
      band(0.72, 2, shift(floor, -24), "p2")
    }
    if (pattern === 1) {
      trim.push({
        id: `${id}:grout`,
        points: `${x},${y + 6} ${x + hw - 8},${y + hh} ${x},${y + TH - 6} ${x - hw + 8},${y + hh}`,
        fill: shift(floor, -30),
      })
    }
    if (pattern === 2) {
      band(0.36, 3, shift(floor, 18), "c0")
      band(0.66, 3, shift(floor, -16), "c1")
    }
  }
  const paintWall = (id: string, points: string, fill: string, cap: string, _skirt: string) => {
    walls.push({ id, points, fill })
    const [a, b, c, d] = points.split(" ")
    trim.push({ id: `${id}:cap`, points: `${a} ${b} ${move(b, 0, -5)} ${move(a, 0, -5)}`, fill: "#f7f4ee" })
    trim.push({ id: `${id}:skirt`, points: `${move(d, 0, -16)} ${move(c, 0, -16)} ${c} ${d}`, fill: "#6e4b32" })
    trim.push({ id: `${id}:panel`, points: `${a} ${b} ${move(b, 0, 10)} ${move(a, 0, 10)}`, fill: cap })
  }
  for (const room of ROOM_DEFS) {
    const look = style[room.id] ?? { floor: room.floor, wall: room.wall }
    const floor = FLOOR_COLORS[look.floor] ?? FLOOR_COLORS[0]!
    const wall = WALL_COLORS[look.wall] ?? WALL_COLORS[0]!
    const pattern = look.floor % 3
    for (let tx = room.x0; tx <= room.x1; tx += 1) {
      for (let ty = room.y0; ty <= room.y1; ty += 1) {
        paintFloor(`${room.id}:${tx},${ty}`, tx, ty, floor, pattern)
        const top = topOf(tx, ty)
        const x = top.x
        const y = top.y
        const closed = CLOSED.has(room.id)
        const backOpen = !closed && onFloor({ tx, ty: ty - 1 }) && !PARTITIONS.has(`${tx},${ty}:back`)
        if (!backOpen) {
          paintWall(`${tx},${ty}:back`, `${x},${y - height} ${x + hw},${y + hh - height} ${x + hw},${y + hh} ${x},${y}`, shift(wall, 26), shift(wall, 48), shift(wall, -36))
        }
        const leftOpen = !closed && onFloor({ tx: tx - 1, ty }) && !PARTITIONS.has(`${tx},${ty}:left`)
        if (!leftOpen) {
          paintWall(`${tx},${ty}:left`, `${x - hw},${y + hh - height} ${x},${y - height} ${x},${y} ${x - hw},${y + hh}`, shift(wall, -22), shift(wall, 10), shift(wall, -48))
        }
        if (closed) {
          paintWall(`${tx},${ty}:front`, `${x},${y + TH - height} ${x + hw},${y + hh - height} ${x + hw},${y + hh} ${x},${y + TH}`, shift(wall, 8), shift(wall, 30), shift(wall, -30))
          paintWall(`${tx},${ty}:right`, `${x + hw},${y + hh - height} ${x},${y + TH - height} ${x},${y + TH} ${x + hw},${y + hh}`, shift(wall, -10), shift(wall, 16), shift(wall, -40))
        }
      }
    }
  }
  for (const key of DOORS) {
    const [tx, ty] = key.split(",").map(Number) as [number, number]
    const neighbor = ROOM_DEFS.find((room) => tx - 1 >= room.x0 && tx - 1 <= room.x1 && ty >= room.y0 && ty <= room.y1)
    const look = neighbor ? style[neighbor.id] : undefined
    const floor = FLOOR_COLORS[look?.floor ?? 0] ?? FLOOR_COLORS[0]!
    paintFloor(`door:${key}`, tx, ty, shift(floor, 8), 1)
    const top = topOf(tx, ty)
    const post = (dx: number, name: string) => {
      const x = top.x + dx
      const y = top.y + 18
      walls.push({ id: `post:${key}:${name}`, points: `${x - 3},${y - 40} ${x + 3},${y - 40} ${x + 3},${y} ${x - 3},${y}`, fill: "#6a4630" })
    }
    post(-30, "l")
    post(30, "r")
  }
  return { floors, walls, trim }
}

function move(point: string | undefined, dx: number, dy: number) {
  const [x, y] = (point ?? "0,0").split(",").map(Number)
  return `${(x ?? 0) + dx},${(y ?? 0) + dy}`
}

export type FurniSlot = "chair" | "desk"

export type CatalogItem = {
  id: string
  slot: FurniSlot
  name: string
  cost: number
  speed: number
  blurb: string
}

export const CATALOG: CatalogItem[] = [
  { id: "chair-red", slot: "chair", name: "Silla roja", cost: 0, speed: 1, blurb: "La de serie. Te sientas y grabas." },
  { id: "chair-club", slot: "chair", name: "Silla club", cost: 40, speed: 0.8, blurb: "El puesto en el que te sientas tarda un 20% menos." },
  { id: "desk-pine", slot: "desk", name: "Mesa de pino", cost: 0, speed: 1, blurb: "Un ordenador. Se enciende al trabajar." },
  { id: "desk-studio", slot: "desk", name: "Mesa de estudio", cost: 80, speed: 0.75, blurb: "La mesa buena. Otro 25% menos en el puesto donde te sientas." },
]

export type Loadout = { chair: string; desk: string; owned: string[] }

const FURNI_KEY = "danz-idle-furni-v1"

export const DEFAULT_LOADOUT: Loadout = {
  chair: "chair-red",
  desk: "desk-pine",
  owned: ["chair-red", "desk-pine"],
}

export function loadFurni(storage: Pick<Storage, "getItem">): Loadout {
  try {
    const raw = storage.getItem(FURNI_KEY)
    if (!raw) return DEFAULT_LOADOUT
    const parsed = JSON.parse(raw) as Partial<Loadout>
    const owned = Array.isArray(parsed.owned) ? parsed.owned.filter((id) => CATALOG.some((item) => item.id === id)) : DEFAULT_LOADOUT.owned
    const chair = owned.includes(parsed.chair ?? "") ? parsed.chair! : "chair-red"
    const desk = owned.includes(parsed.desk ?? "") ? parsed.desk! : "desk-pine"
    return { chair, desk, owned }
  } catch {
    return DEFAULT_LOADOUT
  }
}

export function saveFurni(storage: Pick<Storage, "setItem">, loadout: Loadout) {
  storage.setItem(FURNI_KEY, JSON.stringify(loadout))
}

export function speedFactor(loadout: Loadout) {
  const chair = CATALOG.find((item) => item.id === loadout.chair)?.speed ?? 1
  const desk = CATALOG.find((item) => item.id === loadout.desk)?.speed ?? 1
  return chair * desk
}

