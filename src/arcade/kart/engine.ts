import { DEFAULT_BUILD, KART_COLORS, buildKey, kartStats, normalizeBuild, type KartBuild } from './garage.ts'

export type KartMode = 'race' | 'duel' | 'time'
export type TrackId = 'dock' | 'backstage'
export type Point = { x: number; y: number }
export type KartInput = { turn: number; drift: boolean; brake: boolean; throttle?:number; pit?:boolean; vector?: Point }
export type Track = { id: TrackId; name: string; subtitle: string; points: Point[]; length: number; lengths: number[]; accent: string }
export type Car = Point & {
  id: number; angle: number; speed: number; progress: number; distance: number
  laps: number; checkpoint: number; charge: number; boosting: number
  drifting: boolean; finishedAt: number | null; lapAt: number; bestLap: number | null
  build:KartBuild; steering:number; health:number; tires:number; damageCooldown:number; impacts:number
  pitRequested:boolean; pitHeld:boolean; pit:number|null; service:number; tow:number; stops:number
}
export type Race = {
  mode: KartMode; track: TrackId; phase: 'ready' | 'countdown' | 'playing' | 'paused' | 'finished'
  resume: 'countdown' | 'playing'; cars: Car[]; elapsed: number; countdown: number; carry: number
}
export const KART_WIDTH = 1000, KART_HEIGHT = 720, ROAD_WIDTH = 94, KART_RADIUS = 18
export const RACE_LAPS = 3, RACE_LIMIT = 180000, KART_RECORD_KEY = 'danzporter-best-v3'
export const PIT_ENTRY=.015,PIT_EXIT=.15,SERVICE_MS=3500,TOW_MS=3000
export const NO_INPUT: KartInput = { turn: 0, drift: false, brake: false, throttle:0, pit:false }
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
      // A periodic cubic B-spline keeps the full-width road smooth through bends.
      const coord = (axis: number) => ((1-3*t+3*t2-t3)*a[axis]+(4-6*t2+3*t3)*b[axis]+(1+3*t+3*t2-3*t3)*c[axis]+t3*d[axis])/6
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
  dock: makeTrack('dock', 'AFTERHOURS DOCK', 'El último ferry sale contigo.', '#c9f56d', [[740,625],[500,625],[220,580],[120,420],[155,235],[310,125],[570,120],[760,135],[825,175],[850,235],[825,295],[760,320],[620,275],[430,280],[365,310],[340,360],[360,415],[420,450],[500,465],[700,475],[820,475],[873,497],[895,550],[873,603],[820,625]]),
  backstage: makeTrack('backstage', 'BACKSTAGE RING', 'Flightcases fuera. Cero excusas.', '#82dadd', [[740,625],[500,625],[215,580],[120,420],[160,230],[310,120],[440,125],[560,165],[680,140],[770,130],[835,165],[865,220],[850,280],[805,320],[735,330],[620,300],[520,300],[450,295],[390,320],[365,380],[390,440],[450,465],[530,475],[740,475],[820,475],[873,497],[895,550],[873,603],[820,625]]),
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
export function createRace(mode: KartMode = 'race', track: TrackId = 'dock',builds:readonly KartBuild[]=[]): Race {
  const course = TRACKS[track], count = mode === 'race' ? 4 : mode === 'duel' ? 2 : 1
  const cars = Array.from({ length: count }, (_, id): Car => {
    const progress = .02-id*.014, p = trackPoint(course, progress), side = id%2 ? -20 : 20
    const build=normalizeBuild(builds[id],{...DEFAULT_BUILD,color:KART_COLORS[id%KART_COLORS.length],chassis:id===2?'hauler':id===3?'sprint':'club',wheels:id===1?'grip':id===2?'endurance':'street'})
    return { id, x: p.x-Math.sin(p.angle)*side, y: p.y+Math.cos(p.angle)*side, angle: p.angle, speed: 0, progress: wrap(progress), distance: progress, laps: 0, checkpoint: 1, charge: 0, boosting: 0, drifting: false, finishedAt: null, lapAt: 0, bestLap: null,build,steering:0,health:1,tires:1,damageCooldown:0,impacts:0,pitRequested:false,pitHeld:false,pit:null,service:0,tow:0,stops:0 }
  })
  return { mode, track, phase: 'ready', resume: 'playing', cars, elapsed: 0, countdown: 3000, carry: 0 }
}
export function startRace(s: Race): Race {
  if (s.phase === 'paused') return { ...s, phase: s.resume, carry: 0 }
  const fresh = createRace(s.mode, s.track,s.cars.map(c=>c.build))
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
  return { turn: clamp(difference*1.85,-1,1), drift: false, brake: Math.abs(difference) > .85,throttle:1 }
}

