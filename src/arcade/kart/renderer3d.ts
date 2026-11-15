import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { TRACKS, ROAD_WIDTH, trackPoint, type Race, type Track } from './engine'
import { KART_LIVERIES, type KartPreferences } from './preferences'
import { mesh, box, buildKart, palm, canvasTexture, signTexture } from './models3d'
import { batchMeshes } from './batch3d'

const point=(x:number,z:number,y=0)=>new THREE.Vector3(x-500,y,z-360)
function ribbon(track:Track,inner:number,outer:number,height:number,colored=false){
  const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[]
  for(let n=0;n<=track.points.length;n++){
    const i=n%track.points.length,p=track.points[i],next=track.points[(i+1)%track.points.length],previous=track.points[(i-1+track.points.length)%track.points.length]
    const a=Math.atan2(next.y-previous.y,next.x-previous.x),distance=n===track.points.length?track.length:track.lengths[i]
    const color=new THREE.Color(Math.floor(distance/19)%2?'#dce4c9':'#b6d374')
    for(const side of [inner,outer]){positions.push(p.x-500-Math.sin(a)*side,height,p.y-360+Math.cos(a)*side);uv.push(distance/110,side/40);colors.push(color.r,color.g,color.b)}
    if(n<track.points.length){const base=n*2;indices.push(base,base+2,base+1,base+2,base+3,base+1)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(colored)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g
}
function addVenue(scene:THREE.Scene,track:Track,roadMaterial:THREE.Material,shadows:boolean){
  const concrete=new THREE.MeshStandardMaterial({color:'#59655f',roughness:.95}),dark=new THREE.MeshStandardMaterial({color:'#253a3e',roughness:.65,metalness:.28}),silver=new THREE.MeshStandardMaterial({color:'#b3bdb1',roughness:.45,metalness:.55}),lime=new THREE.MeshStandardMaterial({color:'#bccf8c',roughness:.8})
  const seaTex=canvasTexture(256,256,c=>{c.fillStyle='#355b64';c.fillRect(0,0,256,256);for(let n=0;n<100;n++){c.strokeStyle=n%2?'#2a4c561a':'#accdc41b';c.beginPath();c.moveTo(n*61%256,n*73%256);c.lineTo(n*61%256+40,n*73%256-5);c.stroke()}});seaTex.wrapS=seaTex.wrapT=THREE.RepeatWrapping;seaTex.repeat.set(18,18)
  const sea=mesh(new THREE.PlaneGeometry(7000,7000),new THREE.MeshStandardMaterial({color:'#698c90',map:seaTex,roughness:.28,metalness:.28}),0,-27,0);sea.rotation.x=-Math.PI/2;sea.castShadow=false;scene.add(sea)
  scene.add(box(1055,25,741,concrete,0,-11,0,15))
  const joints=new THREE.Group(),lineMat=new THREE.LineBasicMaterial({color:'#8d9a85',transparent:true,opacity:.12})
  for(let x=-500;x<=500;x+=65){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,2,-350),new THREE.Vector3(x,2,350)]);joints.add(new THREE.Line(g,lineMat))}
  for(let z=-325;z<=325;z+=65){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-510,2,z),new THREE.Vector3(510,2,z)]);joints.add(new THREE.Line(g,lineMat))}scene.add(joints)
  const curbMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,side:THREE.DoubleSide})
  scene.add(mesh(ribbon(track,-ROAD_WIDTH/2-7,-ROAD_WIDTH/2,4.5,true),curbMat),mesh(ribbon(track,ROAD_WIDTH/2,ROAD_WIDTH/2+7,4.5,true),curbMat))
  const road=mesh(ribbon(track,-ROAD_WIDTH/2,ROAD_WIDTH/2,5),roadMaterial);road.castShadow=false;scene.add(road)
  const barrierGeometry=new THREE.BoxGeometry(24,8,6),total=Math.floor(track.length/32)*2,barriers=new THREE.InstancedMesh(barrierGeometry,dark,total),caps=new THREE.InstancedMesh(new THREE.BoxGeometry(20,1,6.5),lime,total)
  const transform=new THREE.Object3D();let count=0
  for(const side of [-1,1])for(let distance=0;distance<track.length-32;distance+=32){
    const p=trackPoint(track,distance/track.length),offset=side*(ROAD_WIDTH/2+13);transform.position.copy(point(p.x-Math.sin(p.angle)*offset,p.y+Math.cos(p.angle)*offset,7));transform.rotation.y=-p.angle;transform.updateMatrix();barriers.setMatrixAt(count,transform.matrix);transform.position.y=11.1;transform.updateMatrix();caps.setMatrixAt(count,transform.matrix);count++
  }
  barriers.count=caps.count=count;barriers.castShadow=shadows;barriers.receiveShadow=true;scene.add(barriers,caps)
  // Crew garage between the upper straight and the interior hairpin.
  const garage=new THREE.Group();garage.position.copy(point(450,200))
  garage.add(box(255,42,35,dark,0,22,0,2),box(267,5,44,silver,0,46,0,1))
  const roof=new THREE.InstancedMesh(new THREE.BoxGeometry(1.3,1.4,41),dark,28)
  for(let i=0;i<28;i++){transform.position.set(-128+i*9.5,49,0);transform.rotation.set(0,0,0);transform.updateMatrix();roof.setMatrixAt(i,transform.matrix)}garage.add(roof)
  for(let i=0;i<3;i++){garage.add(box(62,28,1,concrete,-82+i*81,19,18,.3));for(let j=0;j<7;j++)garage.add(box(60,.5,1,dark,-82+i*81,7+j*3.5,19,.1))}
  const sign=mesh(new THREE.PlaneGeometry(188,38),new THREE.MeshBasicMaterial({map:signTexture('DANZ RACING','AFTERHOURS / CREW GARAGE')}),0,45,23);garage.add(sign);scene.add(garage)
  const containerMat=new THREE.MeshStandardMaterial({color:'#8c9d83',metalness:.2,roughness:.72})
  for(const [x,z,color] of [[945,250,'#768e83'],[920,600,'#bc906d'],[80,60,'#718b7b']] as const){
    const container=new THREE.Group();container.position.copy(point(x,z));const body=box(76,37,38,containerMat,0,20,0,1);body.material=(body.material as THREE.MeshStandardMaterial).clone();(body.material as THREE.MeshStandardMaterial).color.set(color);container.add(body)
    for(let i=0;i<11;i++)container.add(box(1.4,34,39,silver,-34+i*6.7,20,0,.2));scene.add(container)
  }
  for(const [x,z,h] of [[85,125,89],[910,637,85],[310,665,74],[620,58,80],[72,590,94]])scene.add(palm(x-500,z-360,h))
  // Floodlights and speaker stacks give the circuit its club/paddock identity.
  const lampMat=new THREE.MeshStandardMaterial({color:'#e6d8b6',emissive:'#ffe5b1',emissiveIntensity:1.8})
  for(const [x,z] of [[170,65],[865,65],[80,640],[935,510]]){const p=point(x,z);scene.add(mesh(new THREE.CylinderGeometry(1.5,2.3,85,8),silver,p.x,42,p.z),box(23,8,9,dark,p.x,85,p.z,1),box(20,5,.7,lampMat,p.x,85,p.z+5,.3))}
  const start=trackPoint(track,0),gantry=new THREE.Group();gantry.position.copy(point(start.x,start.y));gantry.rotation.y=-start.angle
  for(const side of [-1,1])gantry.add(box(5,56,5,silver,0,29,side*56,1))
  gantry.add(box(8,7,120,dark,0,58,0,1))
  const banner=mesh(new THREE.PlaneGeometry(105,20),new THREE.MeshBasicMaterial({map:signTexture('DANZ','START / FINISH')}),5,58,0);banner.rotation.y=Math.PI/2;gantry.add(banner);scene.add(gantry)
  const gridTexture=canvasTexture(128,128,c=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){c.fillStyle=(x+y)%2?'#12252c':'#e8edd4';c.fillRect(x*16,y*16,16,16)}})
  const grid=mesh(new THREE.PlaneGeometry(15,ROAD_WIDTH-4),new THREE.MeshStandardMaterial({map:gridTexture,roughness:.9}),0,5.15,0);grid.rotation.x=-Math.PI/2;gantry.add(grid)
  const routePoints=[];for(let d=0;d<track.length;d+=16){const p=trackPoint(track,d/track.length);routePoints.push(point(p.x,p.y,5.12))}routePoints.push(routePoints[0].clone())
  const route=new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints),new THREE.LineDashedMaterial({color:'#cedca5',transparent:true,opacity:.19,dashSize:7,gapSize:13}));route.computeLineDistances();scene.add(route)
  batchMeshes(scene)
}

