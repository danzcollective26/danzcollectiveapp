import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRace, startRace, pauseRace, stepRace, cpuInput, TRACKS, NO_INPUT, projectTrack, updateCheckpoint, ROAD_WIDTH, KART_RADIUS, TRACK_HAZARDS, trackPoint, RACE_LAPS, raceOrder, type Race, type TrackId, type KartInput } from '../src/arcade/kart/engine.ts'
import { kartStats, DEFAULT_BUILD, type KartBuild } from '../src/arcade/kart/garage.ts'

const GAS:KartInput={...NO_INPUT,throttle:1}
function advance(s:Race,time:number,frame:number,input:KartInput=GAS){let remaining=time;while(remaining>0){const dt=Math.min(remaining,frame);s=stepRace(s,[input,input],dt);remaining-=dt}return s}
test('Full-width roads leave clearance through bends and between separate sections',()=>{
  for(const track of Object.values(TRACKS))for(let i=0;i<track.points.length;i++){
    const a=track.points[(i-1+track.points.length)%track.points.length],b=track.points[i],c=track.points[(i+1)%track.points.length]
    const cross=Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))
    if(cross>1e-8){
      const radius=Math.hypot(a.x-b.x,a.y-b.y)*Math.hypot(b.x-c.x,b.y-c.y)*Math.hypot(a.x-c.x,a.y-c.y)/(2*cross)
      assert.ok(radius>ROAD_WIDTH/2+13,`${track.id}: inner curb must not fold over`)
    }
    for(let j=i+1;j<track.points.length;j++){
      const arc=Math.min(track.lengths[j]-track.lengths[i],track.length-(track.lengths[j]-track.lengths[i]))
      if(arc>ROAD_WIDTH*2)assert.ok(Math.hypot(b.x-track.points[j].x,b.y-track.points[j].y)>ROAD_WIDTH+26,`${track.id}: separate barriers must not intersect`)
    }
  }
})
test('Kart countdown and pause never move the grid or consume race time',()=>{
  const s=startRace(createRace('duel')),counting=stepRace(s,[NO_INPUT],1500)
  // Catch-up is capped to 250 ms so a suspended tab cannot skip the start.
  assert.equal(counting.countdown,2750);assert.equal(counting.elapsed,0);assert.deepEqual(counting.cars,s.cars)
  const paused=pauseRace(counting);assert.equal(stepRace(paused,[NO_INPUT],250),paused)
  assert.equal(startRace(paused).phase,'countdown')
})
test('Kart physics is independent of 16, 33 and 50 ms render cadence',()=>{
  const states=[16,33,50].map(dt=>advance(startRace(createRace('time')),9000,dt))
  for(const state of states){assert.ok(Math.abs(state.elapsed-6000)<.001);assert.ok(Math.abs(state.cars[0].x-states[0].cars[0].x)<.001);assert.ok(Math.abs(state.cars[0].y-states[0].cars[0].y)<.001)}
})
for(const id of Object.keys(TRACKS) as TrackId[])test(`A complete three-lap race is possible on ${id}`,()=>{
  let s=startRace(createRace('race',id)),frames=0
  while(s.phase!=='finished'&&frames++<11000)s=stepRace(s,s.cars.map(c=>cpuInput(s,c)),1000/60)
  assert.equal(s.phase,'finished');assert.equal(s.cars[0].laps,RACE_LAPS);assert.ok(s.elapsed<90000)
  assert.ok(s.cars.slice(1).every(c=>c.laps>=1));assert.equal(raceOrder(s)[0].id,0)
  for(const car of s.cars)assert.ok(projectTrack(TRACKS[id],car).distance<=ROAD_WIDTH/2-KART_RADIUS+.001)
})
test('A stationary steering input cannot farm laps or leave the road',()=>{
  const initial=createRace('time'),s=advance(startRace(initial),30000,33,NO_INPUT)
  assert.equal(s.cars[0].laps,0)
  assert.equal(s.cars[0].x,initial.cars[0].x);assert.equal(s.cars[0].y,initial.cars[0].y)
  assert.ok(projectTrack(TRACKS.dock,s.cars[0]).distance<=ROAD_WIDTH/2-KART_RADIUS+.001)
})
test('Ordered checkpoints reject reversing over start and teleporting',()=>{
  let car=createRace('time').cars[0]
  for(let i=0;i<20;i++){car=updateCheckpoint(car,.99,100);car=updateCheckpoint(car,.01,200)}
  assert.equal(car.laps,0);assert.equal(car.checkpoint,1)
  car=updateCheckpoint(car,.4,300);car=updateCheckpoint(car,.8,400);car=updateCheckpoint(car,.01,500)
  assert.equal(car.laps,0)
})
test('Drifting charges through a corner and releasing creates a finite boost',()=>{
  let s=advance(startRace(createRace('time')),3000,20),frames=0
  while(s.cars[0].charge<.4&&frames++<1800){const input={...cpuInput(s,s.cars[0]),drift:true};s=stepRace(s,[input],1000/60)}
  assert.ok(s.cars[0].charge>=.4,'driver reaches a charged corner')
  s=stepRace(s,[{...cpuInput(s,s.cars[0]),drift:false}],1000/60)
  assert.ok(s.cars[0].boosting>.5);assert.equal(s.cars[0].charge,0)
  s=advance(s,2500,20);assert.equal(s.cars[0].boosting,0)
})
test('Two local players receive independent commands and braking reduces speed',()=>{
  let s=advance(startRace(createRace('duel')),4000,20)
  const before=s.cars[0].speed
  s=stepRace(s,[{turn:-1,brake:true,drift:false},{turn:1,brake:false,drift:false}],200)
  assert.ok(s.cars[0].speed<before);assert.notEqual(s.cars[0].angle,s.cars[1].angle)
  assert.equal(stepRace(s,[NO_INPUT],Number.NaN),s)
})

