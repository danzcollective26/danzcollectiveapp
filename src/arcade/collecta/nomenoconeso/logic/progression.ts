import { BANK_LIMIT, SCORE_LIMIT } from '../data/balance.ts'
import { ARCHETYPES } from '../data/archetypes.ts'
import { EVENTS } from '../data/events.ts'
import { NIGHTS } from '../data/nights.ts'
import { UPGRADES } from '../data/upgrades.ts'
import {
  NOMENOCONESO_SCHEMA_VERSION,
  NOMENOCONESO_STORAGE_KEY,
  type ProgressionState,
} from '../types.ts'

export { NOMENOCONESO_STORAGE_KEY }

const DAMAGED = 'La partida de NomeNoConEso no encaja. Empiezas de cero. No se ha tocado nada fuera de este modo.'
const NEWER = 'Esta partida es de una versión más nueva. Empiezas de cero en este dispositivo.'
const LEGACY = 'Había un borrador anterior sin noches. Empiezas de cero.'
const BLOCKED = 'Este navegador no deja guardar NomeNoConEso. Puedes mirar el esqueleto, pero no se conservará.'

export type ProgressionLoad = {
  state: ProgressionState
  warning: string | null
  saveAvailable: boolean
  migrated: boolean
}

type MemoryStorage = Pick<Storage, 'getItem' | 'setItem'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function integerIn(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max
}

/** Mantiene solo mejoras conocidas cuyo requisito ya está colocado antes. */
export function orderedUpgrades(ids: readonly string[]): string[] {
  const owned = new Set(ids)
  const ordered: string[] = []
  let grew = true
  while (grew) {
    grew = false
    for (const upgrade of UPGRADES) {
      if (!owned.has(upgrade.id) || ordered.includes(upgrade.id)) continue
      if (upgrade.requiresId && !ordered.includes(upgrade.requiresId)) continue
      ordered.push(upgrade.id)
      grew = true
    }
  }
  return ordered
}

/** Desbloqueos de la próxima noche, a partir de las noches ya superadas. */
export function recomputeProgression(state: ProgressionState): ProgressionState {
  const openIndex = state.nightsCleared.length + 1
  return {
    ...state,
    schemaVersion: NOMENOCONESO_SCHEMA_VERSION,
    unlockedArchetypeIds: ARCHETYPES.filter((item) => item.minNight <= openIndex).map((item) => item.id),
    unlockedEventIds: EVENTS.filter((item) => item.minNight <= openIndex).map((item) => item.id),
    upgradeIds: orderedUpgrades(state.upgradeIds),
  }
}

export function createProgression(): ProgressionState {
  return recomputeProgression({
    schemaVersion: NOMENOCONESO_SCHEMA_VERSION,
    nightsCleared: [],
    bestScoreByNight: {},
    doorMoney: 0,
    reputation: 0,
    upgradeIds: [],
    unlockedArchetypeIds: [],
    unlockedEventIds: [],
    pointsIntent: null,
  })
}

function parsePoints(raw: unknown, nightIds: ReadonlySet<string>): ProgressionState['pointsIntent'] | undefined {
  if (raw === null || raw === undefined) return null
  if (!isRecord(raw)) return undefined
  if (raw.schemaVersion !== 1 || raw.gameId !== 'collecta-nomenoconeso' || raw.claim !== false || raw.status !== 'no-implementado') return undefined
  if (typeof raw.nightId !== 'string' || !nightIds.has(raw.nightId) || !integerIn(raw.localScore, SCORE_LIMIT)) return undefined
  return {
    schemaVersion: 1,
    gameId: 'collecta-nomenoconeso',
    claim: false,
    status: 'no-implementado',
    nightId: raw.nightId,
    localScore: raw.localScore,
  }
}

/**
 * Lee una partida versión 1. Devuelve null si está rota.
 * La versión 0 y las futuras se tratan en loadProgression, no aquí.
 */
