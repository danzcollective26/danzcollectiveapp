export const GROOVE_DURATION = 60_000
export const GROOVE_BEAT = 500
export const GROOVE_VINYLS = ['CUT 01', 'CUT 02', 'CUT 03', 'CUT 04'] as const
export const GROOVE_COLORS = ['#d9ff6b', '#ff789f', '#ba9efa', '#8dd8c8'] as const
export type GrooveMode = 'cut' | 'scratch'
export type GroovePoint = { x: number; y: number }
export type GrooveDisc = { id: number; kind: 'vinyl' | 'feedback'; layer: number; born: number; x: number; drift: number; launch: number; spin: number }
export type GrooveScratch = { id: number; until: number; turns: number; direction: number; anchor: number | null }
export type GrooveSpark = { id: number; x: number; y: number; color: string; born: number; label: string; layer?: number; angle?: number }
export type GrooveState = {
  status: 'ready' | 'playing' | 'paused' | 'over' | 'complete'; mode: GrooveMode; elapsed: number; score: number; combo: number; bestCombo: number;
  lives: number; hits: number; misses: number; scratches: number; nextScratchAt: number; discs: GrooveDisc[];
  scratch: GrooveScratch | null; sparks: GrooveSpark[]; seed: number; nextId: number; beat: number; message: string;
}

