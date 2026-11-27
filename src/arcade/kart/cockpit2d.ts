import { ROAD_WIDTH, TRACKS, TRACK_HAZARDS, PADDOCK_CENTER, PIT_ENTRY, PIT_EXIT, pitPoint, trackPoint, type Race } from './engine'
import { AXLE_LAYOUT, DRIVERS, VENUES } from './garage'
import type { KartPreferences } from './preferences'
import { cameraPoint, clipNear, cockpitFov, cockpitPose, type CameraPoint } from './camera'

type Face={points:CameraPoint[];color:string}
const vertex=(x:number,z:number,y=5):CameraPoint=>({x,y,z})
const quad=(a:{x:number;y:number;angle:number},b:typeof a,inner:number,outer:number,height=5):CameraPoint[]=>[vertex(a.x-Math.sin(a.angle)*inner,a.y+Math.cos(a.angle)*inner,height),vertex(b.x-Math.sin(b.angle)*inner,b.y+Math.cos(b.angle)*inner,height),vertex(b.x-Math.sin(b.angle)*outer,b.y+Math.cos(b.angle)*outer,height),vertex(a.x-Math.sin(a.angle)*outer,a.y+Math.cos(a.angle)*outer,height)]

function cuboid(x:number,z:number,width:number,depth:number,height:number,color:string,angle=0,base=5):Face[]{
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>vertex(x+a*width/2*Math.cos(angle)-b*depth/2*Math.sin(angle),z+a*width/2*Math.sin(angle)+b*depth/2*Math.cos(angle),base))
  const top=corners.map(p=>({...p,y:base+height})),faces:Face[]=[{points:top,color}]
  for(let i=0;i<4;i++)faces.push({points:[corners[i],corners[(i+1)%4],top[(i+1)%4],top[i]],color:i%2?color:'#273a3d'})
  return faces
}

