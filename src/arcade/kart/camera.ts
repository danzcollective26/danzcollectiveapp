import type { Car, KartMode, Point } from './engine.ts'
import type { KartCamera } from './preferences.ts'

export type CameraPoint = { x:number; y:number; z:number }
export type CockpitPose = CameraPoint & { heading:number; pitch:number }
export const CAMERA_NEAR = 2
export const effectiveCamera = (camera:KartCamera,mode:KartMode):KartCamera => mode==='duel'?'track':camera
export const cockpitFov = (aspect:number) => Math.min(94,Math.max(56,2*Math.atan(Math.tan(43*Math.PI/180)/Math.max(.2,aspect))*180/Math.PI))
export const cockpitPose = (car:Pick<Car,'x'|'y'|'angle'>):CockpitPose => ({x:car.x+Math.cos(car.angle)*7,y:32,z:car.y+Math.sin(car.angle)*7,heading:car.angle,pitch:.065})

/** Camera coordinates shared by the compatible perspective and its clipping tests. */
export function cameraPoint(p:CameraPoint,camera:CockpitPose):CameraPoint {
  const dx=p.x-camera.x,dz=p.z-camera.z,dy=p.y-camera.y
  const forward=dx*Math.cos(camera.heading)+dz*Math.sin(camera.heading)
  return {x:-dx*Math.sin(camera.heading)+dz*Math.cos(camera.heading),y:dy*Math.cos(camera.pitch)+forward*Math.sin(camera.pitch),z:forward*Math.cos(camera.pitch)-dy*Math.sin(camera.pitch)}
}
export function clipNear(points:readonly CameraPoint[],near=CAMERA_NEAR):CameraPoint[]{
  const out:CameraPoint[]=[]
  for(let n=0;n<points.length;n++){
    const a=points[n],b=points[(n+1)%points.length],inside=a.z>=near,next=b.z>=near
    if(inside)out.push(a)
    if(inside!==next){const t=(near-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:near})}
  }
  return out
}
export function cockpitSteering(vector:Point|undefined,turn:number):number {
  return Math.max(-1,Math.min(1,turn+(vector?.x??0)))
}
