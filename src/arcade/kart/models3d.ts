import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const rubber=new THREE.MeshStandardMaterial({color:'#141b21',roughness:.92})
const graphite=new THREE.MeshStandardMaterial({color:'#233138',roughness:.56,metalness:.25})
const chrome=new THREE.MeshStandardMaterial({color:'#bdc8bd',metalness:.82,roughness:.24})
const ivory=new THREE.MeshPhysicalMaterial({color:'#eee8d5',roughness:.3,clearcoat:.7})
const suit=new THREE.MeshStandardMaterial({color:'#223b3e',roughness:.8})
const visor=new THREE.MeshPhysicalMaterial({color:'#122a35',roughness:.12,metalness:.5,clearcoat:1})

export function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
export function box(w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0,r=.7){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material,x,y,z)}
function rod(a:THREE.Vector3,b:THREE.Vector3,r:number,material:THREE.Material){const m=mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m}
export function canvasTexture(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
export function flowerTexture(color='#182c2d') {return canvasTexture(128,128,c=>{c.fillStyle=color;for(let n=0;n<6;n++){const a=n*Math.PI/3;c.beginPath();c.arc(64+Math.cos(a)*28,64+Math.sin(a)*28,22,0,Math.PI*2);c.fill()}c.beginPath();c.arc(64,64,28,0,Math.PI*2);c.fill()})}
export function signTexture(text:string,sub:string,color='#d9fa69'){
  return canvasTexture(1024,256,c=>{c.fillStyle='#172b31';c.fillRect(0,0,1024,256);c.fillStyle=color;c.fillRect(0,0,12,256);c.fillRect(1012,0,12,256);c.textAlign='center';c.font='900 100px Arial';c.fillText(text,512,140);c.fillStyle='#d7e1cd';c.font='bold 22px Arial';c.fillText(sub,512,207)})
}
export type KartModel={root:THREE.Group;wheels:THREE.Group[];front:THREE.Group[];flame:THREE.Group}
export function buildKart(color:string,id:number):KartModel{
  const root=new THREE.Group(),wheels:THREE.Group[]=[],front:THREE.Group[]=[]
  const paint=new THREE.MeshPhysicalMaterial({color,metalness:.26,roughness:.29,clearcoat:.9,clearcoatRoughness:.2})
  root.add(box(34,3,22,graphite,0,6,0,1),box(28,4,24,paint,2,8,0,1.5))
  for(const side of [-1,1]){
    root.add(box(22,6,6,paint,-1,10,side*13,1.4),box(20,1,1.2,ivory,0,13.1,side*14.5,.3))
    root.add(rod(new THREE.Vector3(-18,5,side*15),new THREE.Vector3(22,5,side*15),1.1,chrome))
  }
  root.add(box(9,6,26,paint,18,8,0,1.6),box(3,3,32,chrome,24,5,0,.8),box(3,4,29,graphite,-23,7,0,.7))
  root.add(box(10,12,17,rubber,-9,15,0,2),box(18,3,17,rubber,-3,9,0,1.5))
  const engine=box(10,10,12,graphite,-17,12,0,1);root.add(engine)
  for(let n=0;n<5;n++)root.add(box(9,.6,12,chrome,-17,10+n*1.5,0,.2))
  root.add(rod(new THREE.Vector3(-18,10,8),new THREE.Vector3(-26,8,11),1.6,chrome))
  const tireGeometry=new THREE.CylinderGeometry(6.7,6.7,5.5,20);tireGeometry.rotateX(Math.PI/2)
  const rimGeometry=new THREE.CylinderGeometry(4.2,4.2,5.6,12);rimGeometry.rotateX(Math.PI/2)
  const hubGeometry=new THREE.CylinderGeometry(1.8,1.8,5.9,8);hubGeometry.rotateX(Math.PI/2)
  for(const x of [-15,16])for(const side of [-1,1]){
    const steering=new THREE.Group(),wheel=new THREE.Group();steering.position.set(x,6.7,side*16)
    wheel.add(mesh(tireGeometry,rubber),mesh(rimGeometry,chrome),mesh(hubGeometry,graphite));steering.add(wheel);root.add(steering);wheels.push(wheel);if(x>0)front.push(steering)
  }
  // Helmeted driver, stitched suit, gloves and steering column.
  const torso=mesh(new THREE.CapsuleGeometry(5.5,8,4,10),suit,-3,17,0);torso.rotation.z=-.22;root.add(torso)
  root.add(mesh(new THREE.SphereGeometry(8.1,20,14),ivory,-2,29,0))
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
  return {root,wheels,front,flame}
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
