import Phaser from 'phaser'
import { KART_WIDTH as W, KART_HEIGHT as H, ROAD_WIDTH, TRACKS, TRACK_HAZARDS, PADDOCK_CENTER, PIT_ENTRY, PIT_EXIT, pitPoint, trackPoint, type Race, type Track } from './engine'
import { AXLE_LAYOUT, DRIVERS,VENUES,type KartBuild } from './garage'
import type { KartPreferences } from './preferences'

function rounded(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  c.fillStyle=fill; c.beginPath(); c.roundRect(x,y,w,h,r); c.fill()
}
function flower(c: CanvasRenderingContext2D,x:number,y:number,r:number,color:string) {
  c.fillStyle=color
  for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.arc(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.43,0,Math.PI*2);c.fill()}
  c.beginPath();c.arc(x,y,r*.5,0,Math.PI*2);c.fill()
}
function mapArt(c: CanvasRenderingContext2D, track: Track,venue:typeof VENUES[number]) {
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,venue.water);bg.addColorStop(.5,venue.sky);bg.addColorStop(1,'#0a151f');c.fillStyle=bg;c.fillRect(0,0,W,H)
  // Water, loading bays and concrete joints are baked once per circuit.
  c.strokeStyle='#54777622';c.lineWidth=2
  for(let y=20;y<H;y+=24){c.beginPath();for(let x=0;x<W;x+=12){const yy=y+Math.sin(x*.016+y)*3;x?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke()}
  rounded(c,44,28,920,690,44,'#0007');rounded(c,38,20,924,696,44,venue.ground);rounded(c,43,24,914,688,40,venue.id==='paddock'?'#777b68':'#2c3938')
  c.strokeStyle='#7b8a7520';c.lineWidth=1
  for(let x=55;x<950;x+=62){c.beginPath();c.moveTo(x,25);c.lineTo(x,708);c.stroke()}
  for(let y=25;y<708;y+=62){c.beginPath();c.moveTo(43,y);c.lineTo(955,y);c.stroke()}
  const path = () => {c.beginPath();track.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath()}
  c.lineJoin='round';c.lineCap='round'
  c.save();c.translate(0,10);path();c.strokeStyle='#050c12';c.lineWidth=ROAD_WIDTH+22;c.stroke();c.restore()
  path();c.strokeStyle='#738680';c.lineWidth=ROAD_WIDTH+15;c.stroke()
  // Alternating painted curbs along both sides of the asphalt.
  for(let n=0;n<track.length;n+=18){const p=trackPoint(track,n/track.length),q=trackPoint(track,(n+14)/track.length);c.strokeStyle=Math.floor(n/18)%2?'#d5d6bc':venue.curb;c.lineWidth=ROAD_WIDTH+8;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke()}
  const road=c.createLinearGradient(0,100,0,620);road.addColorStop(0,'#3e484a');road.addColorStop(.55,'#283338');road.addColorStop(1,'#1d282d');path();c.strokeStyle=road;c.lineWidth=ROAD_WIDTH;c.stroke()
  // Fine road speckle only in the asphalt path.
  c.save();path();c.lineWidth=ROAD_WIDTH;c.strokeStyle='#58625d18';c.setLineDash([1,7]);c.stroke();c.setLineDash([]);c.restore()
  path();c.lineWidth=1;c.strokeStyle='#bfc9b529';c.setLineDash([7,18]);c.stroke();c.setLineDash([])
  for(const side of [-1,1])for(let n=0;n<track.length;n+=83){if(side===-1&&n/track.length>PIT_ENTRY-.01&&n/track.length<PIT_EXIT+.01)continue;const p=trackPoint(track,n/track.length),x=p.x-Math.sin(p.angle)*side*(ROAD_WIDTH/2+12),y=p.y+Math.cos(p.angle)*side*(ROAD_WIDTH/2+12);c.save();c.translate(x,y);c.rotate(p.angle);rounded(c,-11,-4,24,10,4,'#0b151a');rounded(c,-10,-6,20,7,3,side<0?venue.curb:'#a3b6ac');c.restore()}
  c.beginPath();for(let n=0;n<=40;n++){const p=pitPoint(track,n/40);n?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)}c.strokeStyle='#87917a';c.lineWidth=44;c.stroke();c.strokeStyle='#424d49';c.lineWidth=40;c.stroke();c.strokeStyle=venue.curb;c.lineWidth=2;c.setLineDash([9,7]);c.stroke();c.setLineDash([])
  // Marked grid and checkerboard finish line, perpendicular to the route.
  const start=trackPoint(track,0);c.save();c.translate(start.x,start.y);c.rotate(start.angle)
  for(let row=0;row<2;row++)for(let n=0;n<10;n++){c.fillStyle=(row+n)%2?'#eef1dd':'#111d23';c.fillRect(row*7-7,n*8-40,7,8)}
  c.fillStyle='#e9e8cf';c.font='bold 12px Arial';c.textAlign='center';c.fillText('START / FINISH',-5,-54);c.restore()
  for(let n=0;n<4;n++){const p=trackPoint(track,.02-n*.014);c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.strokeStyle='#d6dfd57a';c.lineWidth=2;c.strokeRect(-17,n%2?-33:7,33,26);c.restore()}
  // Draw static hazards once into the baked track artwork.
  for(const hazard of TRACK_HAZARDS[track.id]){
    c.save();c.translate(hazard.x,hazard.y);c.rotate(hazard.angle)
    c.fillStyle='#07171c88';c.beginPath();c.ellipse(3,4,14,10,0,0,Math.PI*2);c.fill()
    if(hazard.kind==='cone'){
      c.fillStyle='#ea8e3e';c.beginPath();c.moveTo(0,-11);c.lineTo(10,9);c.lineTo(-10,9);c.closePath();c.fill()
      rounded(c,-7,3,14,3,1,'#f4e3c4');rounded(c,-11,8,22,3,1,'#222f35')
    }else{
      rounded(c,-12,-11,24,22,2,'#122830');rounded(c,-10,-9,20,18,2,'#b7a37b')
      rounded(c,-10,-1,20,4,0,'#2a3942');rounded(c,-2,-9,4,18,0,'#2a3942')
    }
    c.restore()
  }
  // The Midnight track has its own neon paddock in the central infield,
  // rather than copying the same loading-bay set directly onto the road.
  const midnight=track.id==='midnight',sx=PADDOCK_CENTER[track.id].x-130,sy=PADDOCK_CENTER[track.id].y-20
  rounded(c,sx+6,sy+6,260,40,8,'#0006');rounded(c,sx,sy,260,40,8,'#18262a')
  rounded(c,sx+4,sy+4,252,31,6,midnight?'#d6b9f7':venue.curb)
  c.fillStyle='#1c2c2d';c.font='900 26px Arial';c.textAlign='left';c.fillText('DANZPORTER',sx+17,sy+28);flower(c,sx+229,sy+19,13,'#273a35')
  c.fillStyle='#b9c7b8';c.font='bold 8px Arial';c.fillText(midnight?'MIDNIGHT / SECTOR 03':venue.name,sx+18,sy+40)
  if(midnight){
    // Painted paddock lanes and soft light pools, baked into the map texture.
    for(const y of [375,412,449]){rounded(c,370,y,225,3,1,'#c5a3e66e');rounded(c,370,y+7,12,15,3,'#45344b')}
    for(const [x,y] of [[310,355],[665,370],[510,490]]){
      const glow=c.createRadialGradient(x,y,0,x,y,55)
      glow.addColorStop(0,'#d8a8fc37');glow.addColorStop(1,'#d8a8fc00')
      c.fillStyle=glow;c.fillRect(x-55,y-55,110,110)
      rounded(c,x-8,y-4,16,8,2,'#e1bbfc')
    }
  }
  for(const [x,y] of [[660,250],[690,254],[720,258]]){rounded(c,x+5,y+6,24,45,3,'#060e15');rounded(c,x,y,24,45,3,'#53646a');for(let k=0;k<5;k++){c.fillStyle='#aebcb551';c.fillRect(x+3,y+4+k*8,18,2)}}
  for(const [x,y] of [[75,90],[910,595],[300,650],[500,65]]){for(let j=0;j<6;j++){c.save();c.translate(x,y);c.rotate(j*Math.PI/3);c.fillStyle=j%2?'#526c48':'#3a563e';c.beginPath();c.ellipse(0,12,5,23,.2,0,Math.PI*2);c.fill();c.restore()}c.fillStyle='#8b9871';c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill()}
  // Warm floodlights with translucent pools, no realtime blur or shaders.
  for(const [x,y] of [[190,68],[760,76],[80,585],[915,480]]){const glow=c.createRadialGradient(x,y,0,x,y,86);glow.addColorStop(0,'#fae8ae18');glow.addColorStop(1,'#fae8ae00');c.fillStyle=glow;c.fillRect(x-86,y-86,172,172);rounded(c,x-14,y-3,28,6,2,'#09171b');rounded(c,x-11,y-4,22,3,1,'#ffe1a5')}
  const pit=pitPoint(track,.5);rounded(c,pit.x-62,pit.y-35,124,15,3,'#16292d');c.fillStyle='#efc76c';c.font='900 13px Arial';c.textAlign='center';c.fillText('BOXES / CREW',pit.x,pit.y-23)
  for(const side of [-1,1]){c.fillStyle='#ddb865';c.fillRect(pit.x+side*32-4,pit.y-17,8,10);c.fillStyle='#e9dfc3';c.beginPath();c.arc(pit.x+side*32,pit.y-19,4,0,Math.PI*2);c.fill()}
  c.save();c.translate(942,390);c.rotate(-Math.PI/2);c.fillStyle='#d8e0cd';c.font='900 12px Arial';c.fillText(track.name,0,0);c.restore()
}
function kartArt(c: CanvasRenderingContext2D, build:KartBuild) {
  const color=build.color,driver=DRIVERS.find(d=>d.id===build.driver)??DRIVERS[0]
  c.translate(48,48)
  c.fillStyle='#0006';c.beginPath();c.ellipse(4,6,24,17,0,0,Math.PI*2);c.fill()
  const axles = AXLE_LAYOUT[build.chassis]
  for(const x of axles.positions)for(const y of [-axles.halfWidth,axles.halfWidth]){rounded(c,x-5,y-5,11,build.wheels==='endurance'?11:9,3,'#070e13');rounded(c,x-4,y-5,9,3,1,build.wheels==='slick'?'#e3d8b0':build.wheels==='slide'?color:'#47575b');if(build.wheels==='grip'||build.wheels==='endurance'){c.fillStyle='#84978b';for(let n=0;n<3;n++)c.fillRect(x-4+n*3,y-3,1,6)}}
  const body=c.createLinearGradient(-23,-12,23,12);body.addColorStop(0,'#1b292b');body.addColorStop(.35,color);body.addColorStop(.68,color);body.addColorStop(1,'#37474a')
  if(build.chassis==='sprint'){
    // Open-wheeler: long tapered nose, exposed sidepods and a contrasting aero wing.
    c.fillStyle='#091b22';c.beginPath();c.moveTo(-18,-10);c.lineTo(3,-11);c.lineTo(28,-4);c.lineTo(28,4);c.lineTo(3,11);c.lineTo(-18,10);c.closePath();c.fill()
    c.fillStyle=body;c.beginPath();c.moveTo(-19,-9);c.lineTo(2,-8);c.lineTo(30,-3);c.lineTo(30,3);c.lineTo(2,8);c.lineTo(-19,9);c.closePath();c.fill()
    rounded(c,-13,-20,7,40,1,color);rounded(c,-23,-21,5,42,1,'#dce6d6')
    rounded(c,7,-14,13,5,2,color);rounded(c,7,9,13,5,2,color)
    rounded(c,25,-15,4,30,1,'#dde3d1');rounded(c,20,-13,3,26,1,'#173038')
    rounded(c,-12,-7,13,14,4,driver.color)
  }else if(build.chassis==='hauler'){
    // Boxy utility chassis: reinforced cage, heavy side guards and double rear bumper.
    rounded(c,-25,-16,53,32,4,'#101e22')
    rounded(c,-21,-15,47,30,3,body)
    for(const y of [-17,13]){rounded(c,-26,y,52,4,1,'#e1e4d3');rounded(c,-20,y+1,40,2,1,'#1b3740')}
    for(const x of [-16,14])rounded(c,x,-14,4,28,1,'#22353a')
    rounded(c,23,-18,6,36,2,'#d9decf');rounded(c,-25,-19,4,38,1,'#abbfba')
    rounded(c,-12,-8,19,16,4,driver.color)
  }else{
    // Narrow club kart: curved shell and exposed rails.
    rounded(c,-24,-10,48,20,7,'#0b161a')
    rounded(c,-21,-12,41,22,7,body);rounded(c,12,-14,10,28,4,color)
    c.strokeStyle='#fff8';c.lineWidth=1;c.beginPath();c.moveTo(-15,-10);c.lineTo(13,-10);c.stroke()
    rounded(c,-20,-17,6,34,2,'#ced8c4');rounded(c,-19,-15,3,30,1,color)
    rounded(c,-12,-9,17,18,5,driver.color)
  }
  c.fillStyle='#111b20';c.beginPath();c.arc(-2,-1,10,0,Math.PI*2);c.fill();const helmet=c.createLinearGradient(-10,-8,8,8);helmet.addColorStop(0,'#ffefd2');helmet.addColorStop(.45,'#e0c9a3');helmet.addColorStop(1,'#82756b');c.fillStyle=helmet;c.beginPath();c.arc(-1,-3,8,0,Math.PI*2);c.fill()
  c.fillStyle=driver.helmet;c.beginPath();c.arc(-1,-3,8,0,Math.PI*2);c.fill();rounded(c,1,-8,6,11,3,'#182e37');c.fillStyle='#c6f7ed';c.fillRect(4,-7,1,7);flower(c,-3,-4,3,color)
  c.strokeStyle='#d5ae8b';c.lineWidth=3;c.beginPath();c.moveTo(-3,-10);c.lineTo(7,-10);c.moveTo(-3,8);c.lineTo(7,8);c.stroke()
  rounded(c,15,-7,7,14,3,'#e7eace');c.fillStyle='#19292c';c.font='bold 8px Arial';c.textAlign='center';c.fillText('D',18,3)
}

