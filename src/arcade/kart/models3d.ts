import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { batchMeshes } from './batch3d'
import { DRIVERS, type KartBuild } from './garage'

const rubber=new THREE.MeshStandardMaterial({color:'#141b21',roughness:.92})
const graphite=new THREE.MeshStandardMaterial({color:'#233138',roughness:.56,metalness:.25})
const chrome=new THREE.MeshStandardMaterial({color:'#bdc8bd',metalness:.82,roughness:.24})
const ivory=new THREE.MeshPhysicalMaterial({color:'#eee8d5',roughness:.3,clearcoat:.7})
const visor=new THREE.MeshPhysicalMaterial({color:'#122a35',roughness:.12,metalness:.5,clearcoat:1})

export function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
export function box(w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0,r=.7){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material,x,y,z)}
function rod(a:THREE.Vector3,b:THREE.Vector3,r:number,material:THREE.Material){const m=mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m}
export function canvasTexture(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
export function flowerTexture(color='#182c2d') {return canvasTexture(128,128,c=>{c.fillStyle=color;for(let n=0;n<6;n++){const a=n*Math.PI/3;c.beginPath();c.arc(64+Math.cos(a)*28,64+Math.sin(a)*28,22,0,Math.PI*2);c.fill()}c.beginPath();c.arc(64,64,28,0,Math.PI*2);c.fill()})}
export function signTexture(text:string,sub:string,color='#d9fa69'){
  return canvasTexture(1024,256,c=>{c.fillStyle='#172b31';c.fillRect(0,0,1024,256);c.fillStyle=color;c.fillRect(0,0,12,256);c.fillRect(1012,0,12,256);c.textAlign='center';c.font='900 100px Arial';c.fillText(text,512,140);c.fillStyle='#d7e1cd';c.font='bold 22px Arial';c.fillText(sub,512,207)})
}
export type KartModel={root:THREE.Group;wheels:THREE.Group[];front:THREE.Group[];flame:THREE.Group;bumper:THREE.Group;smoke:THREE.Group;fragment:THREE.Mesh;paint:THREE.MeshPhysicalMaterial}
export function buildKart(build:KartBuild,id:number):KartModel{
  const color=build.color,driver=DRIVERS.find(d=>d.id===build.driver)??DRIVERS[0]
  const suit=new THREE.MeshStandardMaterial({color:driver.color,roughness:.8}),helmet=ivory.clone();helmet.color.set(driver.helmet)
  const root=new THREE.Group(),wheels:THREE.Group[]=[],front:THREE.Group[]=[]
  const paint=new THREE.MeshPhysicalMaterial({color,metalness:.26,roughness:.29,clearcoat:.9,clearcoatRoughness:.2})
  // Each chassis has a recognizable shape in the actual race, not only in Garage.
  root.add(box(34,3,22,graphite,0,6,0,1))
  if(build.chassis==='sprint'){
    // Lower open-wheel racer: thin pointed nose, exposed outriggers and dual wings.
    root.add(box(27,4,14,paint,-4,8,0,1),box(19,3,8,paint,17,8,0,1))
    for(const side of [-1,1]){
      root.add(box(22,4,6,paint,-5,9,side*12,1.1))
      root.add(rod(new THREE.Vector3(-13,6,side*13),new THREE.Vector3(23,6,side*9),.9,chrome))
      root.add(box(10,1.7,9,graphite,22,8,side*11,.5))
    }
    root.add(box(4,2,35,ivory,-24,10,0,.5),box(3,2,32,chrome,27,9,0,.5))
    root.add(box(3,2,15,graphite,25,7,0,.4))
  }else if(build.chassis==='hauler'){
    // Heavy crew transporter: raised wide panels, reinforced rails and a cage.
    root.add(box(43,7,29,paint,-1,9,0,2),box(13,8,30,paint,17,9,0,1))
    for(const side of [-1,1]){
      root.add(box(36,5,4,graphite,-1,13,side*15,.8))
      root.add(box(31,2,2,chrome,-2,16,side*15,.3))
      root.add(rod(new THREE.Vector3(-18,9,side*13),new THREE.Vector3(-14,25,side*12),1.4,chrome))
      root.add(rod(new THREE.Vector3(-14,25,side*12),new THREE.Vector3(3,25,side*12),1.4,chrome))
      root.add(rod(new THREE.Vector3(3,25,side*12),new THREE.Vector3(10,10,side*13),1.4,chrome))
    }
    root.add(box(4,4,35,chrome,-25,8,0,.6),box(4,4,36,chrome,26,8,0,.6))
    root.add(box(9,2,29,graphite,-10,24,0,.6))
  }else{
    // Club: middle-width sculpted shell and visible tubular frame.
    root.add(box(28,4,24,paint,2,8,0,1.5))
    for(const side of [-1,1]){
      root.add(box(22,6,6,paint,-1,10,side*13,1.4),box(20,1,1.2,ivory,0,13.1,side*14.5,.3))
      root.add(rod(new THREE.Vector3(-18,5,side*15),new THREE.Vector3(22,5,side*15),1.1,chrome))
    }
    root.add(box(9,6,26,paint,18,8,0,1.6),box(3,4,29,graphite,-23,7,0,.7))
  }
  const bumper=new THREE.Group();bumper.position.set(24,5,0);bumper.add(box(3,3,32,chrome));root.add(bumper)
  root.add(box(10,12,17,rubber,-9,15,0,2),box(18,3,17,rubber,-3,9,0,1.5))
  const engine=box(10,10,12,graphite,-17,12,0,1);root.add(engine)
  for(let n=0;n<5;n++)root.add(box(9,.6,12,chrome,-17,10+n*1.5,0,.2))
  root.add(rod(new THREE.Vector3(-18,10,8),new THREE.Vector3(-26,8,11),1.6,chrome))
  const wide=build.wheels==='endurance'?6.4:build.wheels==='light'?4.5:5.5
  const tireGeometry=new THREE.CylinderGeometry(6.7,6.7,wide,build.wheels==='slick'?28:20);tireGeometry.rotateX(Math.PI/2)
  const rimGeometry=new THREE.CylinderGeometry(4.2,4.2,5.6,12);rimGeometry.rotateX(Math.PI/2)
  const hubGeometry=new THREE.CylinderGeometry(1.8,1.8,5.9,8);hubGeometry.rotateX(Math.PI/2)
  for(const x of [-15,16])for(const side of [-1,1]){
    const steering=new THREE.Group(),wheel=new THREE.Group();steering.position.set(x,6.7,side*16)
    wheel.add(mesh(tireGeometry,rubber),mesh(rimGeometry,build.wheels==='slide'?graphite:chrome),mesh(hubGeometry,paint))
    if(build.wheels==='endurance'||build.wheels==='grip')for(let n=0;n<12;n++){const a=n*Math.PI/6,block=mesh(new THREE.BoxGeometry(2,1.1,wide+.1),rubber,Math.cos(a)*6.5,Math.sin(a)*6.5);block.rotation.z=a+Math.PI/2;wheel.add(block)}
    if(build.wheels==='slick'||build.wheels==='light'||build.wheels==='slide'){
      const ring=mesh(new THREE.TorusGeometry(build.wheels==='light'?3.8:5.6,.45,4,20),build.wheels==='slick'?ivory:paint,0,0,side*(wide/2+.1));wheel.add(ring)
    }
    if(build.wheels==='street')wheel.add(mesh(new THREE.TorusGeometry(5.8,.25,4,20),graphite,0,0,side*2.9))
    batchMeshes(wheel);steering.add(wheel);root.add(steering);wheels.push(wheel);if(x>0)front.push(steering)
  }
  // Helmeted driver, stitched suit, gloves and steering column.
  const torso=mesh(new THREE.CapsuleGeometry(5.5,8,4,10),suit,-3,17,0);torso.rotation.z=-.22;root.add(torso)
  root.add(mesh(new THREE.SphereGeometry(8.1,20,14),helmet,-2,29,0))
  root.add(mesh(new THREE.SphereGeometry(8.25,20,10,Math.PI-.85,1.7,.72,.95),visor,-2,29,0))
  for(const side of [-1,1]){
    root.add(rod(new THREE.Vector3(-2,21,side*5),new THREE.Vector3(5,16,side*9),2.3,suit),rod(new THREE.Vector3(5,16,side*9),new THREE.Vector3(10,16,side*6),2.1,suit))
    root.add(mesh(new THREE.SphereGeometry(2.6,8,6),ivory,10,16,side*6))
  }
  const steering=mesh(new THREE.TorusGeometry(6,.9,6,18),rubber,10,15,0);steering.rotation.y=Math.PI/2;root.add(steering)
  root.add(rod(new THREE.Vector3(10,13,0),new THREE.Vector3(10,8,0),.8,chrome))
  const decalMat=new THREE.MeshStandardMaterial({map:flowerTexture(),transparent:true,alphaTest:.1,roughness:.5})
  const hood=mesh(new THREE.PlaneGeometry(7,7),decalMat,18,11.15,0);hood.rotation.x=-Math.PI/2;root.add(hood)
  const top=mesh(new THREE.PlaneGeometry(6,6),decalMat,-2,37.15,0);top.rotation.x=-Math.PI/2;root.add(top)
  const badge=new THREE.MeshBasicMaterial({map:canvasTexture(128,128,c=>{c.fillStyle='#edf2d6';c.fillRect(0,0,128,128);c.fillStyle='#1b3030';c.font='900 84px Arial';c.textAlign='center';c.fillText(String(id+1).padStart(2,'0'),64,94)})})
  const number=mesh(new THREE.PlaneGeometry(6,7),badge,22.6,9,0);number.rotation.y=Math.PI/2;root.add(number)
  const flame=new THREE.Group();flame.position.set(-28,8,11)
  for(const [radius,length,hex] of [[3,13,'#caff7b'],[1.7,17,'#fff7c8']] as const){const m=mesh(new THREE.ConeGeometry(radius,length,10),new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.75,depthWrite:false}),-length/2);m.rotation.z=Math.PI/2;flame.add(m)}
  flame.visible=false;root.add(flame)
  batchMeshes(root,false)
  const smoke=new THREE.Group(),smokeMaterial=new THREE.MeshBasicMaterial({color:'#6c7778',transparent:true,opacity:.3,depthWrite:false})
  for(let n=0;n<5;n++){const puff=mesh(new THREE.SphereGeometry(1,7,5),smokeMaterial,-18,18+n*5,Math.sin(n*2)*3);puff.castShadow=false;puff.scale.setScalar(3+n*.8);smoke.add(puff)}smoke.visible=false;root.add(smoke)
  const fragment=box(3,2,12,paint,24,5,0,.3);fragment.visible=false;root.add(fragment)
  return {root,wheels,front,flame,bumper,smoke,fragment,paint}
}

export function palm(x:number,z:number,height:number){
  const g=new THREE.Group();g.position.set(x,0,z)
  const trunk=new THREE.MeshStandardMaterial({color:'#736348',roughness:1}),leaf=new THREE.MeshStandardMaterial({color:'#5d7d4d',side:THREE.DoubleSide,roughness:1})
  g.add(mesh(new THREE.CylinderGeometry(2.3,4,height,8),trunk,0,height/2,0))
  for(let n=0;n<9;n++){
    const a=n*Math.PI*2/9,positions=new Float32Array([0,height,0,Math.cos(a)*18,height+4,Math.sin(a)*18,Math.cos(a+.18)*31,height-9,Math.sin(a+.18)*31,Math.cos(a-.18)*31,height-9,Math.sin(a-.18)*31])
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(positions,3));geom.setIndex([0,1,2,0,3,1]);geom.computeVertexNormals();g.add(mesh(geom,leaf))
  }
  return g
}
