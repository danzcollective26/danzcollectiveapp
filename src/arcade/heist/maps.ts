export type MapId = 'studio' | 'terrace'
export type Tile = 'floor' | 'wall' | 'cover' | 'door' | 'vip' | 'feedback'
export type FactionId = 'tech' | 'crew' | 'manager' | 'bouncer' | 'hangover'
export type LootKind = 'vinyl' | 'stems' | 'contract' | 'merch' | 'rescue' | 'vip'

export type MapPoint = { x: number; y: number }
export type ParsedMap = {
  id: MapId
  name: string
  note: string
  factions: readonly FactionId[]
  cols: number
  rows: number
  tiles: Tile[]
  player: MapPoint
  agents: { kind: FactionId; x: number; y: number }[]
  loot: { kind: LootKind; x: number; y: number }[]
  smoke: MapPoint | null
  early: MapPoint
  late: MapPoint
  taxiAlt: MapPoint | null
  lateKey: LootKind | null
  hangovers: MapPoint[]
}

const STUDIO = `
##################
#S......C.....E..#
#.##.##.##.##.##.#
#.#1.....C.....T.#
#.#..####..####..#
#..C.......K.....#
#.##.##.##.##.##.#
#...R..........2.#
#.##...##...##..D#
#.#..C..#..C..#..#
#.T..R.......#..F#
#..ZZ.C..C...3ZZ.#
##################
`
const TERRACE = `
##################
#S....C....C...E.#
#..M......B......#
#..##..1..##..##.#
#......C.........#
#..B....2....M...#
#..##....K...##..#
#........C....3..#
#..##..##..##..V.#
#..M..........B..#
#....C....C....X.#
#.............F..#
##################
`

const LOOT: Record<MapId, Partial<Record<string, LootKind>>> = {
  studio: { '1': 'vinyl', '2': 'stems', '3': 'contract' },
  terrace: { '1': 'vinyl', '2': 'merch', '3': 'vip' },
}

function linesOf(art: string) {
  const lines = art.trim().split('\n').map(line => line.trim())
  const cols = lines[0]?.length ?? 0
  if (!cols || lines.some(line => line.length !== cols)) throw new Error('Mapa de heist irregular')
  return lines
}

function cornerSpawns(tiles: Tile[], cols: number, rows: number, player: MapPoint): MapPoint[] {
  const spots: MapPoint[] = []
  const seeds = [[cols - 2, 1], [1, rows - 2], [cols - 2, rows - 2], [cols - 3, 2], [2, rows - 3]]
  for (const [x, y] of seeds) {
    if (tiles[y * cols + x] !== 'floor') continue
    if (Math.hypot(x - player.x, y - player.y) < 4) continue
    if (spots.some(spot => Math.hypot(spot.x - x, spot.y - y) < 2)) continue
    spots.push({ x, y })
    if (spots.length === 3) break
  }
  return spots
}

function parse(id: MapId, name: string, note: string, factions: readonly FactionId[], art: string, lateKey: LootKind | null): ParsedMap {
  const lines = linesOf(art)
  const cols = lines[0].length
  const rows = lines.length
  const tiles: Tile[] = Array.from({ length: cols * rows }, () => 'floor')
  let player: MapPoint | null = null
  let early: MapPoint | null = null
  let late: MapPoint | null = null
  let taxiAlt: MapPoint | null = null
  let smoke: MapPoint | null = null
  const agents: ParsedMap['agents'] = []
  const loot: ParsedMap['loot'] = []
  const factionOf: Record<string, FactionId> = { T: 'tech', R: 'crew', M: 'manager', B: 'bouncer' }
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const char = lines[y][x]
    const at = y * cols + x
    if (char === '#') tiles[at] = 'wall'
    else if (char === 'C') tiles[at] = 'cover'
    else if (char === 'D') tiles[at] = 'door'
    else if (char === 'V') tiles[at] = 'vip'
    else if (char === 'Z') tiles[at] = 'feedback'
    else tiles[at] = 'floor'
    if (char === 'S') player = { x, y }
    else if (char === 'E') early = { x, y }
    else if (char === 'F') late = { x, y }
    else if (char === 'X') taxiAlt = { x, y }
    else if (char === 'K') smoke = { x, y }
    else if (factionOf[char]) agents.push({ kind: factionOf[char], x, y })
    else if (LOOT[id][char]) loot.push({ kind: LOOT[id][char]!, x, y })
  }
  if (!player || !early || !late || loot.length !== 3) throw new Error(`Mapa ${id} incompleto`)
  return {
    id, name, note, factions, cols, rows, tiles, player, agents, loot, smoke, early, late, taxiAlt, lateKey,
    hangovers: cornerSpawns(tiles, cols, rows, player),
  }
}

export const HEIST_MAPS: Record<MapId, ParsedMap> = {
  studio: parse('studio', 'AFTER DE ESTUDIO', 'Pasillos, cables y cabinas. Técnicos y una crew rival.', ['tech', 'crew'], STUDIO, 'contract'),
  terrace: parse('terrace', 'TERRAZA', 'Humo, lasers y un taxi que no espera. Managers y bouncers.', ['manager', 'bouncer'], TERRACE, 'vip'),
}

export const HEIST_MAP_IDS = ['studio', 'terrace'] as const
