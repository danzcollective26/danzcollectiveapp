import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRace, startRace, pauseRace, stepRace, cpuInput, TRACKS, NO_INPUT, projectTrack, updateCheckpoint, ROAD_WIDTH, KART_RADIUS, RACE_LAPS, raceOrder, type Race, type TrackId } from '../src/arcade/kart/engine.ts'

function advance(s:Race,time:number,frame:number){let remaining=time;while(remaining>0){const dt=Math.min(remaining,frame);s=stepRace(s,[NO_INPUT,NO_INPUT],dt);remaining-=dt}return s}
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
for(const id of ['dock','backstage'] as TrackId[])test(`A complete three-lap race is possible on ${id}`,()=>{
  let s=startRace(createRace('race',id)),frames=0
  while(s.phase!=='finished'&&frames++<11000)s=stepRace(s,s.cars.map(c=>cpuInput(s,c)),1000/60)
  assert.equal(s.phase,'finished');assert.equal(s.cars[0].laps,RACE_LAPS);assert.ok(s.elapsed<90000)
  assert.ok(s.cars.slice(1).every(c=>c.laps>=1));assert.equal(raceOrder(s)[0].id,0)
  for(const car of s.cars)assert.ok(projectTrack(TRACKS[id],car).distance<=ROAD_WIDTH/2-KART_RADIUS+.001)
})
test('A stationary steering input cannot farm laps or leave the road',()=>{
  const s=advance(startRace(createRace('time')),30000,33)
  assert.equal(s.cars[0].laps,0)
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
