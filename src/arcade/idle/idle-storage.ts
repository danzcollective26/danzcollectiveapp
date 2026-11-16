import { DEFAULT_STORAGE_KEY } from "./contract.ts"
import { IDLE_CONFIG, stationById, type IdleConfig } from "./idle-config.ts"
import { STUDIO_ORDERS } from "./orders.ts"
import {
  createInitialState,
  recomputeUnlocks,
  type ActiveJob,
  type IdleState,
  type Milestone,
  type StationProgress,
} from "./idle-engine.ts"
import type { Good, ProductTier } from "./products.ts"

export { DEFAULT_STORAGE_KEY }

export type LoadResult = {
  state: IdleState
  warning: string | null
  saveAvailable: boolean
}

const DAMAGED =
  "La partida anterior no encaja con este taller. Empiezas de nuevo. No se ha tocado nada fuera de este juego."
const BLOCKED =
  "Este navegador no deja guardar la partida. Puedes jugar, pero no se conservará al salir."

type MemoryStorage = Pick<Storage, "getItem" | "setItem">

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function readJob(raw: unknown, config: IdleConfig): ActiveJob | null {
  if (!isRecord(raw)) return null
  const station = stationById(config, String(raw.stationId))
  if (!station?.playable || !station.job) return null
  const { durationMs, totalMs, payout, remainingMs } = raw
  if (
    typeof durationMs !== "number" ||
    typeof totalMs !== "number" ||
    typeof payout !== "number" ||
    typeof remainingMs !== "number" ||
    !Number.isFinite(durationMs) ||
    !Number.isFinite(totalMs) ||
    !Number.isSafeInteger(payout) ||
    !Number.isFinite(remainingMs) ||
    durationMs <= 0 ||
    durationMs > 600_000 ||
    totalMs <= 0 ||
    payout < 0 ||
    payout > 1_000_000 ||
    remainingMs < 0 ||
    remainingMs > totalMs
  ) {
    return null
  }
  const slot = raw.slot === "side" || raw.slot === "cover" || raw.slot === "main" ? raw.slot : undefined
  const who = typeof raw.who === "string" ? raw.who.slice(0, 24) : undefined
  return {
    stationId: station.id,
    startedAt: 0,
    durationMs,
    totalMs,
    payout,
    paused: true,
    remainingMs,
    packed: typeof raw.packed === "number" && raw.packed >= 0 ? Math.floor(raw.packed) : 0,
    ...(slot ? { slot } : {}),
    ...(who ? { who } : {}),
  }
}

function isMilestone(value: unknown): value is Milestone {
  return value === "first-upgrade" || value === "fashion-unlocked"
}

function rememberMilestones(state: IdleState): IdleState {
  const fresh: Milestone[] = []
  const owned = Object.values(state.stations).some((station) => station.level >= 2)
  if (owned && !state.milestonesEmitted.includes("first-upgrade")) fresh.push("first-upgrade")
  if (state.stations.fashion?.unlocked && !state.milestonesEmitted.includes("fashion-unlocked")) {
    fresh.push("fashion-unlocked")
  }
  if (fresh.length === 0) return state
  return { ...state, milestonesEmitted: [...state.milestonesEmitted, ...fresh] }
}

export function parseIdleState(input: unknown, config: IdleConfig = IDLE_CONFIG): IdleState | null {
  if (!isRecord(input) || input.schemaVersion !== 1) return null
  if (
    typeof input.currency !== "number" ||
    !Number.isSafeInteger(input.currency) ||
    input.currency < 0 ||
    input.currency > 1_000_000_000
  ) {
    return null
  }
  if (!isRecord(input.stations) || !Array.isArray(input.milestonesEmitted)) return null

  const stations: Record<string, StationProgress> = {}
  for (const station of config.stations) {
    const raw = input.stations[station.id]
    if (!isRecord(raw)) {
      stations[station.id] = { unlocked: false, jobsCompleted: 0, level: 0 }
      continue
    }
    if (
      typeof raw.jobsCompleted !== "number" ||
      !Number.isSafeInteger(raw.jobsCompleted) ||
      raw.jobsCompleted < 0 ||
      raw.jobsCompleted > 1_000_000
    ) {
      return null
    }
    if (typeof raw.level !== "number" || !Number.isSafeInteger(raw.level) || raw.level < 0) {
      return null
    }
    stations[station.id] = { unlocked: false, jobsCompleted: raw.jobsCompleted, level: Math.min(raw.level, station.maxLevel) }
  }

  const milestones: Milestone[] = []
  for (const entry of input.milestonesEmitted) {
    if (!isMilestone(entry) || milestones.includes(entry)) return null
    milestones.push(entry)
  }

  let activeJob: ActiveJob | null = null
  if (input.activeJob !== null && input.activeJob !== undefined) {
    activeJob = readJob(input.activeJob, config)
    if (!activeJob) return null
  }

  const operatorJobs: ActiveJob[] = []
  if (Array.isArray(input.operatorJobs)) {
    for (const item of input.operatorJobs) {
      const job = readJob(item, config)
      if (job) operatorJobs.push(job)
      if (operatorJobs.length >= 12) break
    }
  }

  const goods: Good[] = []
  if (Array.isArray(input.goods)) {
    for (const item of input.goods) {
      if (!isRecord(item) || typeof item.name !== "string") continue
      const station = stationById(config, String(item.stationId))
      const tier = item.tier
      if (!station || (tier !== 1 && tier !== 2 && tier !== 3)) continue
      goods.push({ stationId: station.id, tier: tier as ProductTier, name: item.name.slice(0, 40) })
      if (goods.length >= 30) break
    }
  }

  const gear = Array.isArray(input.gear)
    ? input.gear.filter((id): id is string => typeof id === "string").slice(0, 12)
    : []

  const duty = Array.isArray(input.duty)
    ? input.duty.filter((id): id is string => typeof id === "string" && config.stations.some((station) => station.id === id)).slice(0, 12)
    : []

  const knownOrders = new Set(STUDIO_ORDERS.map((order) => order.id))
  const ordersDone = Array.isArray(input.ordersDone)
    ? input.ordersDone.filter((id): id is string => typeof id === "string" && knownOrders.has(id)).slice(0, STUDIO_ORDERS.length)
    : []

  const normalized = recomputeUnlocks(
    { schemaVersion: 1, currency: input.currency, stations, activeJob, operatorJobs, goods, gear, smashed: Array.isArray(input.smashed) ? input.smashed.filter((id): id is string => typeof id === "string").slice(0, 12) : [], duty, ordersDone, milestonesEmitted: milestones },
    config,
  )
  return rememberMilestones(normalized)
}

export function loadIdle(
  storage: Pick<MemoryStorage, "getItem">,
  key: string = DEFAULT_STORAGE_KEY,
): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { state: createInitialState(), warning: BLOCKED, saveAvailable: false }
  }
  if (raw === null || raw === "") return { state: createInitialState(), warning: null, saveAvailable: true }
  try {
    const state = parseIdleState(JSON.parse(raw))
    if (!state) return { state: createInitialState(), warning: DAMAGED, saveAvailable: true }
    return { state, warning: null, saveAvailable: true }
  } catch {
    return { state: createInitialState(), warning: DAMAGED, saveAvailable: true }
  }
}

export function saveIdle(
  storage: Pick<MemoryStorage, "setItem">,
  key: string,
  state: IdleState,
): { ok: true } | { ok: false; message: string } {
  try {
    storage.setItem(key, JSON.stringify(state))
    return { ok: true }
  } catch {
    return { ok: false, message: "No se ha podido guardar en este dispositivo. La partida sigue solo en memoria." }
  }
}
