export const GROOVE_DURATION = 60_000
export const GROOVE_BEAT = 500
export const GROOVE_VINYLS = ['CUT 01', 'CUT 02', 'CUT 03', 'CUT 04'] as const
export const GROOVE_COLORS = ['#d9ff6b', '#ff789f', '#ba9efa', '#8dd8c8'] as const
export type GrooveMode = 'cut' | 'scratch'
export type GrooveWeapon = 'katana' | 'twin' | 'needle'
export const GROOVE_WEAPONS = {
  katana: { name: 'KATANA', detail: 'EQUILIBRADA', radius: 61, hazard: 45, points: 100, color: '#9cf6ff' },
  twin: { name: 'DOBLE FILO', detail: 'MÁS ALCANCE', radius: 84, hazard: 68, points: 80, color: '#ffafdc' },
  needle: { name: 'AGUJA', detail: 'PRECISIÓN +25%', radius: 43, hazard: 36, points: 125, color: '#f7da81' },
} as const
export type GrooveSpecial = 'normal' | 'gold' | 'freeze' | 'arrow' | 'combo' | 'split'
export type GroovePoint = { x: number; y: number }
export const GROOVE_DIRECTIONS = {
  up: { arrow: '↑', label: 'ARRIBA', x: 0, y: -1, angle: -90 },
  down: { arrow: '↓', label: 'ABAJO', x: 0, y: 1, angle: 90 },
  left: { arrow: '←', label: 'IZQUIERDA', x: -1, y: 0, angle: 180 },
  right: { arrow: '→', label: 'DERECHA', x: 1, y: 0, angle: 0 },
} as const
export type GrooveCutDirection = keyof typeof GROOVE_DIRECTIONS
export type GrooveSequence = { id: number; next: number; directions: GrooveCutDirection[] }
export type GrooveDisc = { id: number; kind: 'vinyl' | 'feedback'; layer: number; born: number; x: number; drift: number; launch: number; spin: number; special?: GrooveSpecial; axis?: 'x' | 'y'; direction?: GrooveCutDirection; sequence?: number; step?: number; originY?: number; size?: number; fragment?: boolean }
export type ScratchStep = { direction: number; distance: number; offset: number }
export const SCRATCH_PATTERNS = [
  { name: 'BABY SCRATCH', steps: [{ direction: 1, distance: 56, offset: 0 }, { direction: -1, distance: 56, offset: 500 }, { direction: 1, distance: 56, offset: 1000 }, { direction: -1, distance: 56, offset: 1500 }] },
  { name: 'LONG PULL', steps: [{ direction: -1, distance: 100, offset: 0 }, { direction: 1, distance: 100, offset: 1000 }, { direction: -1, distance: 56, offset: 1500 }] },
  { name: 'DOUBLE TIME', steps: [{ direction: 1, distance: 56, offset: 0 }, { direction: -1, distance: 56, offset: 250 }, { direction: 1, distance: 56, offset: 1000 }, { direction: -1, distance: 56, offset: 1250 }] },
  { name: 'BOOMERANG', steps: [{ direction: 1, distance: 100, offset: 0 }, { direction: -1, distance: 56, offset: 500 }, { direction: 1, distance: 56, offset: 1000 }, { direction: -1, distance: 100, offset: 1750 }] },
] as const
export type GrooveScratch = { id: number; until: number; turns: number; direction: number; anchor: number | null; pointer: number; pattern: number; firstAt: number; window: number; perfect: number }
export type GrooveSpark = { id: number; x: number; y: number; color: string; born: number; label: string; layer?: number; angle?: number; rotation?: number; velocity?: GroovePoint; special?: GrooveSpecial; size?: number }
export type GrooveState = {
  status: 'ready' | 'playing' | 'paused' | 'over' | 'complete'; mode: GrooveMode; elapsed: number; score: number; combo: number; bestCombo: number;
  lives: number; hits: number; misses: number; scratches: number; nextScratchAt: number; discs: GrooveDisc[];
  scratch: GrooveScratch | null; sparks: GrooveSpark[]; seed: number; nextId: number; beat: number; message: string;
  weapon: GrooveWeapon; flightTime: number; freezeUntil: number; nextWaveAt: number; wave: number; golds: number; multiCuts: number; strokeHits: number; perfects: number; judgement: string; doubleUntil: number; strokeDoubleUntil: number;
  cutSequence: GrooveSequence | null; sequences: number; beatMs: number;
}

