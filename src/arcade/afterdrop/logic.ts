// AFTER DROP — pure session rules. Rendering and sound sit on top of this.
// Original rules for a local practice run. No DANZPOINTS and no network.

export const LANES = [0, 1, 2] as const
export type Lane = (typeof LANES)[number]
export type Kind = 'vinyl' | 'hater' | 'resaca' | 'manager'
export type Grade = 'PERFECTO' | 'BIEN' | 'FALLO'
export type Phase = 'ready' | 'playing' | 'paused' | 'extracted' | 'over'
export type CloseReason = 'hit' | 'time' | 'extract' | null

export const TRAVEL_BEATS = 4
export const PERFECT_MS = 70
export const GOOD_MS = 140
export const WHIFF_MS = 280
export const MAX_LIVES = 3
export const SESSION_MS = 8 * 60 * 1000
export const EARLY_MS = 9000
export const HIT_GRACE_MS = 700
export const LOOT_CAP = 2_000_000
export const RECORD_KEY = 'danz-afterdrop-record-v1'
export const RECORD_SCHEMA = 1

export type DropEntity = {
  id: number
  kind: Kind
  lane: Lane
  bornBeat: number
  arriveBeat: number
  resolved: boolean
}

export type Judgement = { grade: Grade; lane: Lane; at: number; loot: number }

export type Drop = {
  seed: number
  rng: number
  phase: Phase
  elapsed: number
  beat: number
  nextBeat: number
  lane: Lane
  lives: number
  combo: number
  bestCombo: number
  carried: number
  banked: number
  multiplier: number
  entities: DropEntity[]
  nextId: number
  graceUntil: number
  perfects: number
  message: string
  judgement: Judgement | null
  closeReason: CloseReason
  lastHitAt: number
}

export type DropInput = { lane: Lane | null; collect: boolean; extract: boolean }
export const IDLE_INPUT: DropInput = { lane: null, collect: false, extract: false }

export type RecordStore = { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type AfterDropRecord = { schema: 1; score: number; bestCombo: number }

const EMPTY_RECORD: AfterDropRecord = { schema: 1, score: 0, bestCombo: 0 }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function easedIntensity(elapsed: number) {
  const t = clamp((Number.isFinite(elapsed) ? elapsed : 0) / SESSION_MS, 0, 1)
  return 1 - (1 - t) ** 1.35
}

export function intensityAt(elapsed: number) {
  return Math.round(easedIntensity(elapsed) * 1000) / 1000
}

export function bpmAt(elapsed: number) {
  return Math.round((96 + 52 * easedIntensity(elapsed)) * 10) / 10
}

export function dropMultiplier(elapsed: number, combo: number) {
  const minutes = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0) / 60000
  const chain = Math.min(30, Math.max(0, Number.isFinite(combo) ? combo : 0))
  const raw = 1 + minutes * 0.85 + chain * 0.04
  return Math.min(5.5, Math.round(raw * 100) / 100)
}

export function dropPayout(state: Pick<Drop, 'carried' | 'elapsed' | 'combo'>) {
  if (!Number.isSafeInteger(state.carried) || state.carried <= 0) return 0
  return Math.min(LOOT_CAP, Math.floor(state.carried * dropMultiplier(state.elapsed, state.combo)))
}

export function gradeTiming(deltaMs: number): Grade {
  if (!Number.isFinite(deltaMs)) return 'FALLO'
  const gap = Math.abs(deltaMs)
  if (gap <= PERFECT_MS) return 'PERFECTO'
  if (gap <= GOOD_MS) return 'BIEN'
  return 'FALLO'
}

/** Share of the drop that is no longer a friendly vinyl stream. Grows with the night. */
export function obstacleWeight(intensity: number) {
  return Math.round((0.18 + clamp(intensity, 0, 1) * 0.62) * 1000) / 1000
}

export function planSpawn(intensity: number, roll: number, threat: number, early: boolean): Kind {
  if (early || !Number.isFinite(roll)) return 'vinyl'
  const level = clamp(intensity, 0, 1)
  if (roll < 0.58 - level * 0.3) return 'vinyl'
  if (level < 0.2) return 'hater'
  if (level >= 0.5 && threat > 0.72) return 'manager'
  if (level >= 0.22 && threat > 0.45) return 'resaca'
  return 'hater'
}

