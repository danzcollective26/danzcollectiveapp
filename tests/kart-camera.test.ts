import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cameraPoint,clipNear,cockpitFov,cockpitPose,cockpitSteering,effectiveCamera,followCameraPose} from '../src/arcade/kart/camera.ts'
import {TRACKS,trackPoint} from '../src/arcade/kart/engine.ts'

test('cockpit follows every circuit heading with a stable up vector and a visible road ahead',()=>{
  for(const track of Object.values(TRACKS))for(let n=0;n<100;n++){
    const car=trackPoint(track,n/100),pose=cockpitPose(car)
    const ahead=cameraPoint({x:car.x+Math.cos(car.angle)*100,y:5,z:car.y+Math.sin(car.angle)*100},pose)
    assert.ok(Math.abs(ahead.x)<1e-9);assert.ok(ahead.z>90);assert.ok(ahead.y<0)
    const right=cameraPoint({x:car.x+Math.cos(car.angle)*100-Math.sin(car.angle)*20,y:5,z:car.y+Math.sin(car.angle)*100+Math.cos(car.angle)*20},pose)
    assert.ok(right.x>19.99)
  }
  for(const aspect of [.35,.6,1,1.8,3])assert.ok(cockpitFov(aspect)>=56&&cockpitFov(aspect)<=94)
})
test('near-plane clipping keeps crossing asphalt finite and rejects faces behind the driver',()=>{
  const face=[{x:-10,y:-20,z:-5},{x:10,y:-20,z:-5},{x:10,y:-20,z:20},{x:-10,y:-20,z:20}]
  const clipped=clipNear(face);assert.equal(clipped.length,4)
  for(const p of clipped){assert.ok(p.z>=2);assert.ok(Number.isFinite(p.x/p.z)&&Number.isFinite(p.y/p.z))}
  assert.equal(clipNear(face.map(p=>({...p,z:-5}))).length,0)
})
test('first person steers relative to the driver and the local duel keeps a shared track view',()=>{
  assert.equal(cockpitSteering({x:-.7,y:0},0),-.7);assert.equal(cockpitSteering({x:1,y:-1},1),1);assert.equal(cockpitSteering(undefined,0),0)
  assert.equal(effectiveCamera('cockpit','duel'),'track');assert.equal(effectiveCamera('follow','duel'),'track');assert.equal(effectiveCamera('cockpit','race'),'cockpit');assert.equal(effectiveCamera('cockpit','time'),'cockpit')
})

test('dynamic follow camera stays behind every corner and leaves room ahead',()=>{
  for(const track of Object.values(TRACKS))for(let n=0;n<48;n++){
    const car={...trackPoint(track,n/48),speed:175}
    const {position,look}=followCameraPose(car)
    const dir={x:Math.cos(car.angle),z:Math.sin(car.angle)}
    const back=(car.x-500-position.x)*dir.x+(car.y-360-position.z)*dir.z
    const ahead=(look.x-(car.x-500))*dir.x+(look.z-(car.y-360))*dir.z
    assert.ok(back>240,'camera must remain behind the car')
    assert.ok(ahead>45&&ahead<90,'look point always leads the car')
    assert.ok(position.y>look.y+200,'camera sees the road from a legible elevated view')
  }
  const first=followCameraPose({x:500,y:360,angle:Math.PI-.01,speed:0})
  const second=followCameraPose({x:500,y:360,angle:-Math.PI+.01,speed:0})
  assert.ok(Math.hypot(first.position.x-second.position.x,first.position.z-second.position.z)<10,
    'there must be no position discontinuity at the heading wrap')
  assert.equal(effectiveCamera('track','race'),'track','approved overhead camera stays unchanged')
  assert.equal(effectiveCamera('cockpit','race'),'cockpit','approved first person stays unchanged')
})