export function initialGroove(seed = 27, mode: GrooveMode = 'cut', weapon: GrooveWeapon = 'katana', bpm = 120): GrooveState {
  return { status: 'ready', mode, elapsed: 0, score: 0, combo: 0, bestCombo: 0, lives: 5, hits: 0, misses: 0, scratches: 0, nextScratchAt: 0,
    discs: [], scratch: null, sparks: [], seed: Math.max(1, Math.floor(seed) % 2147483647), nextId: 1, beat: -1,
    weapon, flightTime: 0, freezeUntil: 0, nextWaveAt: 0, wave: 0, golds: 0, multiCuts: 0, strokeHits: 0, perfects: 0, judgement: '', doubleUntil: 0, strokeDoubleUntil: 0,
    cutSequence: null, sequences: 0, beatMs: 60_000 / (Number.isFinite(bpm) && bpm >= 60 && bpm <= 200 ? bpm : 120),
    message: mode === 'cut' ? 'DORADOS ×3 · HIELO RALENTIZA · SIGUE LAS FLECHAS.' : 'SIGUE LAS FLECHAS Y TERMINA CADA GESTO EN SU PULSO.' }
}
export function grooveStage(time: number) { return Math.min(3, 1 + Math.floor(time / 20_000)) }
export function grooveMultiplier(combo: number) { return Math.min(4, 1 + Math.floor(combo / 5)) }
/** Pattern offsets are authored at 120 BPM; distance and points stay unchanged. */
export function scratchOffset(state: GrooveState, offset: number) { return offset * state.beatMs / GROOVE_BEAT }
function nextWave(state: GrooveState, stage: number, long = false) {
  if (state.beatMs === GROOVE_BEAT) return state.elapsed + [1400, 1200, 1000][stage - 1] + (long ? 250 : 0)
  return (Math.round(state.elapsed / state.beatMs * 2) / 2 + [3, 2.5, 2][stage - 1] + (long ? .5 : 0)) * state.beatMs
}
export function discPosition(disc: GrooveDisc, time: number): GroovePoint {
  const age = Math.max(0, (time - disc.born) / 1000)
  return { x: disc.x + disc.drift * age, y: (disc.originY ?? 800) - disc.launch * age + 285 * age * age }
}
export function segmentDistance(point: GroovePoint, from: GroovePoint, to: GroovePoint) {
  const dx = to.x - from.x, dy = to.y - from.y
  const length = dx * dx + dy * dy
  const ratio = length ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / length)) : 0
  return Math.hypot(point.x - from.x - ratio * dx, point.y - from.y - ratio * dy)
}
function random(state: GrooveState) { state.seed = state.seed * 48271 % 2147483647; return state.seed / 2147483647 }
function spawnWave(state: GrooveState) {
  const stage = grooveStage(state.elapsed)
  const wave = state.wave++, layout = wave % 9
  if (wave % 4 === 3 && !state.cutSequence) {
    // Introduce up/down first, then alternate four directions and a third target.
    const patterns: GrooveCutDirection[][] = stage === 1 ? [['up', 'down'], ['down', 'up']] : [['up', 'down', 'right'], ['left', 'right', 'up'], ['down', 'up', 'left']]
    const directions = patterns[Math.floor(wave / 4) % patterns.length].slice(0, stage === 3 ? 3 : 2)
    const id = state.nextId++
    state.cutSequence = { id, next: 0, directions }
    directions.forEach((direction, step) => state.discs.push({ id: state.nextId++, kind: 'vinyl', special: 'arrow',
      axis: GROOVE_DIRECTIONS[direction].x ? 'x' : 'y', direction, sequence: id, step,
      layer: (step + wave) % 4, born: state.flightTime, x: directions.length === 2 ? 175 + step * 290 : 140 + step * 180,
      drift: 0, launch: 720, spin: random(state) * 5 }))
    state.message = `SECUENCIA: ${directions.map(d => GROOVE_DIRECTIONS[d].arrow).join(' ')}. CORTA EN ORDEN PARA +300.`
    state.nextWaveAt = nextWave(state, stage)
    return
  }
  const count = layout === 0 ? 1 : layout === 3 ? Math.min(3, stage + 1) : layout === 5 ? 3 : layout === 7 && stage > 1 ? 3 : 2
  const center = 230 + random(state) * 180
  for (let i = 0; i < count; i++) {
    // Distinct silhouettes without changing cut timing, scoring or lives:
    // stepped fan, crossing pair, rising staircase, and outward split.
    const x = layout === 5 ? 155 + i * 165 : layout === 6 ? (i ? 495 : 145)
      : layout === 7 ? 150 + i * 160 : layout === 8 ? 245 + i * 150
      : count === 1 ? 105 + Math.floor(random(state) * 4) * 140
      : center + (i - (count - 1) / 2) * (layout === 1 ? 96 : 145)
    const special: GrooveSpecial = wave === 0 ? 'normal' : i === 0 && wave % 8 === 5 ? 'combo' : i === 0 && wave % 8 === 1 ? 'split' : i === 0 && wave % 4 === 2 ? 'gold' : i === 0 && wave % 9 === 4 ? 'freeze' : 'normal'
    state.discs.push({ id: state.nextId++, kind: 'vinyl', special, axis: wave % 2 ? 'y' : 'x', layer: Math.floor(random(state) * 4),
      born: state.flightTime, x, originY: layout === 7 ? 760 + i * 45 : undefined,
      drift: layout === 5 ? (1 - i) * 55 : layout === 6 ? (i ? -85 : 85)
        : layout === 7 ? (i - 1) * 28 : layout === 8 ? (i ? 90 : -90)
        : (320 - x) * (layout === 4 ? .38 : .12),
      launch: 665 + random(state) * 80 + (layout === 2 ? i * 35 : layout === 5 ? i * 26 : 0), spin: random(state) * 5 })
  }
  if (wave >= 5 && wave % (stage === 1 ? 5 : 3) === 0) {
    const x = center > 320 ? 115 : 525
    state.discs.push({ id: state.nextId++, kind: 'feedback', layer: 0, born: state.flightTime, x, drift: 0, launch: 720, spin: 0 })
  }
  state.nextWaveAt = nextWave(state, stage, layout === 3)
}
function clone(state: GrooveState): GrooveState {
  return { ...state, discs: [...state.discs], sparks: [...state.sparks], scratch: state.scratch ? { ...state.scratch } : null, cutSequence: state.cutSequence ? { ...state.cutSequence } : null }
}
function spark(state: GrooveState, point: GroovePoint, color: string, label: string) {
  state.sparks.push({ id: state.nextId++, ...point, color, born: state.elapsed, label })
  state.sparks = state.sparks.slice(-14)
}
function miss(state: GrooveState, message: string) {
  state.lives = Math.max(0, state.lives - 1); state.misses++; state.combo = 0; state.message = message
  if (!state.lives) { state.status = 'over'; state.discs = []; state.scratch = null; state.cutSequence = null }
}
function reward(state: GrooveState, base: number) {
  state.combo++; state.bestCombo = Math.max(state.bestCombo, state.combo)
  const points = base * grooveMultiplier(state.combo)
  state.score += points
  return points
}
export function advanceGroove(previous: GrooveState, milliseconds: number): GrooveState {
  if (previous.status !== 'playing' || !Number.isFinite(milliseconds) || milliseconds <= 0) return previous
  const state = clone(previous)
  state.elapsed = Math.min(GROOVE_DURATION, previous.elapsed + Math.min(100, milliseconds))
  const slowed = Math.max(0, Math.min(state.elapsed, previous.freezeUntil) - previous.elapsed)
  state.flightTime += state.elapsed - previous.elapsed - slowed * .5
  const beat = Math.floor(state.elapsed / state.beatMs)
  if (state.mode === 'cut' && state.elapsed >= state.nextWaveAt) spawnWave(state)
  state.beat = beat
  if (state.mode === 'scratch' && !state.scratch && state.elapsed >= state.nextScratchAt) {
    const pattern = (state.scratches + state.misses) % (grooveStage(state.elapsed) === 1 ? 2 : 4)
    const firstAt = Math.ceil((state.elapsed + state.beatMs * 2) / state.beatMs) * state.beatMs
    const window = [230, 190, 160][grooveStage(state.elapsed) - 1]
    const steps = SCRATCH_PATTERNS[pattern].steps
    state.scratch = { id: state.nextId++, until: firstAt + scratchOffset(state, steps.at(-1)!.offset) + window, turns: 0, direction: 0, anchor: null, pointer: 320, pattern, firstAt, window, perfect: 0 }
    state.judgement = 'PREPARA EL GESTO'
    state.message = `${SCRATCH_PATTERNS[pattern].name}: ${steps.length} GESTOS AL PULSO. CORTO O LARGO SEGÚN LA FLECHA.`
  }
  if (state.scratch && state.elapsed > state.scratch.firstAt + scratchOffset(state, SCRATCH_PATTERNS[state.scratch.pattern].steps[state.scratch.turns].offset) + state.scratch.window) {
    state.scratch = null; state.nextScratchAt = state.elapsed + 750; state.judgement = 'FUERA DE TIEMPO'; miss(state, 'SE ESCAPÓ EL PULSO. PREPARA LA SIGUIENTE FRASE.')
  }
  if (state.status === 'playing') {
    const remaining: GrooveDisc[] = []
    const expiredSequence = state.cutSequence ? state.discs.find(disc => disc.sequence === state.cutSequence!.id && state.flightTime - disc.born > 450 && discPosition(disc, state.flightTime).y > 860)?.sequence : undefined
    if (expiredSequence !== undefined) {
      state.cutSequence = null
      miss(state, 'SECUENCIA FUERA. RECUPERA EL FLOW EN LA SIGUIENTE.')
    }
    for (const disc of state.discs) {
      if (state.status !== 'playing') break
      if (expiredSequence !== undefined && disc.sequence === expiredSequence) continue
      const position = discPosition(disc, state.flightTime)
      if (state.flightTime - disc.born > 450 && position.y > 860) {
        if (disc.kind === 'vinyl' && !disc.fragment) miss(state, 'VINILO FUERA. RECUPERA LA RACHA.')
      } else remaining.push(disc)
      if (state.status !== 'playing') break
    }
    state.discs = state.status === 'playing' ? remaining : []
  }
  state.sparks = state.sparks.filter(particle => state.elapsed - particle.born < 750)
  if (state.elapsed >= GROOVE_DURATION && state.status === 'playing') {
    state.status = 'complete'; state.discs = []; state.scratch = null; state.cutSequence = null; state.message = 'SESIÓN COMPLETADA.'
  }
  return state
}
export function cutGroove(previous: GrooveState, from: GroovePoint, to: GroovePoint): GrooveState {
  if (previous.status !== 'playing' || previous.mode !== 'cut' || ![from.x, from.y, to.x, to.y].every(Number.isFinite) || Math.hypot(to.x - from.x, to.y - from.y) < 7) return previous
  const dx = to.x - from.x, dy = to.y - from.y
  const along = (disc: GrooveDisc) => { const p = discPosition(disc, previous.flightTime); return (p.x - from.x) * dx + (p.y - from.y) * dy }
  const caught = previous.discs.filter(disc => {
    const p = discPosition(disc, previous.flightTime), weapon = GROOVE_WEAPONS[previous.weapon]
    return p.y > 80 && p.y < 650 && segmentDistance(p, from, to) <= (disc.kind === 'vinyl' ? weapon.radius * (disc.size ?? 1) : weapon.hazard)
  }).sort((a, b) => along(a) - along(b) || a.id - b.id)
  if (!caught.length) return previous
  const state = clone(previous)
  let cutCount = 0, boostConsumed = false
  for (const disc of caught) {
    const position = discPosition(disc, state.flightTime)
    if (disc.sequence !== undefined && (disc.sequence !== state.cutSequence?.id || disc.step !== state.cutSequence.next)) {
      state.message = `PRIMERO EL DISCO ${(state.cutSequence?.next ?? 0) + 1}. SIGUE LOS NÚMEROS.`
      continue
    }
    if (disc.special === 'arrow' && disc.direction) {
      const direction = GROOVE_DIRECTIONS[disc.direction]
      const forward = dx * direction.x + dy * direction.y
      const sideways = Math.abs(dx * direction.y - dy * direction.x)
      if (forward <= 0 || forward < sideways * 1.4) {
        state.message = `CORTE HACIA ${direction.label} ${direction.arrow}. PUEDES VOLVER A INTENTARLO.`
        continue
      }
    }
    if (disc.special === 'arrow' && !disc.direction && (disc.axis === 'x' ? Math.abs(to.x - from.x) < Math.abs(to.y - from.y) * 1.4 : Math.abs(to.y - from.y) < Math.abs(to.x - from.x) * 1.4)) {
      state.message = 'SIGUE LA FLECHA DEL DISCO: CORTE ' + (disc.axis === 'x' ? 'HORIZONTAL.' : 'VERTICAL.')
      continue
    }
    state.discs = state.discs.filter(item => item.id !== disc.id)
    if (disc.kind === 'feedback') { miss(state, '¡ACOPLE! CUIDADO CON LOS ROJOS.'); spark(state, position, '#ff645f', 'ACOPLE') }
    else {
      cutCount++
      const boost = state.strokeDoubleUntil > state.elapsed ? 2 : 1
      if (boost === 2 && !boostConsumed) { state.doubleUntil = 0; boostConsumed = true }
      const points = reward(state, Math.round(GROOVE_WEAPONS[state.weapon].points * (disc.fragment ? .5 : disc.special === 'gold' ? 3 : disc.special === 'arrow' ? 2 : 1)) * boost); state.hits++
      state.message = disc.special === 'gold' ? '¡DORADO! TRIPLE PUNTUACIÓN.' : disc.special === 'freeze' ? '¡HIELO! VUELO A CÁMARA LENTA DURANTE 3 SEGUNDOS.' : disc.special === 'arrow' ? '¡CORTE DE PRECISIÓN! DOBLE PUNTUACIÓN.' : 'CORTE LIMPIO. BUSCA UN DOBLE CORTE.'
      if (disc.special === 'freeze') state.freezeUntil = state.elapsed + 3000
      if (disc.special === 'combo') { state.doubleUntil = state.elapsed + 4000; state.message = '¡COMBO DISC! TU PRÓXIMA PASADA PUNTÚA ×2. TIENES 4 SEGUNDOS.' }
      if (disc.special === 'split') {
        const velocityY = -disc.launch + 570 * (state.flightTime - disc.born) / 1000
        for (const sign of [-1, 1]) state.discs.push({ id: state.nextId++, kind: 'vinyl', layer: disc.layer, born: state.flightTime,
          x: position.x + sign * 28, originY: position.y, drift: disc.drift + sign * 100,
          launch: -velocityY + 130, spin: disc.spin + sign, special: 'normal', size: .65, fragment: true })
        state.message = '¡SPLIT DISC! DOS MINIVINILOS DE BONUS. CÓRTALOS TAMBIÉN.'
      }
      if (disc.special === 'gold') { state.golds++; if (state.golds === 3) { state.score += 750; state.message = '¡RETO DORADO COMPLETO! +750' } }
      const sequence = state.cutSequence
      if (sequence && disc.sequence === sequence.id) {
        sequence.next++
        if (sequence.next === sequence.directions.length) {
          state.score += 300; state.sequences++; state.cutSequence = null
          state.message = '¡SECUENCIA COMPLETA! BONUS +300'
        } else state.message = `BIEN. AHORA DISCO ${sequence.next + 1}: ${GROOVE_DIRECTIONS[sequence.directions[sequence.next]].arrow}`
      }
      spark(state, position, GROOVE_COLORS[disc.layer], `+${points}`)
      Object.assign(state.sparks.at(-1)!, {
        special: disc.special,
        size: disc.size,
        layer: disc.layer, angle: Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI,
        rotation: (state.flightTime - disc.born) * .035 + disc.spin * 40,
        velocity: { x: disc.drift, y: -disc.launch + 570 * (state.flightTime - disc.born) / 1000 },
      })
    }
    if (state.status !== 'playing') break
  }
  if (cutCount && state.status === 'playing') {
    state.strokeHits += cutCount
    if (state.strokeHits > 1) {
      const bonus = 100 * (cutCount - (previous.strokeHits === 0 ? 1 : 0)) * (state.strokeDoubleUntil > state.elapsed ? 2 : 1)
      state.score += bonus
      if (previous.strokeHits < 2) state.multiCuts++
      if (!caught.some(disc => disc.sequence !== undefined)) state.message = `¡${state.strokeHits} DE UNA PASADA! BONUS +${bonus}`
      spark(state, to, GROOVE_WEAPONS[state.weapon].color, `MULTICORTE +${bonus}`)
    }
  }
  return state
}
export function beginGrooveCut(state: GrooveState): GrooveState {
  return state.mode === 'cut' && state.status === 'playing'
    ? { ...state, strokeHits: 0, strokeDoubleUntil: state.doubleUntil > state.elapsed ? state.doubleUntil : 0 } : state
}
// Keyboard alternative uses the visible layer number; it never awards DANZPOINTS.
export function keyCutGroove(previous: GrooveState, layer: number, direction: GrooveCutDirection | 'x' | 'y' = 'x') {
  const candidates = previous.discs.filter(item => item.kind === 'vinyl' && item.layer === layer && discPosition(item, previous.flightTime).y > 80 && discPosition(item, previous.flightTime).y < 650)
  // Keyboard players must be able to reach the next ordered target even if
  // another disc shares its layer. Never skip sequence order to award points.
  const sequence = previous.cutSequence
  const disc = candidates.find(item => sequence && item.sequence === sequence.id && item.step === sequence.next)
    ?? candidates.find(item => item.sequence === undefined)
    ?? candidates[0]
  if (!disc) return previous
  const p = discPosition(disc, previous.flightTime)
  const state = beginGrooveCut(previous)
  const vector = GROOVE_DIRECTIONS[direction === 'x' ? 'right' : direction === 'y' ? 'down' : direction]
  return cutGroove(state, { x: p.x - vector.x * 8, y: p.y - vector.y * 8 }, { x: p.x + vector.x * 8, y: p.y + vector.y * 8 })
}
export function scratchGroove(previous: GrooveState, x: number, release = false): GrooveState {
  if (previous.status !== 'playing' || previous.mode !== 'scratch' || !previous.scratch || !Number.isFinite(x)) return previous
  const state = clone(previous), scratch = state.scratch!
  if (release) { scratch.anchor = null; scratch.direction = 0; state.judgement = 'SUJETA DE NUEVO EL DISCO'; return state }
  scratch.pointer = x
  if (scratch.anchor === null) { scratch.anchor = x; return state }
  const delta = x - scratch.anchor
  const steps = SCRATCH_PATTERNS[scratch.pattern].steps, step = steps[scratch.turns]
  const timing = state.elapsed - scratch.firstAt - scratchOffset(state, step.offset)
  if (Math.abs(delta) < step.distance) return state
  if (Math.sign(delta) !== step.direction) { scratch.anchor = x; state.judgement = 'AL OTRO LADO'; return state }
  if (timing < -scratch.window) { state.judgement = 'ESPERA EL PULSO'; return state }
  if (timing > scratch.window) return state
  scratch.anchor = x; scratch.turns++; scratch.direction = Math.sign(delta)
  const perfect = Math.abs(timing) <= 95
  if (perfect) { scratch.perfect++; state.perfects++ }
  state.judgement = perfect ? 'PERFECTO' : 'A TIEMPO'
  // Points are awarded for a complete phrase, so random partial gestures cannot farm a record.
  if (scratch.turns === steps.length) {
    const points = reward(state, 200 + scratch.perfect * 75); state.scratches++; state.scratch = null
    state.nextScratchAt = state.elapsed + 650
    state.message = `¡FRASE COMPLETA! ${scratch.perfect}/${steps.length} PERFECTOS. VIENE OTRO PATRÓN.`; spark(state, { x: 320, y: 330 }, '#ff789f', `SCRATCH +${points}`)
  }
  return state
}
export function selectGrooveWeapon(state: GrooveState, weapon: GrooveWeapon): GrooveState { return state.mode === 'cut' && weapon in GROOVE_WEAPONS ? { ...state, weapon } : state }
export function setGroovePlaying(state: GrooveState, playing: boolean): GrooveState {
  if (playing && (state.status === 'ready' || state.status === 'paused')) return { ...state, status: 'playing' }
  if (!playing && state.status === 'playing') return { ...state, status: 'paused', scratch: state.scratch ? { ...state.scratch, anchor: null, direction: 0 } : null }
  return state
}
const RECORD_KEY = 'danz-groove-ninja-record-v1'
export function readGrooveRecord(mode: GrooveMode = 'cut', music = 'practice') {
  try { const value = Number(localStorage.getItem(`${RECORD_KEY}-${mode}${music === 'practice' ? '' : `-${music}`}`) ?? (mode === 'cut' && music === 'practice' ? localStorage.getItem(RECORD_KEY) : null)); return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : 0 } catch { return 0 }
}
export function saveGrooveRecord(score: number, mode: GrooveMode = 'cut', music = 'practice') {
  const record = Math.max(readGrooveRecord(mode, music), Number.isSafeInteger(score) && score >= 0 && score <= 1_000_000 ? score : 0)
  try { localStorage.setItem(`${RECORD_KEY}-${mode}${music === 'practice' ? '' : `-${music}`}`, String(record)) } catch { /* Optional practice record. */ }
  return record
}