export function balancePair(first: Kind, second: Kind): [Kind, Kind] {
  if (first !== 'vinyl' && second !== 'vinyl') return [first, 'vinyl']
  return [first, second]
}

export function earlyLane(beat: number): Lane {
  return (Math.abs(Math.floor(beat)) % 3) as Lane
}

export function nextRoll(state: number): readonly [number, number] {
  let seed = (state >>> 0) || 1
  seed = (seed + 0x6d2b79f5) | 0
  let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
  return [((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, seed >>> 0]
}

export function entityDepth(entity: Pick<DropEntity, 'bornBeat'>, beat: number) {
  return 1 - (beat - entity.bornBeat) / TRAVEL_BEATS
}

export function projectDrop(lane: number, depth: number, width: number, height: number) {
  const along = clamp(depth, 0, 1)
  const y = height * (0.16 + (1 - along) * 0.66) + (depth < 0 ? -depth * height * 0.12 : 0)
  const spread = width * (0.055 + (1 - along) * 0.3)
  return {
    x: width / 2 + (lane - 1) * spread,
    y,
    scale: 0.2 + (1 - along) * 0.8,
    spread,
  }
}

function safeSeed(seed: number) {
  return Number.isFinite(seed) ? Math.floor(Math.abs(seed)) % 2147483646 || 1 : 1
}

export function createDrop(seed = 1): Drop {
  const next = safeSeed(seed)
  return {
    seed: next, rng: next, phase: 'ready', elapsed: 0, beat: 0, nextBeat: 1, lane: 1,
    lives: MAX_LIVES, combo: 0, bestCombo: 0, carried: 0, banked: 0, multiplier: 1,
    entities: [], nextId: 1, graceUntil: 0, perfects: 0,
    message: 'CAE. ESQUIVA. EXTRAE.', judgement: null, closeReason: null, lastHitAt: -1,
  }
}

export function startDrop(state: Drop): Drop {
  const base = state.phase === 'ready' ? state : createDrop(state.seed + 1)
  return { ...base, phase: 'playing', message: 'EL DROP NO ACABA. CLAVA EL BEAT.' }
}

export function pauseDrop(state: Drop): Drop {
  if (state.phase !== 'playing') return state
  return { ...state, phase: 'paused', message: 'PAUSA. EL DROP SIGUE, TÚ NO.' }
}

export function resumeDrop(state: Drop): Drop {
  if (state.phase !== 'paused') return state
  return { ...state, phase: 'playing', message: 'SIGUE CAYENDO.' }
}

export function placeDropEntity(state: Drop, kind: Kind, lane: Lane, arriveBeat: number): Drop {
  const entity: DropEntity = {
    id: state.nextId, kind, lane, bornBeat: arriveBeat - TRAVEL_BEATS, arriveBeat, resolved: false,
  }
  return { ...state, nextId: state.nextId + 1, entities: [...state.entities, entity] }
}

function takeLane(rng: number, used: Lane[]): readonly [Lane, number] {
  let state = rng
  for (let attempt = 0; attempt < 4; attempt++) {
    const [roll, next] = nextRoll(state)
    state = next
    const lane = Math.min(2, Math.floor(roll * 3)) as Lane
    if (!used.includes(lane)) return [lane, state]
  }
  return [LANES.find(lane => !used.includes(lane)) ?? 1, state]
}

function award(grade: Grade, combo: number) {
  if (grade === 'PERFECTO') {
    const next = combo + 2
    return { loot: 6 + Math.min(next, 24), combo: next }
  }
  if (grade === 'BIEN') return { loot: 3, combo: combo + 1 }
  return { loot: 0, combo: 0 }
}

function spawnBeat(state: Drop, entities: DropEntity[], beatIndex: number, elapsed: number) {
  const intensity = intensityAt(elapsed)
  const early = elapsed < EARLY_MS
  const [density, afterDensity] = nextRoll(state.rng)
  const count = !early && intensity > 0.62 && density > 0.42 ? 2 : 1
  const used: Lane[] = []
  const picked: { lane: Lane; kind: Kind }[] = []
  let rng = afterDensity
  for (let index = 0; index < count; index++) {
    let lane: Lane
    if (early) lane = earlyLane(beatIndex)
    else {
      const taken = takeLane(rng, used)
      lane = taken[0]
      rng = taken[1]
    }
    if (used.includes(lane)) continue
    used.push(lane)
    const [roll, afterRoll] = nextRoll(rng)
    const [threat, afterThreat] = nextRoll(afterRoll)
    rng = afterThreat
    picked.push({ lane, kind: planSpawn(intensity, roll, threat, early) })
  }
  if (picked.length === 2) {
    const [first, second] = balancePair(picked[0].kind, picked[1].kind)
    picked[0].kind = first
    picked[1].kind = second
  }
  let nextId = state.nextId
  for (const item of picked) {
    entities.push({
      id: nextId++, kind: item.kind, lane: item.lane, bornBeat: beatIndex,
      arriveBeat: beatIndex + TRAVEL_BEATS, resolved: false,
    })
  }
  return { rng, nextId }
}

export function stepDrop(state: Drop, input: DropInput, dt: number, options?: { whiff?: boolean }): Drop {
  if (state.phase !== 'playing') return state
  const frame = Number.isFinite(dt) ? Math.min(50, Math.max(0, dt)) : 0
  const whiff = options?.whiff !== false
  const lane: Lane = input.lane === 0 || input.lane === 1 || input.lane === 2 ? input.lane : state.lane
  const elapsed = state.elapsed + frame
  const bpm = bpmAt(state.elapsed)
  const beat = state.beat + (frame * bpm) / 60000
  const beatMs = 60000 / bpm
  const entities = state.entities.map(entity => ({ ...entity }))
  let rng = state.rng
  let nextId = state.nextId
  let nextBeat = state.nextBeat
  let guard = 0
  while (nextBeat <= beat && guard < 3) {
    const span = beat - state.beat
    const at = span <= 0 ? elapsed : state.elapsed + frame * ((nextBeat - state.beat) / span)
    const spawned = spawnBeat({ ...state, rng, nextId }, entities, nextBeat, at)
    rng = spawned.rng
    nextId = spawned.nextId
    nextBeat += 1
    guard += 1
  }

  let combo = state.combo
  let carried = state.carried
  let perfects = state.perfects
  let bestCombo = state.bestCombo
  let judgement = state.judgement && elapsed - state.judgement.at <= 520 ? state.judgement : null
  let message = state.message
  let phase: Phase = state.phase
  let banked = state.banked
  let closeReason = state.closeReason
  let lives = state.lives
  let graceUntil = state.graceUntil
  let lastHitAt = state.lastHitAt

  if (input.collect) {
    let best: { index: number; delta: number } | null = null
    for (let index = 0; index < entities.length; index++) {
      const entity = entities[index]
      if (entity.resolved || entity.kind !== 'vinyl' || entity.lane !== lane) continue
      const delta = (entity.arriveBeat - beat) * beatMs
      if (Math.abs(delta) <= GOOD_MS && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { index, delta }
    }
    if (best) {
      const grade = gradeTiming(best.delta)
      const gained = award(grade, combo)
      combo = gained.combo
      carried = Math.min(LOOT_CAP, carried + gained.loot)
      if (grade === 'PERFECTO') perfects += 1
      bestCombo = Math.max(bestCombo, combo)
      entities[best.index].resolved = true
      judgement = { grade, lane, at: elapsed, loot: gained.loot }
      message = grade
    } else if (whiff && entities.some(entity => entity.kind === 'vinyl' && !entity.resolved && entity.lane === lane && Math.abs((entity.arriveBeat - beat) * beatMs) <= WHIFF_MS)) {
      combo = 0
      judgement = { grade: 'FALLO', lane, at: elapsed, loot: 0 }
      message = 'FALLO'
    }
  }

  for (const entity of entities) {
    if (entity.resolved || entity.kind !== 'vinyl') continue
    if ((entity.arriveBeat - beat) * beatMs < -GOOD_MS) {
      entity.resolved = true
      combo = 0
      judgement = { grade: 'FALLO', lane: entity.lane, at: elapsed, loot: 0 }
      message = 'FALLO'
    }
  }

  let multiplier = dropMultiplier(elapsed, combo)
  if (input.extract && carried > 0 && phase === 'playing') {
    banked = dropPayout({ carried, elapsed, combo })
    multiplier = dropMultiplier(elapsed, combo)
    phase = 'extracted'
    closeReason = 'extract'
    message = `BOTÍN A SALVO. ${banked}.`
  }

  if (phase === 'playing') {
    for (const entity of entities) {
      if (entity.resolved || entity.kind === 'vinyl' || beat < entity.arriveBeat) continue
      entity.resolved = true
      if (entity.lane !== lane || elapsed < graceUntil) continue
      const pocket = carried
      const keep = entity.kind === 'manager' ? 0.55 : entity.kind === 'resaca' ? 0.7 : 0.8
      carried = Math.floor(carried * keep)
      combo = 0
      lives -= 1
      graceUntil = elapsed + HIT_GRACE_MS
      lastHitAt = elapsed
      multiplier = dropMultiplier(elapsed, combo)
      if (lives <= 0) {
        phase = 'over'
        closeReason = 'hit'
        banked = 0
        message = pocket > 0 ? `PARTY OVER. ${pocket} DE BOTÍN SE QUEDA EN EL DROP.` : 'PARTY OVER.'
        break
      }
      message = entity.kind === 'manager' ? 'EL MANAGER TE CORTA EL COMBO.' : entity.kind === 'resaca' ? 'LA RESACA TE ALCANZA.' : 'UN HATER TE FRENA.'
    }
  }

  if (phase === 'playing' && elapsed >= SESSION_MS) {
    phase = 'over'
    closeReason = 'time'
    banked = 0
    multiplier = dropMultiplier(elapsed, combo)
    message = 'EL DROP ECHA EL CIERRE. PARTY OVER.'
  }

  return {
    ...state,
    rng, nextId, nextBeat, lane, elapsed, beat, combo, carried, perfects, bestCombo, judgement, message,
    phase, banked, closeReason, lives, graceUntil, lastHitAt, multiplier,
    entities: entities.filter(entity => beat <= entity.arriveBeat + 0.5),
  }
}

export function committedScore(state: Drop) {
  return state.phase === 'extracted' && Number.isSafeInteger(state.banked) && state.banked > 0 && state.banked <= LOOT_CAP ? state.banked : 0
}

function validRecord(value: unknown): value is AfterDropRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.schema === RECORD_SCHEMA
    && Number.isSafeInteger(record.score) && (record.score as number) >= 0 && (record.score as number) <= LOOT_CAP
    && Number.isSafeInteger(record.bestCombo) && (record.bestCombo as number) >= 0 && (record.bestCombo as number) <= 9999
}

function memory(): RecordStore {
  if (typeof localStorage === 'undefined') return { getItem: () => null, setItem: () => {} }
  return localStorage
}

export function readAfterDropRecord(store?: RecordStore, key = RECORD_KEY): AfterDropRecord {
  try {
    const raw = (store ?? memory()).getItem(key)
    if (!raw) return { ...EMPTY_RECORD }
    const parsed = JSON.parse(raw) as unknown
    return validRecord(parsed) ? { schema: 1, score: parsed.score, bestCombo: parsed.bestCombo } : { ...EMPTY_RECORD }
  } catch {
    return { ...EMPTY_RECORD }
  }
}

export function saveAfterDropRecord(score: number, bestCombo: number, store?: RecordStore, key = RECORD_KEY): AfterDropRecord {
  const box = store ?? memory()
  const previous = readAfterDropRecord(box, key)
  const scoreOk = Number.isSafeInteger(score) && score >= 0 && score <= LOOT_CAP
  const comboOk = Number.isSafeInteger(bestCombo) && bestCombo >= 0 && bestCombo <= 9999
  const saved: AfterDropRecord = {
    schema: 1,
    score: scoreOk ? Math.max(previous.score, score) : previous.score,
    bestCombo: scoreOk && score >= previous.score && comboOk ? bestCombo : previous.bestCombo,
  }
  try { box.setItem(key, JSON.stringify(saved)) } catch { /* The run still finishes if storage is blocked. */ }
  return saved
}
