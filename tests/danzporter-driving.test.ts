import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRace,stepRace,startRace,pauseRace,trackPoint,KART_RECORD_KEY,TRACKS,NO_INPUT,KART_RADIUS,PIT_ENTRY,PIT_EXIT,pitPoint,readKartBest,saveKartBest,type Race,type KartInput} from '../src/arcade/kart/engine.ts'
import {DEFAULT_BUILD,CHASSIS,WHEELS,kartStats,buildKey,type KartBuild} from '../src/arcade/kart/garage.ts'

const GAS:KartInput={...NO_INPUT,throttle:1}
function drive(s:Race,ms:number,input:KartInput=NO_INPUT){let left=ms;while(left>0){const dt=Math.min(20,left);s=stepRace(s,[input,input],dt);left-=dt}return s}
const playing=(mode:'time'|'duel'='time',build:KartBuild=DEFAULT_BUILD):Race=>({...createRace(mode,'dock',[build,build]),phase:'playing',countdown:0})

test('Gas accelerates, releasing coasts, and the brake brings the kart to rest',()=>{
  const initial=playing(),waiting=drive(initial,1000)
  assert.equal(waiting.cars[0].speed,0);assert.equal(waiting.cars[0].x,initial.cars[0].x)
  const moving=drive(initial,1200,GAS),coasting=drive(moving,400),braking=drive(moving,400,{...GAS,brake:true})
  assert.ok(moving.cars[0].speed>130);assert.ok(coasting.cars[0].speed>braking.cars[0].speed*3)
  assert.ok(drive(braking,1500,{...GAS,brake:true}).cars[0].speed<.1)
})
test('Mechanical loadouts affect actual speed while driver and paint remain cosmetic',()=>{
  const sprint=drive(playing('time',{...DEFAULT_BUILD,chassis:'sprint',wheels:'light'}),1400,GAS)
  const transport=drive(playing('time',{...DEFAULT_BUILD,chassis:'hauler',wheels:'endurance'}),1400,GAS)
  assert.ok(sprint.cars[0].speed>transport.cars[0].speed+20)
  assert.deepEqual(kartStats(DEFAULT_BUILD),kartStats({...DEFAULT_BUILD,color:'#112233',driver:'courier'}))
  assert.equal(CHASSIS.length,3);assert.equal(WHEELS.length,6)
  assert.equal(new Set(CHASSIS.flatMap(c=>WHEELS.map(w=>buildKey({...DEFAULT_BUILD,chassis:c.id,wheels:w.id})))).size,18)
})
function collision(build:KartBuild=DEFAULT_BUILD,speed=180){
  const s=playing('duel',build),p=trackPoint(TRACKS.dock,.07)
  s.cars=s.cars.map((c,i)=>({...c,x:p.x+(i===0?19:-19),y:p.y,angle:i===0?Math.PI:0,speed,progress:.07}))
  return stepRace(s,[GAS,GAS],20)
}
test('Closing impacts damage both vehicles; reinforced chassis take less damage',()=>{
  const ordinary=collision(),reinforced=collision({...DEFAULT_BUILD,chassis:'hauler'})
  assert.ok(ordinary.cars.every(c=>c.health<.9&&c.impacts===1))
  assert.ok(reinforced.cars[0].health>ordinary.cars[0].health)
  const rested=stepRace(ordinary,[NO_INPUT,NO_INPUT],150)
  assert.equal(rested.cars[0].impacts,1,'resting contact cannot apply damage every physics step')
})
test('Slow parked contact causes separation without damaging the chassis',()=>{
  const s=playing('duel'),p=trackPoint(TRACKS.dock,.07)
  s.cars=s.cars.map((c,i)=>({...c,x:p.x+(i?17:-17),y:p.y,speed:0}))
  const next=stepRace(s,[NO_INPUT,NO_INPUT],20)
  assert.ok(next.cars.every(c=>c.health===1&&c.impacts===0))
  assert.ok(Math.hypot(next.cars[0].x-next.cars[1].x,next.cars[0].y-next.cars[1].y)>=KART_RADIUS*2-.001)
})
test('A fast curb collision causes damage, and damaged engines lose top speed',()=>{
  const s=playing(),p=trackPoint(TRACKS.dock,.05)
  s.cars[0]={...s.cars[0],x:p.x,y:p.y+26,angle:Math.PI/2,speed:180}
  const hit=drive(s,100,GAS);assert.ok(hit.cars[0].health<1);assert.ok(hit.cars[0].impacts>=1)
  const healthy=playing(),worn=playing();worn.cars[0].health=.3
  assert.ok(drive(healthy,1200,GAS).cars[0].speed>drive(worn,1200,GAS).cars[0].speed+25)
})
test('A queued pit stop follows the service lane, repairs both parts and rejoins without a lap',()=>{
  const s=playing();s.cars[0].health=.3;s.cars[0].tires=.2
  let next=stepRace(s,[{...NO_INPUT,pit:true}],20)
  assert.notEqual(next.cars[0].pit,null)
  let frames=0,sawRepair=false
  while(next.cars[0].pit!==null&&frames++<1000){next=stepRace(next,[NO_INPUT],20);sawRepair||=next.cars[0].service>0}
  assert.ok(sawRepair);assert.ok(frames<1000);assert.equal(next.cars[0].health,1);assert.equal(next.cars[0].tires,1)
  assert.equal(next.cars[0].laps,0);assert.equal(next.cars[0].stops,1)
  assert.ok(Math.abs(next.cars[0].progress-PIT_EXIT)<.01)
})
test('Pit requests can be cancelled away from the entrance',()=>{
  let s=playing(),p=trackPoint(TRACKS.dock,.4);s.cars[0]={...s.cars[0],...p,progress:.4}
  s=stepRace(s,[{...NO_INPUT,pit:true}],20);assert.equal(s.cars[0].pitRequested,true)
  s=stepRace(s,[NO_INPUT],20);s=stepRace(s,[{...NO_INPUT,pit:true}],20)
  assert.equal(s.cars[0].pitRequested,false);assert.equal(s.cars[0].pit,null)
})
test('A broken kart is recovered and repaired with time and distance penalties',()=>{
  let s=playing();const p=trackPoint(TRACKS.dock,.5)
  s.cars[0]={...s.cars[0],...p,health:0,tires:.1,progress:.5,laps:1,distance:1.5,checkpoint:3}
  s=stepRace(s,[NO_INPUT],20);assert.ok(s.cars[0].tow>0)
  let frames=0
  while((s.cars[0].tow>0||s.cars[0].pit!==null||s.cars[0].health<1)&&frames++<1000)s=stepRace(s,[NO_INPUT],20)
  assert.ok(frames<1000);assert.equal(s.cars[0].health,1);assert.equal(s.cars[0].laps,1)
  assert.ok(s.cars[0].distance<1.5);assert.ok(s.elapsed>6500);assert.equal(s.cars[0].stops,1)
})
test('Pausing freezes damage, repair and tow timers, and starting preserves chosen parts',()=>{
  let s=playing('time',{...DEFAULT_BUILD,wheels:'slide'});s.cars[0].service=2000;s.cars[0].pit=.5
  const paused=pauseRace(s);assert.equal(stepRace(paused,[GAS],200),paused)
  assert.equal(startRace(paused).cars[0].build.wheels,'slide')
  const fresh=startRace({...s,phase:'finished'});assert.equal(fresh.cars[0].build.wheels,'slide');assert.equal(fresh.cars[0].health,1)
  assert.ok(pitPoint(TRACKS.dock,.5).y>trackPoint(TRACKS.dock,(PIT_ENTRY+PIT_EXIT)/2).y+65)
})
test('Time records stay separate for different mechanical configurations',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),data=new Map<string,string>()
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}})
  try{
    const oldBackstageSlot = 'backstage:' + buildKey(DEFAULT_BUILD)
    data.set(KART_RECORD_KEY, JSON.stringify({ [oldBackstageSlot]: 42000 }))
    assert.equal(readKartBest('backstage'), null)
    assert.equal(saveKartBest('backstage', 57000), true)
    assert.equal(readKartBest('backstage'), 57000)
    assert.equal(JSON.parse(data.get(KART_RECORD_KEY)!)[oldBackstageSlot], 42000)
    const fast={...DEFAULT_BUILD,chassis:'sprint'} as KartBuild
    assert.equal(saveKartBest('dock',60000,DEFAULT_BUILD),true);assert.equal(readKartBest('dock',fast),null)
    assert.equal(saveKartBest('dock',50000,fast),true);assert.equal(readKartBest('dock',DEFAULT_BUILD),60000)
    assert.equal(readKartBest('dock',{...DEFAULT_BUILD,driver:'courier',color:'#abcdef'}),60000)
    assert.equal(saveKartBest('dock',70000,DEFAULT_BUILD),false)
  }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage')}
})