/** A separate, guided service lane rejoins the same ordered race checkpoints. */
export function pitPoint(track:Track,t:number):Point&{angle:number}{
  const at=(u:number)=>{const p=trackPoint(track,PIT_ENTRY+(PIT_EXIT-PIT_ENTRY)*clamp(u,0,1)),offset=-78*Math.sin(Math.PI*clamp(u,0,1));return{x:p.x-Math.sin(p.angle)*offset,y:p.y+Math.cos(p.angle)*offset}}
  const p=at(t),before=at(t-.001),after=at(t+.001)
  return {...p,angle:Math.atan2(after.y-before.y,after.x-before.x)}
}
function hit(car:Car,closingSpeed:number):Car{
  if(car.damageCooldown>0||closingSpeed<42||car.pit!==null||car.tow>0)return car
  const stats=kartStats(car.build),severity=Math.min(.42,(closingSpeed-28)*.0017)
  return {...car,health:Math.max(0,car.health-severity/stats.durability),tires:Math.max(.05,car.tires-severity*.5/stats.tireDurability),damageCooldown:.65,impacts:car.impacts+1,charge:0}
}
function serviceCar(car:Car,track:Track,dt:number,elapsed:number):Car{
  if(car.service>0){
    const ms=Math.min(car.service,dt*1000),fraction=ms/car.service,service=Math.max(0,car.service-ms)
    return {...car,speed:0,service,health:car.health+(1-car.health)*fraction,tires:car.tires+(1-car.tires)*fraction}
  }
  const length=track.length*(PIT_EXIT-PIT_ENTRY),next=Math.min(1,(car.pit??0)+72*dt/length)
  const arriving=(car.pit??0)<.5&&next>=.5,t=arriving?.5:next,p=pitPoint(track,t)
  const updated=updateCheckpoint({...car,...p,speed:arriving?0:72,drifting:false,charge:0,boosting:0,pit:next>=1?null:t,service:arriving?SERVICE_MS:0,pitRequested:false},PIT_ENTRY+(PIT_EXIT-PIT_ENTRY)*t,elapsed)
  return next>=1?{...updated,damageCooldown:.8}:updated
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
  const elapsed=s.elapsed+dt*1000,track=TRACKS[s.track]
  let cars=s.cars.map(previous=>{
    if(previous.finishedAt!==null)return previous
    const cpu=s.mode==='race'&&previous.id>0,input=cpu?cpuInput(s,previous):inputs[previous.id]??NO_INPUT
    const request=input.pit&&!previous.pitHeld?!previous.pitRequested:previous.pitRequested
    let car:Car={...previous,damageCooldown:Math.max(0,previous.damageCooldown-dt),pitHeld:Boolean(input.pit),pitRequested:request||(cpu&&(previous.health<.48||previous.tires<.4))}
    if(car.tow>0){
      const tow=Math.max(0,car.tow-dt*1000)
      if(tow>0)return {...car,tow,speed:0}
      const p=pitPoint(track,.5)
      return {...car,...p,tow:0,pit:.5,service:SERVICE_MS,speed:0,stops:car.stops+1,checkpoint:1,progress:PIT_ENTRY+(PIT_EXIT-PIT_ENTRY)*.5,distance:car.laps+PIT_ENTRY+(PIT_EXIT-PIT_ENTRY)*.5}
    }
    if(car.health<=0&&car.pit===null)return {...car,tow:TOW_MS,speed:0,boosting:0,drifting:false,charge:0,pitRequested:false}
    if(car.pit!==null)return serviceCar(car,track,dt,elapsed)
    if(car.pitRequested&&car.progress>=PIT_ENTRY&&car.progress<=PIT_ENTRY+.025){
      const t=(car.progress-PIT_ENTRY)/(PIT_EXIT-PIT_ENTRY)
      return serviceCar({...car,pit:t,stops:car.stops+1,pitRequested:false},track,dt,elapsed)
    }
    const stats=kartStats(car.build),vector=input.vector,aiming=vector&&Math.hypot(vector.x,vector.y)>.15
    const wanted=aiming?clamp(angleDifference(Math.atan2(vector.y,vector.x),car.angle)*1.7,-1,1):clamp(Number.isFinite(input.turn)?input.turn:0,-1,1)
    const steering=car.steering+(wanted-car.steering)*Math.min(1,dt*11*stats.grip*(.7+car.tires*.3))
    const drifting=input.drift&&Math.abs(steering)>.18&&car.speed>80&&!input.brake
    let charge=drifting?Math.min(1,car.charge+dt*.7*stats.drift):0,boosting=Math.max(0,car.boosting-dt)
    if(car.drifting&&!input.drift&&car.charge>=.35){boosting=.55+car.charge*.85;charge=0}
    const pedal=clamp(Number.isFinite(input.throttle)?input.throttle!:0,0,1)
    // Drift also applies gas, allowing steering + drift with two thumbs.
    const throttle=input.brake?0:boosting>0||input.drift?1:pedal
    const condition=.55+car.health*.45,target=input.brake?0:stats.speed*(cpu?.88+car.id*.025:1)*condition*(boosting>0?1.39:1)*throttle
    const rate=input.brake?7:throttle>0?stats.acceleration:.38
    const speed=Math.max(0,car.speed+(target-car.speed)*Math.min(1,dt*rate))
    const angle=car.angle+steering*stats.steering*(drifting?1.2:1)*dt*Math.min(1,speed/70)*(.8+.2*car.tires)
    const slip=drifting?-steering*.28*stats.drift/stats.grip:0
    let x=car.x+Math.cos(angle+slip)*speed*dt,y=car.y+Math.sin(angle+slip)*speed*dt,nextSpeed=speed
    const projection=projectTrack(track,{x,y}),edge=ROAD_WIDTH/2-KART_RADIUS
    if(projection.distance>edge){
      const nx=(x-projection.x)/projection.distance,ny=(y-projection.y)/projection.distance
      const vx=Math.cos(angle+slip)*speed,vy=Math.sin(angle+slip)*speed
      const outward=Math.max(0,vx*nx+vy*ny)
      car=hit(car,outward)
      // A side scrape preserves forward motion. Only the velocity into the barrier
      // is cancelled; steer gently back along the road to avoid repeated sticking.
      const tangentX=vx-outward*nx,tangentY=vy-outward*ny
      const tangentSpeed=Math.hypot(tangentX,tangentY)
      const road=trackPoint(track,projection.progress)
      const roadHeading=angleDifference(road.angle,angle)
      const guidedHeading=angle+Math.sign(roadHeading||1)*Math.min(Math.abs(roadHeading),Math.max(.06,dt*8))
      const slideHeading=tangentSpeed>12?Math.atan2(tangentY,tangentX):guidedHeading
      const correctedAngle=angle+angleDifference(slideHeading,angle)*Math.min(.85,dt*42)
      const scale=edge/projection.distance;x=projection.x+(x-projection.x)*scale;y=projection.y+(y-projection.y)*scale
      // Glancing hits cost little speed; head-on impacts still slow the kart.
      nextSpeed=Math.max(16,Math.min(speed,tangentSpeed*.96+Math.min(speed*.22,16)))
      charge=0
      return updateCheckpoint({...car,x,y,angle:correctedAngle,steering,speed:nextSpeed,drifting:false,charge,boosting,tires:Math.max(.05,car.tires-(drifting?dt*.003/stats.tireDurability:0))},projectTrack(track,{x,y}).progress,elapsed)
    }
    return updateCheckpoint({...car,x,y,angle,steering,speed:nextSpeed,drifting,charge,boosting,tires:Math.max(.05,car.tires-(drifting?dt*.003/stats.tireDurability:0))},projectTrack(track,{x,y}).progress,elapsed)
  })
  // Separate vehicles physically; only closing impacts cause damage, never resting contact.
  for(let a=0;a<cars.length;a++)for(let b=a+1;b<cars.length;b++){
    const first=cars[a],second=cars[b],dx=second.x-first.x,dy=second.y-first.y,d=Math.hypot(dx,dy)
    if(first.finishedAt!==null||second.finishedAt!==null||first.pit!==null||second.pit!==null||first.tow>0||second.tow>0||d>=KART_RADIUS*2||d<.001)continue
    const nx=dx/d,ny=dy/d,closing=Math.max(0,-((Math.cos(second.angle)*second.speed-Math.cos(first.angle)*first.speed)*nx+(Math.sin(second.angle)*second.speed-Math.sin(first.angle)*first.speed)*ny))
    const push=(KART_RADIUS*2-d)/2
    cars[a]={...hit(first,closing),x:first.x-nx*push,y:first.y-ny*push}
    cars[b]={...hit(second,closing),x:second.x+nx*push,y:second.y+ny*push}
  }
  cars=cars.map(car=>{
    if(car.pit!==null||car.tow>0)return car
    const p=projectTrack(track,car),edge=ROAD_WIDTH/2-KART_RADIUS
    return p.distance<=edge?car:{...car,x:p.x+(car.x-p.x)*edge/p.distance,y:p.y+(car.y-p.y)*edge/p.distance}
  })
  const ended=(s.mode==='race'?cars[0].finishedAt!==null:cars.some(c=>c.finishedAt!==null))||elapsed>=RACE_LIMIT
  return {...s,elapsed,cars,phase:ended?'finished':'playing'}
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
export function readKartBest(track: TrackId,build:KartBuild=DEFAULT_BUILD): number | null {
  try { const n = JSON.parse(localStorage.getItem(KART_RECORD_KEY) ?? '{}')[track+':'+buildKey(build)]; return Number.isFinite(n) && n > 0 && n <= RACE_LIMIT ? n : null } catch { return null }
}
export function saveKartBest(track: TrackId, ms: number,build:KartBuild=DEFAULT_BUILD): boolean {
  if (!Number.isFinite(ms) || ms <= 0 || ms > RACE_LIMIT) return false
  try { const values = JSON.parse(localStorage.getItem(KART_RECORD_KEY) ?? '{}'), previous = readKartBest(track,build); if (previous !== null && previous <= ms) return false; localStorage.setItem(KART_RECORD_KEY,JSON.stringify({...values,[track+':'+buildKey(build)]:ms})); return true } catch { return false }
}