/** Software perspective uses the exact track, pit lane and cars. No parallel simulation. */
export function createCockpitRenderer(parent:HTMLElement,read:()=>Race,advance:(dt:number)=>void,ready:()=>void,options:()=>KartPreferences){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false})
  if(!ctx)throw new Error('Canvas unavailable')
  const c=ctx;canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none';parent.append(canvas)
  parent.dataset.projection='cockpit';const track=TRACKS[read().track],venue=VENUES.find(v=>v.id===options().venue)??VENUES[0],staticFaces:Face[]=[]
  const segmentCount=Math.ceil(track.length/11)
  for(let n=0;n<segmentCount;n++){
    const a=trackPoint(track,n/segmentCount),b=trackPoint(track,(n+1)/segmentCount)
    staticFaces.push({points:quad(a,b,-ROAD_WIDTH/2,ROAD_WIDTH/2),color:n%3?'#3b4140':'#404644'})
    for(const side of [-1,1]){
      staticFaces.push({points:quad(a,b,side*ROAD_WIDTH/2,side*(ROAD_WIDTH/2+7)),color:Math.floor(n/2)%2?'#d9d8bd':venue.curb})
      if(n%3===0&&!(side===-1&&n/segmentCount>PIT_ENTRY-.01&&n/segmentCount<PIT_EXIT+.01)){
        const offset=side*(ROAD_WIDTH/2+13);staticFaces.push(...cuboid(a.x-Math.sin(a.angle)*offset,a.y+Math.cos(a.angle)*offset,24,6,8,venue.curb,a.angle))
      }
    }
    if(n%3===0)staticFaces.push({points:quad(a,b,-.55,.55,5.2),color:'#b6baa1'})
    // Fixed wear marks: no random allocations or texture downloads per frame.
    if(n%4===0)staticFaces.push({points:quad(a,b,-26,-18,5.1),color:'#343b39'})
  }
  for(let n=0;n<40;n++)staticFaces.push({points:quad(pitPoint(track,n/40),pitPoint(track,(n+1)/40),-20,20,5.4),color:n%2?'#626951':'#59614f'})
  const paddock=PADDOCK_CENTER[track.id]
  staticFaces.push(...cuboid(paddock.x,paddock.y,255,35,42,'#647568'),...cuboid(paddock.x,paddock.y,267,44,5,'#a1aa93',0,47))
  for(const [x,z,color]of [[945,250,'#768e83'],[920,600,'#bc906d'],[80,60,'#718b7b']]as const)staticFaces.push(...cuboid(x,z,76,38,37,color))
  for(const [x,z,h]of [[85,125,89],[910,637,85],[310,665,74],[620,58,80],[72,590,94]]){
    staticFaces.push(...cuboid(x,z,4,4,h,'#8a7859'))
    for(let n=0;n<6;n++){const a=n*Math.PI/3;staticFaces.push({points:[vertex(x,z,h+4),vertex(x+Math.cos(a)*30,z+Math.sin(a)*30,h-8),vertex(x+Math.cos(a+.8)*25,z+Math.sin(a+.8)*25,h-14)],color:n%2?'#66724e':'#465e47'})}
  }
  // Fallback cockpit uses the same actual obstacles as the 3D camera.
  for(const hazard of TRACK_HAZARDS[track.id]){
    const width=hazard.kind==='cone'?16:20,height=hazard.kind==='cone'?16:18
    staticFaces.push(...cuboid(hazard.x,hazard.y,width,width,height,
      hazard.kind==='cone'?'#e79449':'#a7a084',hazard.angle))
  }
  const pit=pitPoint(track,.5);staticFaces.push(...cuboid(pit.x,pit.y,104,56,4,venue.curb,0,58))
  const start=trackPoint(track,0)
  for(let row=0;row<2;row++)for(let n=0;n<10;n++){
    const a={x:start.x+Math.cos(start.angle)*(row*7-7),y:start.y+Math.sin(start.angle)*(row*7-7),angle:start.angle},b={...a,x:a.x+Math.cos(start.angle)*7,y:a.y+Math.sin(start.angle)*7}
    staticFaces.push({points:quad(a,b,n*8-40,n*8-32,5.3),color:(row+n)%2?'#e7e4c6':'#182423'})
  }
  let disposed=false,frame=0,last=performance.now(),lastRaf=last,budget=0,width=1,height=1,dpr=1
  const resize=()=>{if(disposed)return;const r=parent.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);wake()}
  function draw(now:number){
    frame=0;if(disposed)return
    budget+=now-lastRaf;lastRaf=now
    const moving=['playing','countdown'].includes(read().phase)
    if(moving&&budget<1000/30-1){frame=requestAnimationFrame(draw);return}budget%=1000/30
    const dt=Math.min(250,Math.max(0,now-last));last=now;advance(dt)
    const state=read(),p=state.cars[0],pose=cockpitPose(p),focal=height/(2*Math.tan(cockpitFov(width/height)*Math.PI/360)),horizon=height*.5-Math.tan(pose.pitch)*focal
    c.setTransform(dpr,0,0,dpr,0,0)
    const sky=c.createLinearGradient(0,0,0,height*.6);sky.addColorStop(0,venue.sky);sky.addColorStop(1,venue.id==='night'?'#35474b':'#d8d4b7');c.fillStyle=sky;c.fillRect(0,0,width,height)
    c.fillStyle=venue.water;c.fillRect(0,horizon,width,height-horizon)
    // The port's distant warehouses stay on the horizon while the kart turns.
    c.fillStyle=venue.id==='night'?'#263536':'#7b8272';for(let n=0;n<18;n++){const x=((n*119-p.angle*280)% (width+150)+width+150)%(width+150)-80;c.fillRect(x,horizon-8-(n%4)*7,75,12+(n%4)*7)}
    const ground=clipNear([vertex(0,0,1),vertex(1000,0,1),vertex(1000,720,1),vertex(0,720,1)].map(v=>cameraPoint(v,pose)))
    const paint=(points:CameraPoint[],color:string)=>{if(points.length<3)return;c.beginPath();points.forEach((v,i)=>{const x=width*.5+v.x*focal/v.z,y=height*.5-v.y*focal/v.z;i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fillStyle=color;c.fill()}
    paint(ground,venue.ground)
    const dynamic:Face[]=[]
    for(const car of state.cars.slice(1)){
      const axles=AXLE_LAYOUT[car.build.chassis]
      const cos=Math.cos(car.angle),sin=Math.sin(car.angle)
      const part=(x:number,z:number,length:number,width:number,height:number,color:string,base=5)=>
        dynamic.push(...cuboid(car.x+x*cos-z*sin,car.y+x*sin+z*cos,length,width,height,color,car.angle,base))
      const paint=car.build.color
      if(car.build.chassis==='sprint'){
        part(-5,0,31,17,8,paint);part(16,0,21,8,6,paint);part(-19,0,5,39,3,'#eee5c9',14)
      }else if(car.build.chassis==='hauler'){
        part(0,0,47,31,13,paint);part(-14,0,16,27,6,'#43545a',18)
      }else{
        part(0,0,40,22,10,paint);part(16,0,8,28,5,paint)
      }
      const driver=DRIVERS.find(driver=>driver.id===car.build.driver)??DRIVERS[0]
      part(-3,0,13,14,12,driver.helmet,16)
      for(const x of axles.positions)for(const side of [-1,1])
        part(x,side*axles.halfWidth,11,8,10,'#141d1e',3)
    }
    const faces=[...staticFaces,...dynamic].map(face=>{const points=clipNear(face.points.map(v=>cameraPoint(v,pose)));return{points,color:face.color,depth:points.reduce((sum,p)=>sum+p.z,0)/Math.max(1,points.length)}}).filter(f=>f.points.length>2&&f.depth<2000).sort((a,b)=>b.depth-a.depth)
    for(const face of faces)paint(face.points,face.color)
    const shade=c.createLinearGradient(0,height*.48,0,height);shade.addColorStop(0,'#111b1d00');shade.addColorStop(1,'#0c171e55');c.fillStyle=shade;c.fillRect(0,0,width,height)
    parent.dataset.visibleFaces=String(faces.length)
    if(['playing','countdown'].includes(state.phase))frame=requestAnimationFrame(draw)
  }
  function wake(reset=false){if(disposed)return;if(reset||!frame){last=performance.now();lastRaf=last;budget=0}if(!frame)frame=requestAnimationFrame(draw)}
  const observer=new ResizeObserver(resize);observer.observe(parent);resize();ready();wake(true)
  return {wake,destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.remove();delete parent.dataset.projection;delete parent.dataset.visibleFaces}}
}
