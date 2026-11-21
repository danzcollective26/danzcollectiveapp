import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cameraPoint,clipNear,cockpitFov,cockpitPose,cockpitSteering,duelChaseDistance,effectiveCamera} from '../src/arcade/kart/camera.ts'
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
test('first person steers relative to the driver and the local duel keeps a shared chase view',()=>{
  assert.equal(cockpitSteering({x:-.7,y:0},0),-.7);assert.equal(cockpitSteering({x:1,y:-1},1),1);assert.equal(cockpitSteering(undefined,0),0)
  assert.equal(effectiveCamera('cockpit','duel'),'follow');assert.equal(effectiveCamera('follow','duel'),'follow');assert.equal(effectiveCamera('cockpit','race'),'cockpit');assert.equal(effectiveCamera('cockpit','time'),'cockpit')
})

test('shared duel perspective keeps nearby karts large and widens smoothly for distant opponents',()=>{
  for(const aspect of [.5,1,1.8]){
    const close=duelChaseDistance(0,aspect)
    const apart=duelChaseDistance(170,aspect)
    const far=duelChaseDistance(900,aspect)
    assert.equal(close,235)
    assert.ok(apart>close&&apart<far)
    assert.ok(far<=1100)
  }
})
