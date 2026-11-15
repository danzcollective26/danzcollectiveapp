export type KartMode = 'race' | 'duel' | 'time'
export type TrackId = 'dock' | 'backstage'
export type Point = { x: number; y: number }
export type KartInput = { turn: number; drift: boolean; brake: boolean; vector?: Point }
export type Track = { id: TrackId; name: string; subtitle: string; points: Point[]; length: number; lengths: number[]; accent: string }
export type Car = Point & {
  id: number; angle: number; speed: number; progress: number; distance: number
  laps: number; checkpoint: number; charge: number; boosting: number
  drifting: boolean; finishedAt: number | null; lapAt: number; bestLap: number | null
}
export type Race = {
  mode: KartMode; track: TrackId; phase: 'ready' | 'countdown' | 'playing' | 'paused' | 'finished'
  resume: 'countdown' | 'playing'; cars: Car[]; elapsed: number; countdown: number; carry: number
}
export const KART_WIDTH = 1000, KART_HEIGHT = 720, ROAD_WIDTH = 94, KART_RADIUS = 13
export const RACE_LAPS = 3, RACE_LIMIT = 180000, KART_RECORD_KEY = 'danz-kart-best-v1'
export const NO_INPUT: KartInput = { turn: 0, drift: false, brake: false }
const STEP = 1000 / 120
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const wrap = (v: number) => ((v % 1) + 1) % 1
export const angleDifference = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

function makeTrack(id: TrackId, name: string, subtitle: string, accent: string, nodes: number[][]): Track {
  const points: Point[] = []
  for (let i = 0; i < nodes.length; i++) {
    const [a,b,c,d] = [-1,0,1,2].map(offset => nodes[(i + offset + nodes.length) % nodes.length])
    for (let n = 0; n < 12; n++) {
      const t = n / 12, t2 = t*t, t3 = t2*t
      const coord = (axis: number) => .5 * (2*b[axis] + (-a[axis]+c[axis])*t + (2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t2 + (-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t3)
      points.push({ x: coord(0), y: coord(1) })
    }
  }
  const lengths = [0]
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i+1) % points.length]
    lengths.push(lengths[i] + Math.hypot(b.x-a.x,b.y-a.y))
  }
  return { id, name, subtitle, accent, points, lengths, length: lengths.at(-1)! }
}
export const TRACKS: Record<TrackId, Track> = {
  dock: makeTrack('dock', 'AFTERHOURS DOCK', 'El último ferry sale contigo.', '#c9f56d', [[780,575],[490,590],[235,560],[135,430],[165,255],[300,145],[540,140],[810,185],[865,315],[815,425],[680,425],[580,325],[440,315],[365,400],[435,485],[635,490]]),
  backstage: makeTrack('backstage', 'BACKSTAGE RING', 'Flightcases fuera. Cero excusas.', '#82dadd', [[760,580],[490,580],[210,540],[150,365],[210,170],[425,145],[600,185],[800,145],[865,275],[760,350],[585,320],[490,395],[575,485],[790,465],[875,535]]),
}