/** Actual 3D presentation over the same deterministic, tested race simulation. */
export function createPremiumKartRenderer(parent:HTMLElement,read:()=>Race,advance:(dt:number)=>void,ready:()=>void,options:()=>KartPreferences,onFailure:()=>void){
  let disposed=false,frame=0,last=performance.now(),lastReport=last,lastRaf=last,budget=0
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),prefs=options(),lite=prefs.quality==='lite',shadows=!lite
  const renderer=new THREE.WebGLRenderer({antialias:!lite,powerPreference:'high-performance',alpha:false})
  renderer.setPixelRatio(lite?1:Math.min(devicePixelRatio,prefs.quality==='high'?2:1.5));renderer.setClearColor('#173741')
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14
  renderer.shadowMap.enabled=shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap
  renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';parent.appendChild(renderer.domElement);parent.dataset.renderMode='3d'
  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#244a50',1400,3500)
  const camera=new THREE.OrthographicCamera(-600,600,432,-432,.5,4000)
  const ambient=new THREE.HemisphereLight('#d5e9e4','#798765',2.6);scene.add(ambient)
  const sun=new THREE.DirectionalLight('#ffead2',3.3);sun.position.set(-350,800,-300);sun.castShadow=shadows;sun.shadow.mapSize.set(lite?512:innerWidth<650?512:1024,lite?512:innerWidth<650?512:1024);sun.shadow.camera.left=-650;sun.shadow.camera.right=650;sun.shadow.camera.top=650;sun.shadow.camera.bottom=-650;sun.shadow.camera.far=1800;sun.shadow.normalBias=.6;sun.shadow.bias=-.0002;scene.add(sun)
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04)
  scene.environment=environment.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose()
  const loader=new THREE.TextureLoader(),textures:THREE.Texture[]=[]
  const texture=(url:string,color=false)=>{const t=loader.load(url,loaded=>{if(disposed)loaded.dispose();else wake()},undefined,()=>{if(!disposed)parent.dataset.textureFallback='true'});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=lite?1:4;if(color)t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t}
  const asphalt=new THREE.MeshStandardMaterial({map:texture('/arcade/kart/asphalt.webp',true),normalMap:lite?null:texture('/arcade/kart/asphalt-normal.webp'),normalScale:new THREE.Vector2(.3,.3),color:'#b9c3c3',roughness:.86,metalness:.03,side:THREE.DoubleSide})
  addVenue(scene,TRACKS[read().track],asphalt,shadows)
  const cars=read().cars.map((car,id)=>{
    const color=KART_LIVERIES[(prefs.livery+id)%4].color,model=buildKart(color,id);scene.add(model.root)
    const label=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTexture(256,64,c=>{c.fillStyle='#0b2029d9';c.fillRect(0,0,256,64);c.fillStyle=color;c.font='900 37px Arial';c.textAlign='center';c.fillText(read().mode==='race'&&id>0?`CREW ${id}`:`P${id+1}`,128,45)}),depthTest:false}));label.scale.set(39,10,1);scene.add(label)
    return {...model,label,previousAngle:car.angle}
  })
  const marks=new Float32Array(256*6),markGeometry=new THREE.BufferGeometry();markGeometry.setAttribute('position',new THREE.BufferAttribute(marks,3));markGeometry.setDrawRange(0,0)
  const skid=new THREE.LineSegments(markGeometry,new THREE.LineBasicMaterial({color:'#111b23',transparent:true,opacity:.55,depthWrite:false}));skid.frustumCulled=false;scene.add(skid)
  let markIndex=0,markCount=0;const lastMarks:(THREE.Vector3|null)[]=read().cars.map(()=>null)
  const focus=new THREE.Vector3(),target=new THREE.Vector3(),look=new THREE.Vector3();let initialized=false,viewWidth=1180
  const resize=(repaint=true)=>{if(disposed)return;const r=parent.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setSize(r.width,r.height,false);camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewWidth/r.width*r.height/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();if(repaint)wake()}
  const observer=new ResizeObserver(()=>resize())
  function render(now:number){
    frame=0;if(disposed)return
    budget+=now-lastRaf;lastRaf=now
    const drawingStep=lite?1000/30:1000/60
    if(['playing','countdown'].includes(read().phase)&&budget<drawingStep-.25){frame=requestAnimationFrame(render);return}
    budget%=drawingStep
    const dt=Math.min(250,Math.max(0,now-last));last=now;advance(dt);const s=read(),p=s.cars[0]
    const follow=options().camera==='follow'&&s.mode!=='duel'&&!reduced.matches&&['playing','countdown'].includes(s.phase)
    const ratio=Math.max(.3,parent.clientWidth/Math.max(1,parent.clientHeight))
    const desired=follow?Math.max(310,Math.min(480,ratio*450)):Math.max(1180,ratio*850)
    if(Math.abs(viewWidth-desired)>.1){viewWidth=reduced.matches?desired:viewWidth+(desired-viewWidth)*Math.min(1,dt/180);resize(false)}
    target.set(follow?p.x-500+Math.cos(p.angle)*32:0,0,follow?p.y-360+Math.sin(p.angle)*32:0)
    if(!initialized||reduced.matches){focus.copy(target);initialized=true}else focus.lerp(target,1-Math.exp(-dt/100))
    camera.position.set(focus.x,follow?510:1050,focus.z+(follow?370:780));look.set(focus.x,0,focus.z);camera.lookAt(look)
    s.cars.forEach((car,id)=>{
      const model=cars[id],x=car.x-500,z=car.y-360,turn=Math.atan2(Math.sin(car.angle-model.previousAngle),Math.cos(car.angle-model.previousAngle));model.previousAngle=car.angle
      model.root.position.set(x,5,z);model.root.rotation.y=-car.angle;model.root.rotation.x=car.drifting&&!reduced.matches?Math.sin(now*.02)*.025:0
      model.root.visible=car.finishedAt===null||s.phase==='finished';model.label.visible=model.root.visible;model.label.position.set(x,53,z)
      model.wheels.forEach(w=>{w.rotation.z-=car.speed*dt/1000/6.7});model.front.forEach(w=>{w.rotation.y=-Math.max(-.38,Math.min(.38,turn*12))})
      model.flame.visible=car.boosting>0&&!reduced.matches;model.flame.scale.set(1+Math.sin(now*.035)*.12,1,1)
      const pos=new THREE.Vector3(x-Math.cos(car.angle)*16,5.2,z-Math.sin(car.angle)*16)
      if(car.drifting&&!reduced.matches&&s.phase==='playing'){
        const previous=lastMarks[id]
        if(previous&&previous.distanceToSquared(pos)>1){const i=markIndex*6;marks.set([previous.x,previous.y,previous.z,pos.x,pos.y,pos.z],i);markIndex=(markIndex+1)%256;markCount=Math.min(256,markCount+1);markGeometry.attributes.position.needsUpdate=true;markGeometry.setDrawRange(0,markCount*2)}
        lastMarks[id]=pos
      }else lastMarks[id]=null
    })
    try{renderer.render(scene,camera)}catch{onFailure();return}
    if(now-lastReport>1000){lastReport=now;parent.dataset.drawCalls=String(renderer.info.render.calls);parent.dataset.triangles=String(renderer.info.render.triangles)}
    if(['playing','countdown'].includes(s.phase))frame=requestAnimationFrame(render)
  }
  function wake(reset=false){if(disposed)return;if(reset||!frame){last=performance.now();lastRaf=last;budget=0}if(!frame)frame=requestAnimationFrame(render)}
  const lost=(event:Event)=>{event.preventDefault();if(!disposed)onFailure()};renderer.domElement.addEventListener('webglcontextlost',lost)
  observer.observe(parent);resize();ready();wake(true)
  return {wake,destroy(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost)
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),allTextures=new Set<THREE.Texture>(textures)
    scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Sprite){if('geometry' in o)geometries.add(o.geometry);const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)allTextures.add(value)}}})
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());allTextures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();delete parent.dataset.drawCalls;delete parent.dataset.triangles
  }}
}