test('Midnight Chicane is a distinct selectable track with safe geometry and three laps',()=>{
  const midnight=TRACKS.midnight
  // A genuinely new course, not the dock's C silhouette with a small kink.
  assert.notEqual(midnight.points.length,TRACKS.dock.points.length)
  assert.ok(midnight.length>1500,'there is room for a full competitive lap')
  assert.ok(Math.hypot(midnight.points[0].x-TRACKS.dock.points[0].x,midnight.points[0].y-TRACKS.dock.points[0].y)>200,
    'the opening segment must not trace the old circuit')
  assert.equal(createRace('time','midnight').track,'midnight')
  assert.equal(createRace('race','midnight').cars.length,4)
  assert.ok(midnight.points.every(p=>p.x>=ROAD_WIDTH/2&&p.x<=1000-ROAD_WIDTH/2&&p.y>=ROAD_WIDTH/2&&p.y<=720-ROAD_WIDTH/2))
})

test('Chassis choice changes handling and impact resistance, not merely the picture',()=>{
  const build=(chassis:KartBuild['chassis']):KartBuild=>({...DEFAULT_BUILD,chassis})
  const club=kartStats(build('club')),sprint=kartStats(build('sprint')),transport=kartStats(build('hauler'))
  assert.ok(sprint.speed>club.speed*1.1,'Sprint has clearly higher top speed')
  assert.ok(sprint.acceleration>club.acceleration*1.1,'Sprint launches faster')
  assert.ok(sprint.steering>club.steering,'Sprint turns more quickly')
  assert.ok(sprint.durability<club.durability,'Sprint pays for speed with fragility')
  assert.ok(transport.speed<club.speed*.9,'Transport trades away top speed')
  assert.ok(transport.acceleration<club.acceleration*.9,'Transport accelerates more slowly')
  assert.ok(transport.steering<club.steering,'Transport is less nimble')
  assert.ok(transport.durability>club.durability*1.5,'Transport resists impacts')
})

test('Hazards allow safe central driving and are always visible on the road',()=>{
  for(const id of Object.keys(TRACKS) as TrackId[]){
    const track=TRACKS[id],hazards=TRACK_HAZARDS[id]
    assert.ok(hazards.length>=2)
    for(const h of hazards){
      const distance=projectTrack(track,h).distance
      assert.ok(h.progress>.18&&h.progress<.95,'start and pit remain clear')
      assert.ok(distance>KART_RADIUS+h.radius+4,'a centre-line kart can pass')
      assert.ok(distance+h.radius<ROAD_WIDTH/2,'obstacle stays inside painted road')
    }
  }
})
test('A flightcase impact causes damage and speed loss but cannot trap the kart',()=>{
  const hazard=TRACK_HAZARDS.midnight.find(h=>h.kind==='flightcase')!
  const track=TRACKS.midnight,p=trackPoint(track,hazard.progress)
  // Begin on the racing side of the flightcase, inside collision distance.
  const x=hazard.x+Math.sin(p.angle)*hazard.side*12
  const y=hazard.y-Math.cos(p.angle)*hazard.side*12
  const started=startRace(createRace('time','midnight'))
  const state:Race={...started,phase:'playing',countdown:0,cars:[{
    ...started.cars[0],x,y,progress:hazard.progress,angle:p.angle,speed:160,damageCooldown:0,health:1
  }]}
  const next=stepRace(state,[GAS],20).cars[0]
  assert.ok(next.impacts>=1,'contact registers an impact')
  assert.ok(next.health<1,'impact consumes health')
  assert.ok(next.speed<160,'contact slows the car')
  assert.ok(projectTrack(track,next).distance<=ROAD_WIDTH/2-KART_RADIUS+.001,'kart remains on the road')
  assert.ok(Math.hypot(next.x-hazard.x,next.y-hazard.y)>=KART_RADIUS+hazard.radius-.01,
    'collision must resolve the penetration')
})