export function trackPoint(track: Track, progress: number): Point & { angle: number } {
  const distance = wrap(progress) * track.length
  let index = 0
  while (index < track.points.length-1 && track.lengths[index+1] < distance) index++
  const a = track.points[index], b = track.points[(index+1) % track.points.length]
  const t = (distance-track.lengths[index]) / (track.lengths[index+1]-track.lengths[index])
  return { x: a.x+(b.x-a.x)*t, y: a.y+(b.y-a.y)*t, angle: Math.atan2(b.y-a.y,b.x-a.x) }
}
export function projectTrack(track: Track, point: Point) {
  let best = { x: 0, y: 0, progress: 0, distance: Infinity }
  for (let i = 0; i < track.points.length; i++) {
    const a = track.points[i], b = track.points[(i+1) % track.points.length]
    const dx = b.x-a.x, dy = b.y-a.y, length2 = dx*dx+dy*dy
    const t = clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/length2,0,1)
    const x = a.x+dx*t, y = a.y+dy*t, distance = Math.hypot(point.x-x,point.y-y)
    if (distance < best.distance) best = { x, y, distance, progress: (track.lengths[i]+Math.sqrt(length2)*t)/track.length }
  }
  return best
}
export function createRace(mode: KartMode = 'race', track: TrackId = 'dock'): Race {
  const course = TRACKS[track], count = mode === 'race' ? 4 : mode === 'duel' ? 2 : 1
  const cars = Array.from({ length: count }, (_, id): Car => {
    const progress = .02-id*.008, p = trackPoint(course, progress), side = id%2 ? -17 : 17
    return { id, x: p.x-Math.sin(p.angle)*side, y: p.y+Math.cos(p.angle)*side, angle: p.angle, speed: 0, progress: wrap(progress), distance: progress, laps: 0, checkpoint: 1, charge: 0, boosting: 0, drifting: false, finishedAt: null, lapAt: 0, bestLap: null }
  })
  return { mode, track, phase: 'ready', resume: 'playing', cars, elapsed: 0, countdown: 3000, carry: 0 }
}
export function startRace(s: Race): Race {
  if (s.phase === 'paused') return { ...s, phase: s.resume, carry: 0 }
  const fresh = createRace(s.mode, s.track)
  return { ...fresh, phase: 'countdown' }
}
export function pauseRace(s: Race): Race {
  return s.phase === 'playing' || s.phase === 'countdown' ? { ...s, phase: 'paused', resume: s.phase, carry: 0 } : s
}
export function raceOrder(s: Race): Car[] {
  return [...s.cars].sort((a,b) => a.finishedAt !== null ? b.finishedAt !== null ? a.finishedAt-b.finishedAt : -1 : b.finishedAt !== null ? 1 : b.distance-a.distance)
}
export function cpuInput(s: Race, car: Car): KartInput {
  const track = TRACKS[s.track], point = trackPoint(track, car.progress + (46+car.speed*.15)/track.length)
  const difference = angleDifference(Math.atan2(point.y-car.y,point.x-car.x),car.angle)
  return { turn: clamp(difference*1.85,-1,1), drift: false, brake: Math.abs(difference) > .85 }
}