export function parseProgression(input: unknown): ProgressionState | null {
  if (!isRecord(input) || input.schemaVersion !== NOMENOCONESO_SCHEMA_VERSION) return null
  if (!Array.isArray(input.nightsCleared) || !isRecord(input.bestScoreByNight)) return null
  if (!Array.isArray(input.upgradeIds)) return null
  const nightIds = NIGHTS.map((night) => night.id)
  if (input.nightsCleared.length > nightIds.length) return null
  const cleared: string[] = []
  for (let index = 0; index < input.nightsCleared.length; index += 1) {
    if (input.nightsCleared[index] !== nightIds[index]) return null
    cleared.push(nightIds[index])
  }
  const best: Record<string, number> = {}
  for (const [id, score] of Object.entries(input.bestScoreByNight)) {
    if (!nightIds.includes(id) || !integerIn(score, SCORE_LIMIT)) return null
    best[id] = score
  }
  if (!integerIn(input.doorMoney, BANK_LIMIT) || !integerIn(input.reputation, BANK_LIMIT)) return null
  const known = new Set(UPGRADES.map((item) => item.id))
  const rawIds = input.upgradeIds.filter((id): id is string => typeof id === 'string')
  if (rawIds.length !== input.upgradeIds.length || rawIds.some((id) => !known.has(id))) return null
  const upgradeIds = orderedUpgrades(rawIds)
  if (upgradeIds.length !== rawIds.length) return null
  const points = parsePoints(input.pointsIntent, new Set(nightIds))
  if (points === undefined) return null
  return recomputeProgression({
    schemaVersion: NOMENOCONESO_SCHEMA_VERSION,
    nightsCleared: cleared,
    bestScoreByNight: best,
    doorMoney: input.doorMoney,
    reputation: input.reputation,
    upgradeIds,
    unlockedArchetypeIds: [],
    unlockedEventIds: [],
    pointsIntent: points,
  })
}

/** Guarda el récord local si la puntuación es válida y supera la anterior. */
export function rememberRecord(state: ProgressionState, nightId: string, score: number): ProgressionState {
  if (!NIGHTS.some((night) => night.id === nightId) || !integerIn(score, SCORE_LIMIT)) return state
  if (score <= (state.bestScoreByNight[nightId] ?? 0)) return state
  return { ...state, bestScoreByNight: { ...state.bestScoreByNight, [nightId]: score } }
}

export function loadProgression(storage: Pick<MemoryStorage, 'getItem'>, key = NOMENOCONESO_STORAGE_KEY): ProgressionLoad {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { state: createProgression(), warning: BLOCKED, saveAvailable: false, migrated: false }
  }
  if (raw === null || raw === '') return { state: createProgression(), warning: null, saveAvailable: true, migrated: false }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return { state: createProgression(), warning: DAMAGED, saveAvailable: true, migrated: false }
    if (parsed.schemaVersion === 0) return { state: createProgression(), warning: LEGACY, saveAvailable: true, migrated: true }
    if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > NOMENOCONESO_SCHEMA_VERSION) {
      return { state: createProgression(), warning: NEWER, saveAvailable: true, migrated: true }
    }
    const state = parseProgression(parsed)
    if (!state) return { state: createProgression(), warning: DAMAGED, saveAvailable: true, migrated: false }
    return { state, warning: null, saveAvailable: true, migrated: false }
  } catch {
    return { state: createProgression(), warning: DAMAGED, saveAvailable: true, migrated: false }
  }
}

export function saveProgression(
  storage: Pick<MemoryStorage, 'setItem'>,
  state: ProgressionState,
  key = NOMENOCONESO_STORAGE_KEY,
): { ok: true } | { ok: false; message: string } {
  const clean = parseProgression(state)
  if (!clean) return { ok: false, message: 'NomeNoConEso no guarda una partida que no encaja.' }
  try {
    storage.setItem(key, JSON.stringify(clean))
    return { ok: true }
  } catch {
    return { ok: false, message: 'No se ha podido guardar NomeNoConEso en este dispositivo. La partida sigue solo en memoria.' }
  }
}