export function initialGroove(seed = 27, mode: GrooveMode = 'cut'): GrooveState {
  return { status: 'ready', mode, elapsed: 0, score: 0, combo: 0, bestCombo: 0, lives: 5, hits: 0, misses: 0, scratches: 0, nextScratchAt: 0,
    discs: [], scratch: null, sparks: [], seed: Math.max(1, Math.floor(seed) % 2147483647), nextId: 1, beat: -1,
    message: mode === 'cut' ? 'CORTA VINILOS. ESQUIVA LOS ACOPLES.' : 'SUJETA EL DISCO. CAMBIA DE DIRECCIÓN.' }
}
export function grooveStage(time: number) { return Math.min(3, 1 + Math.floor(time / 20_000)) }
export function grooveMultiplier(combo: number) { return Math.min(4, 1 + Math.floor(combo / 5)) }
export function discPosition(disc: GrooveDisc, time: number): GroovePoint {
  const age = Math.max(0, (time - disc.born) / 1000)
  return { x: disc.x + disc.drift * age, y: 800 - disc.launch * age + 285 * age * age }
}
export function segmentDistance(point: GroovePoint, from: GroovePoint, to: GroovePoint) {
  const dx = to.x - from.x, dy = to.y - from.y
  const length = dx * dx + dy * dy
  const ratio = length ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / length)) : 0
  return Math.hypot(point.x - from.x - ratio * dx, point.y - from.y - ratio * dy)
}
function random(state: GrooveState) { state.seed = state.seed * 48271 % 2147483647; return state.seed / 2147483647 }
function spawn(state: GrooveState, beat: number, extra = false) {
  const stage = grooveStage(state.elapsed)
  const feedback = !extra && beat >= 16 && beat % (stage === 1 ? 12 : 7) === 0
  const layer = Math.floor(random(state) * 4)
  const lane = Math.floor(random(state) * 4)
  state.discs.push({ id: state.nextId++, kind: feedback ? 'feedback' : 'vinyl', layer,
    born: beat * GROOVE_BEAT, x: 105 + lane * 140, drift: (320 - (105 + lane * 140)) * .23,
    launch: 680 + random(state) * 45, spin: random(state) * 5 })
}
function clone(state: GrooveState): GrooveState {
  return { ...state, discs: [...state.discs], sparks: [...state.sparks], scratch: state.scratch ? { ...state.scratch } : null }
}
function spark(state: GrooveState, point: GroovePoint, color: string, label: string) {
  state.sparks.push({ id: state.nextId++, ...point, color, born: state.elapsed, label })
  state.sparks = state.sparks.slice(-14)
}
function miss(state: GrooveState, message: string) {
  state.lives = Math.max(0, state.lives - 1); state.misses++; state.combo = 0; state.message = message
  if (!state.lives) { state.status = 'over'; state.discs = []; state.scratch = null }
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
  const beat = Math.floor(state.elapsed / GROOVE_BEAT)
  for (let current = state.beat + 1; current <= beat; current++) {
    if (state.mode === 'cut' && (grooveStage(state.elapsed) > 1 || current % 2 === 0)) {
      spawn(state, current)
      if (grooveStage(state.elapsed) === 3 && current % 6 === 2) spawn(state, current, true)
    }
  }
  state.beat = beat
  if (state.mode === 'scratch' && !state.scratch && state.elapsed >= state.nextScratchAt) {
    const window = [3800, 3200, 2600][grooveStage(state.elapsed) - 1]
    state.scratch = { id: state.nextId++, until: state.elapsed + window, turns: 0, direction: 0, anchor: null }
    state.nextScratchAt = state.elapsed + window + 500
    state.message = 'SCRATCH: IDA Y VUELTA, SIN SOLTAR.'
  }
  if (state.scratch && state.elapsed >= state.scratch.until) {
    state.scratch = null; miss(state, 'SE ESCAPÓ EL SCRATCH. A POR EL SIGUIENTE.')
  }
  if (state.status === 'playing') {
    const remaining: GrooveDisc[] = []
    for (const disc of state.discs) {
      const position = discPosition(disc, state.elapsed)
      if (state.elapsed - disc.born > 450 && position.y > 860) {
        if (disc.kind === 'vinyl') miss(state, 'VINILO FUERA. RECUPERA LA RACHA.')
      } else remaining.push(disc)
      if (state.status !== 'playing') break
    }
    state.discs = state.status === 'playing' ? remaining : []
  }
  state.sparks = state.sparks.filter(particle => state.elapsed - particle.born < 750)
  if (state.elapsed >= GROOVE_DURATION && state.status === 'playing') {
    state.status = 'complete'; state.discs = []; state.scratch = null; state.message = 'SESIÓN COMPLETADA.'
  }
  return state
}
export function cutGroove(previous: GrooveState, from: GroovePoint, to: GroovePoint): GrooveState {
  if (previous.status !== 'playing' || previous.mode !== 'cut' || ![from.x, from.y, to.x, to.y].every(Number.isFinite) || Math.hypot(to.x - from.x, to.y - from.y) < 7) return previous
  const caught = previous.discs.filter(disc => {
    const p = discPosition(disc, previous.elapsed)
    return p.y > 45 && p.y < 745 && segmentDistance(p, from, to) <= (disc.kind === 'vinyl' ? 61 : 45)
  })
  if (!caught.length) return previous
  const state = clone(previous)
  state.discs = state.discs.filter(disc => !caught.some(hit => hit.id === disc.id))
  for (const disc of caught) {
    const position = discPosition(disc, state.elapsed)
    if (disc.kind === 'feedback') { miss(state, '¡ACOPLE! CUIDADO CON LOS ROJOS.'); spark(state, position, '#ff645f', 'ACOPLE') }
    else {
      const points = reward(state, 100); state.hits++; state.message = caught.length > 1 ? '¡VARIOS VINILOS DE UNA PASADA!' : 'CORTE LIMPIO. MANTÉN LA RACHA.'
      spark(state, position, GROOVE_COLORS[disc.layer], `+${points}`)
      Object.assign(state.sparks.at(-1)!, { layer: disc.layer, angle: Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI })
    }
    if (state.status !== 'playing') break
  }
  return state
}
// Keyboard alternative uses the visible layer number; it never awards DANZPOINTS.
export function keyCutGroove(previous: GrooveState, layer: number) {
  const disc = previous.discs.find(item => item.kind === 'vinyl' && item.layer === layer && discPosition(item, previous.elapsed).y < 745)
  if (!disc) return previous
  const p = discPosition(disc, previous.elapsed)
  return cutGroove(previous, { x: p.x - 8, y: p.y }, { x: p.x + 8, y: p.y })
}
export function scratchGroove(previous: GrooveState, x: number, release = false): GrooveState {
  if (previous.status !== 'playing' || previous.mode !== 'scratch' || !previous.scratch || !Number.isFinite(x)) return previous
  const state = clone(previous), scratch = state.scratch!
  if (release) { scratch.anchor = null; scratch.direction = 0; return state }
  if (scratch.anchor === null) { scratch.anchor = x; return state }
  const delta = x - scratch.anchor
  if (Math.abs(delta) < 42) return previous
  const direction = Math.sign(delta)
  if (scratch.direction && direction !== scratch.direction) scratch.turns++
  scratch.direction = direction; scratch.anchor = x
  if (scratch.turns >= 3) {
    const points = reward(state, 400); state.scratches++; state.scratch = null
    state.nextScratchAt = state.elapsed + [700, 550, 400][grooveStage(state.elapsed) - 1]
    state.message = 'SCRATCH LIMPIO. VIENE OTRO PLATO.'; spark(state, { x: 320, y: 330 }, '#ff789f', `SCRATCH +${points}`)
  }
  return state
}
export function setGroovePlaying(state: GrooveState, playing: boolean): GrooveState {
  if (playing && (state.status === 'ready' || state.status === 'paused')) return { ...state, status: 'playing' }
  if (!playing && state.status === 'playing') return { ...state, status: 'paused', scratch: state.scratch ? { ...state.scratch, anchor: null, direction: 0 } : null }
  return state
}
const RECORD_KEY = 'danz-groove-ninja-record-v1'
export function readGrooveRecord(mode: GrooveMode = 'cut') {
  try { const value = Number(localStorage.getItem(`${RECORD_KEY}-${mode}`) ?? (mode === 'cut' ? localStorage.getItem(RECORD_KEY) : null)); return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : 0 } catch { return 0 }
}
export function saveGrooveRecord(score: number, mode: GrooveMode = 'cut') {
  const record = Math.max(readGrooveRecord(mode), Number.isSafeInteger(score) && score >= 0 && score <= 1_000_000 ? score : 0)
  try { localStorage.setItem(`${RECORD_KEY}-${mode}`, String(record)) } catch { /* Optional practice record. */ }
  return record
}