/** Ordered quarters prevent reverse laps and shortcuts from counting. */
export function updateCheckpoint(car: Car, progress: number, elapsed: number): Car {
  const delta = ((progress-car.progress+1.5)%1)-.5
  if (Math.abs(delta) > .08) return { ...car, progress }
  let next = { ...car, progress, distance: car.distance+delta }
  const gap = wrap((car.checkpoint%4)/4-car.progress)
  if (delta > 0 && gap <= delta + .000001) {
    if (car.checkpoint === 4) {
      const lap = elapsed-car.lapAt
      next = { ...next, laps: car.laps+1, checkpoint: 1, lapAt: elapsed, bestLap: car.bestLap === null ? lap : Math.min(car.bestLap,lap), finishedAt: car.laps+1 === RACE_LAPS ? elapsed : null }
    } else next.checkpoint++
  }
  return next
}
function integrate(s: Race, inputs: readonly KartInput[], dt: number): Race {
  const elapsed = s.elapsed+dt*1000, track = TRACKS[s.track]
  let cars = s.cars.map(car => {
    if (car.finishedAt !== null) return car
    const cpu = s.mode === 'race' && car.id > 0
    const input = cpu ? cpuInput(s,car) : inputs[car.id] ?? NO_INPUT
    const vector = input.vector, aiming = vector && Math.hypot(vector.x,vector.y) > .15
    const turn = aiming ? clamp(angleDifference(Math.atan2(vector.y,vector.x),car.angle)*1.7,-1,1) : clamp(Number.isFinite(input.turn) ? input.turn : 0,-1,1)
    const drifting = input.drift && Math.abs(turn) > .18 && car.speed > 80 && !input.brake
    let charge = drifting ? Math.min(1,car.charge+dt*.7) : 0
    let boosting = Math.max(0,car.boosting-dt)
    if (car.drifting && !input.drift && car.charge >= .35) { boosting = .55+car.charge*.85; charge = 0 }
    const target = input.brake ? 68 : boosting > 0 ? 275 : cpu ? 164+car.id*7 : 198
    const speed = car.speed+(target-car.speed)*Math.min(1,dt*(input.brake ? 5 : 1.6))
    const angle = car.angle + turn * (drifting ? 3.2 : 2.65) * dt * Math.min(1,speed/70)
    const slip = drifting ? -turn*.28 : 0
    let x = car.x+Math.cos(angle+slip)*speed*dt, y = car.y+Math.sin(angle+slip)*speed*dt
    let nextSpeed = speed
    const projection = projectTrack(track,{x,y}), edge = ROAD_WIDTH/2-KART_RADIUS
    if (projection.distance > edge) {
      const scale = edge/projection.distance
      x = projection.x+(x-projection.x)*scale; y = projection.y+(y-projection.y)*scale
      nextSpeed = Math.max(35,speed*(1-Math.min(.6,dt*16))); charge = 0
    }
    return updateCheckpoint({ ...car, x, y, angle, speed: nextSpeed, drifting, charge, boosting },projectTrack(track,{x,y}).progress,elapsed)
  })
  // Equal-radius soft contacts: no items, hidden boosts or CPU collision immunity.
  for (let a = 0; a < cars.length; a++) for (let b = a+1; b < cars.length; b++) {
    const first = cars[a], second = cars[b], dx = second.x-first.x, dy = second.y-first.y, d = Math.hypot(dx,dy)
    if (first.finishedAt !== null || second.finishedAt !== null || d >= KART_RADIUS*2 || d < .001) continue
    const push = (KART_RADIUS*2-d)/2
    cars[a] = { ...first, x: first.x-dx/d*push, y: first.y-dy/d*push, speed: first.speed*.97 }
    cars[b] = { ...second, x: second.x+dx/d*push, y: second.y+dy/d*push, speed: second.speed*.97 }
  }
  // Contacts may push a kart onto a curb; constrain again before the next step.
  cars = cars.map(car => {
    const p = projectTrack(track,car), edge = ROAD_WIDTH/2-KART_RADIUS
    return p.distance <= edge ? car : { ...car, x:p.x+(car.x-p.x)*edge/p.distance, y:p.y+(car.y-p.y)*edge/p.distance }
  })
  const ended = (s.mode === 'race' ? cars[0].finishedAt !== null : cars.some(c=>c.finishedAt !== null)) || elapsed >= RACE_LIMIT
  return { ...s, elapsed, cars, phase: ended ? 'finished' : 'playing' }
}
/** Fixed 120 Hz physics, capped catch-up; menus never advance a race. */
export function stepRace(s: Race, inputs: readonly KartInput[], delta: number): Race {
  if (!Number.isFinite(delta) || delta <= 0 || !['playing','countdown'].includes(s.phase)) return s
  let remaining = Math.min(delta,250)
  if (s.phase === 'countdown') {
    const countdown = Math.max(0,s.countdown-remaining)
    if (countdown > 0) return { ...s, countdown }
    remaining = Math.max(0,remaining-s.countdown); s = { ...s, phase:'playing', countdown:0 }
  }
  let next = s, carry = s.carry+remaining
  while (carry+1e-9 >= STEP && next.phase === 'playing') { next = integrate(next,inputs,STEP/1000); carry -= STEP }
  return { ...next, carry: Math.max(0,carry) }
}
export function formatRaceTime(ms: number | null) {
  if (ms === null) return '—'
  const total = Math.max(0,ms), seconds = Math.floor(total/1000)
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}.${String(Math.floor(total%1000/10)).padStart(2,'0')}`
}
export function readKartBest(track: TrackId): number | null {
  try { const n = JSON.parse(localStorage.getItem(KART_RECORD_KEY) ?? '{}')[track]; return Number.isFinite(n) && n > 0 && n <= RACE_LIMIT ? n : null } catch { return null }
}
export function saveKartBest(track: TrackId, ms: number): boolean {
  if (!Number.isFinite(ms) || ms <= 0 || ms > RACE_LIMIT) return false
  try { const values = JSON.parse(localStorage.getItem(KART_RECORD_KEY) ?? '{}'), previous = readKartBest(track); if (previous !== null && previous <= ms) return false; localStorage.setItem(KART_RECORD_KEY,JSON.stringify({...values,[track]:ms})); return true } catch { return false }
}