/** Artwork textures are created once. RAF sleeps on all menus and pauses. */
export function createKartRenderer(parent:HTMLElement,read:()=>Race,advance:(delta:number)=>void,ready:()=>void,options:()=>KartPreferences) {
  let disposed=false,lastTick=performance.now();parent.dataset.projection='track'
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  class KartScene extends Phaser.Scene {
    private cars: Phaser.GameObjects.Image[]=[]
    private labels: Phaser.GameObjects.Text[]=[]
    private effects!: Phaser.GameObjects.Graphics
    private previous: Race|null=null
    private impacts:number[]=[]
    private bursts:number[]=[]
    create(){
      const state=read(),map=this.textures.createCanvas('kart-track',W,H)!
      mapArt(map.getContext(),TRACKS[state.track],VENUES.find(v=>v.id===options().venue)??VENUES[0]);map.refresh();this.add.image(0,0,'kart-track').setOrigin(0)
      this.effects=this.add.graphics()
      state.cars.forEach((car,id)=>{
        const texture=this.textures.createCanvas(`kart-${id}`,96,96)!;kartArt(texture.getContext(),car.build);texture.refresh()
        this.cars.push(this.add.image(car.x,car.y,`kart-${id}`))
        this.labels.push(this.add.text(car.x,car.y-26,state.mode==='race'&&id>0?`CREW ${id}`:`P${id+1}`,{fontFamily:'Arial',fontStyle:'bold',fontSize:14,color:car.build.color,backgroundColor:'#09151cbb',padding:{x:4,y:2}}).setOrigin(.5,1));this.impacts[id]=0;this.bursts[id]=-10000
      })
      if(!disposed)ready()
    }
    update(){
      if(disposed||!this.effects)return
      const now=performance.now();advance(Math.min(250,Math.max(0,now-lastTick)));lastTick=now
      const s=read();if(s===this.previous)return;this.previous=s;const g=this.effects;g.clear()
      s.cars.forEach((car,id)=>{
        const sprite=this.cars[id];sprite.setPosition(car.x,car.y).setRotation(car.angle).setAlpha(car.finishedAt===null?1:.6).setTint(Phaser.Display.Color.GetColor(255,Math.round(155+100*car.health),Math.round(140+115*car.health)))
        this.labels[id].setPosition(car.x,car.y-25)
        const label=car.service>0?'REPARANDO':car.tow>0?'GRÚA':s.mode==='race'&&id>0?`CREW ${id}`:`P${id+1}`;if(this.labels[id].text!==label)this.labels[id].setText(label)
        if(car.impacts!==this.impacts[id]){this.impacts[id]=car.impacts;this.bursts[id]=now}
        if(reduced.matches||s.phase!=='playing')return
        if(car.health<.65){const x=car.x+Math.cos(car.angle)*13,y=car.y+Math.sin(car.angle)*13;g.lineStyle(2,0x38231c,.9).lineBetween(x-6,y-8,x+5,y+8).lineBetween(x-5,y+8,x+7,y-5)}
        if(car.health<.35||car.tow>0)for(let n=0;n<4;n++){const rise=(n*7+now*.015)%30;g.fillStyle(0x7c8787,.4-n*.06).fillCircle(car.x-Math.cos(car.angle)*16+Math.sin(n)*5,car.y-Math.sin(car.angle)*16-rise,4+n*1.1)}
        const burst=(now-this.bursts[id])/1000;if(burst<.65)for(let n=0;n<3;n++)g.fillStyle(0xe3c799,.7-burst).fillRect(car.x+Math.cos(n*2)*burst*50,car.y+Math.sin(n*2)*burst*45,4,3)
        if(car.drifting){const color=car.charge>.65?0xffbd64:0x95e6ec;for(const side of [-1,1]){const x=car.x-Math.cos(car.angle)*20+Math.sin(car.angle)*side*14,y=car.y-Math.sin(car.angle)*20-Math.cos(car.angle)*side*14;g.fillStyle(color,.7).fillCircle(x,y,3+car.charge*3);g.lineStyle(2,color,.6).lineBetween(x,y,x-Math.cos(car.angle)*13,y-Math.sin(car.angle)*13)}}
        if(car.boosting>0){
          // Lightweight speed trails in the compatible 2D renderer. No gameplay changes.
          const forwardX=Math.cos(car.angle),forwardY=Math.sin(car.angle)
          const sideX=-forwardY,sideY=forwardX
          g.fillStyle(0xc9ff7b,.3).fillEllipse(car.x-forwardX*30,car.y-forwardY*30,45,25)
          g.lineStyle(5,0xf8f4b9,.8).lineBetween(car.x-forwardX*21,car.y-forwardY*21,car.x-forwardX*44,car.y-forwardY*44)
          for(const side of [-1,1]){
            const x=car.x-forwardX*25+sideX*side*14,y=car.y-forwardY*25+sideY*side*14
            g.lineStyle(2,0xc9ff7b,.48).lineBetween(x,y,x-forwardX*24,y-forwardY*24)
          }
        }
      })
    }
  }
  const game=new Phaser.Game({type:Phaser.AUTO,parent,width:W,height:H,backgroundColor:'#142a2e',banner:false,audio:{noAudio:true},input:{keyboard:false,mouse:false,touch:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},fps:{target:60},render:{antialias:true,roundPixels:false},scene:KartScene})
  const wake=(reset=false)=>{if(disposed||!game.isBooted)return;if(reset||!game.loop.running)lastTick=performance.now();if(!game.loop.running)game.loop.wake()}
  const idle=()=>{if(!['playing','countdown'].includes(read().phase))game.loop.sleep()}
  game.events.on(Phaser.Core.Events.POST_RENDER,idle)
  const observer=new ResizeObserver(()=>{if(!disposed&&game.isBooted){game.scale.refresh();wake()}});observer.observe(parent)
  return {wake,destroy(){disposed=true;observer.disconnect();game.events.off(Phaser.Core.Events.POST_RENDER,idle);game.destroy(true);if(game.isBooted&&!game.loop.running)game.loop.wake()}}
}
