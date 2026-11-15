import Phaser from 'phaser'
import { KART_WIDTH as W, KART_HEIGHT as H, ROAD_WIDTH, TRACKS, trackPoint, type Race, type Track } from './engine'

const PALETTE = ['#d9fa69','#f595b7','#82dadd','#edb56f']
function rounded(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  c.fillStyle=fill; c.beginPath(); c.roundRect(x,y,w,h,r); c.fill()
}
function flower(c: CanvasRenderingContext2D,x:number,y:number,r:number,color:string) {
  c.fillStyle=color
  for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.arc(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.43,0,Math.PI*2);c.fill()}
  c.beginPath();c.arc(x,y,r*.5,0,Math.PI*2);c.fill()
}
function mapArt(c: CanvasRenderingContext2D, track: Track) {
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#273e40');bg.addColorStop(.5,'#162b30');bg.addColorStop(1,'#0a151f');c.fillStyle=bg;c.fillRect(0,0,W,H)
  // Water, loading bays and concrete joints are baked once per circuit.
  c.strokeStyle='#54777622';c.lineWidth=2
  for(let y=20;y<H;y+=24){c.beginPath();for(let x=0;x<W;x+=12){const yy=y+Math.sin(x*.016+y)*3;x?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke()}
  rounded(c,58,72,883,576,54,'#0007');rounded(c,48,56,884,576,54,'#3b4b48');rounded(c,53,60,874,565,50,'#2c3938')
  c.strokeStyle='#7b8a7520';c.lineWidth=1
  for(let x=55;x<930;x+=62){c.beginPath();c.moveTo(x,60);c.lineTo(x,625);c.stroke()}
  for(let y=60;y<625;y+=62){c.beginPath();c.moveTo(55,y);c.lineTo(925,y);c.stroke()}
  const path = () => {c.beginPath();track.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath()}
  c.lineJoin='round';c.lineCap='round'
  c.save();c.translate(0,10);path();c.strokeStyle='#050c12';c.lineWidth=ROAD_WIDTH+22;c.stroke();c.restore()
  path();c.strokeStyle='#738680';c.lineWidth=ROAD_WIDTH+15;c.stroke()
  // Alternating painted curbs along both sides of the asphalt.
  for(let n=0;n<track.length;n+=18){const p=trackPoint(track,n/track.length),q=trackPoint(track,(n+14)/track.length);c.strokeStyle=Math.floor(n/18)%2?'#d5d6bc':'#ad6658';c.lineWidth=ROAD_WIDTH+8;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke()}
  const road=c.createLinearGradient(0,100,0,620);road.addColorStop(0,'#3e484a');road.addColorStop(.55,'#283338');road.addColorStop(1,'#1d282d');path();c.strokeStyle=road;c.lineWidth=ROAD_WIDTH;c.stroke()
  // Fine road speckle only in the asphalt path.
  c.save();path();c.lineWidth=ROAD_WIDTH;c.strokeStyle='#58625d18';c.setLineDash([1,7]);c.stroke();c.setLineDash([]);c.restore()
  path();c.lineWidth=1;c.strokeStyle='#bfc9b529';c.setLineDash([7,18]);c.stroke();c.setLineDash([])
  for(const side of [-1,1])for(let n=0;n<track.length;n+=83){const p=trackPoint(track,n/track.length),x=p.x-Math.sin(p.angle)*side*(ROAD_WIDTH/2+12),y=p.y+Math.cos(p.angle)*side*(ROAD_WIDTH/2+12);c.save();c.translate(x,y);c.rotate(p.angle);rounded(c,-11,-4,24,10,4,'#0b151a');rounded(c,-10,-6,20,7,3,side<0?track.accent:'#a3b6ac');c.restore()}
  // Marked grid and checkerboard finish line, perpendicular to the route.
  const start=trackPoint(track,0);c.save();c.translate(start.x,start.y);c.rotate(start.angle)
  for(let row=0;row<2;row++)for(let n=0;n<10;n++){c.fillStyle=(row+n)%2?'#eef1dd':'#111d23';c.fillRect(row*7-7,n*8-40,7,8)}
  c.fillStyle='#e9e8cf';c.font='bold 12px Arial';c.textAlign='center';c.fillText('START / FINISH',-5,-54);c.restore()
  for(let n=0;n<4;n++){const p=trackPoint(track,.02-n*.008);c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.strokeStyle='#d6dfd57a';c.lineWidth=2;c.strokeRect(-17,n%2?-29:3,33,26);c.restore()}
  // Center paddock, speakers, shipping containers and leaf clusters.
  rounded(c,328,202,260,65,8,'#0006');rounded(c,322,191,260,65,8,'#18262a');rounded(c,326,195,252,52,6,'#a9b68c');
  c.fillStyle='#1c2c2d';c.font='900 32px Arial';c.textAlign='left';c.fillText('DANZ KART',339,230);flower(c,551,219,17,'#273a35')
  c.fillStyle='#b9c7b8';c.font='bold 10px Arial';c.fillText('COLLECTIVE RACING DEPARTMENT',340,250)
  for(const [x,y] of [[660,250],[690,254],[720,258]]){rounded(c,x+5,y+6,24,45,3,'#060e15');rounded(c,x,y,24,45,3,'#53646a');for(let k=0;k<5;k++){c.fillStyle='#aebcb551';c.fillRect(x+3,y+4+k*8,18,2)}}
  for(const [x,y] of [[75,90],[910,595],[300,650],[500,65]]){for(let j=0;j<6;j++){c.save();c.translate(x,y);c.rotate(j*Math.PI/3);c.fillStyle=j%2?'#526c48':'#3a563e';c.beginPath();c.ellipse(0,12,5,23,.2,0,Math.PI*2);c.fill();c.restore()}c.fillStyle='#8b9871';c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill()}
  // Warm floodlights with translucent pools, no realtime blur or shaders.
  for(const [x,y] of [[190,68],[760,76],[80,585],[915,480]]){const glow=c.createRadialGradient(x,y,0,x,y,86);glow.addColorStop(0,'#fae8ae18');glow.addColorStop(1,'#fae8ae00');c.fillStyle=glow;c.fillRect(x-86,y-86,172,172);rounded(c,x-14,y-3,28,6,2,'#09171b');rounded(c,x-11,y-4,22,3,1,'#ffe1a5')}
  c.fillStyle='#d8e0cd';c.font='900 15px Arial';c.textAlign='center';c.fillText(track.name,500,685);c.font='10px Arial';c.fillStyle='#91a79d';c.fillText('PIT LANE / DANZ COLLECTIVE · 3 LAPS · NO EXCUSES',500,701)
}
function kartArt(c: CanvasRenderingContext2D, color: string) {
  c.translate(48,48)
  c.fillStyle='#0006';c.beginPath();c.ellipse(4,6,24,17,0,0,Math.PI*2);c.fill()
  for(const x of [-12,14])for(const y of [-15,15]){rounded(c,x-5,y-5,11,9,3,'#070e13');rounded(c,x-4,y-5,9,3,1,'#47575b')}
  const body=c.createLinearGradient(-23,-12,23,12);body.addColorStop(0,'#1b292b');body.addColorStop(.35,color);body.addColorStop(.68,color);body.addColorStop(1,'#37474a')
  rounded(c,-24,-10,48,20,7,'#0b161a');rounded(c,-21,-12,41,22,7,body);rounded(c,12,-14,10,28,4,color)
  c.strokeStyle='#fff8';c.lineWidth=1;c.beginPath();c.moveTo(-15,-10);c.lineTo(13,-10);c.stroke()
  rounded(c,-20,-17,6,34,2,'#ced8c4');rounded(c,-19,-15,3,30,1,color);rounded(c,-12,-9,17,18,5,'#111a21')
  c.fillStyle='#111b20';c.beginPath();c.arc(-2,-1,10,0,Math.PI*2);c.fill();const helmet=c.createLinearGradient(-10,-8,8,8);helmet.addColorStop(0,'#ffefd2');helmet.addColorStop(.45,'#e0c9a3');helmet.addColorStop(1,'#82756b');c.fillStyle=helmet;c.beginPath();c.arc(-1,-3,8,0,Math.PI*2);c.fill()
  rounded(c,1,-8,6,11,3,'#182e37');c.fillStyle='#c6f7ed';c.fillRect(4,-7,1,7);flower(c,-3,-4,3,color)
  c.strokeStyle='#d5ae8b';c.lineWidth=3;c.beginPath();c.moveTo(-3,-10);c.lineTo(7,-10);c.moveTo(-3,8);c.lineTo(7,8);c.stroke()
  rounded(c,15,-7,7,14,3,'#e7eace');c.fillStyle='#19292c';c.font='bold 8px Arial';c.textAlign='center';c.fillText('D',18,3)
}

/** Artwork textures are created once. RAF sleeps on all menus and pauses. */
export function createKartRenderer(parent:HTMLElement,read:()=>Race,advance:(delta:number)=>void,ready:()=>void,livery=0) {
  let disposed=false,lastTick=performance.now()
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  class KartScene extends Phaser.Scene {
    private cars: Phaser.GameObjects.Image[]=[]
    private labels: Phaser.GameObjects.Text[]=[]
    private effects!: Phaser.GameObjects.Graphics
    private previous: Race|null=null
    create(){
      const state=read(),map=this.textures.createCanvas('kart-track',W,H)!
      mapArt(map.getContext(),TRACKS[state.track]);map.refresh();this.add.image(0,0,'kart-track').setOrigin(0)
      this.effects=this.add.graphics()
      state.cars.forEach((car,id)=>{
        const texture=this.textures.createCanvas(`kart-${id}`,96,96)!;kartArt(texture.getContext(),PALETTE[(livery+id)%4]);texture.refresh()
        this.cars.push(this.add.image(car.x,car.y,`kart-${id}`))
        this.labels.push(this.add.text(car.x,car.y-26,state.mode==='race'&&id>0?`CREW ${id}`:`P${id+1}`,{fontFamily:'Arial',fontStyle:'bold',fontSize:14,color:PALETTE[(livery+id)%4],backgroundColor:'#09151cbb',padding:{x:4,y:2}}).setOrigin(.5,1))
      })
      if(!disposed)ready()
    }
    update(){
      if(disposed||!this.effects)return
      const now=performance.now();advance(Math.min(250,Math.max(0,now-lastTick)));lastTick=now
      const s=read();if(s===this.previous)return;this.previous=s;const g=this.effects;g.clear()
      s.cars.forEach((car,id)=>{
        const sprite=this.cars[id];sprite.setPosition(car.x,car.y).setRotation(car.angle).setAlpha(car.finishedAt===null?1:.6)
        this.labels[id].setPosition(car.x,car.y-25)
        if(reduced.matches||s.phase!=='playing')return
        if(car.drifting){const color=car.charge>.65?0xffbd64:0x95e6ec;for(const side of [-1,1]){const x=car.x-Math.cos(car.angle)*20+Math.sin(car.angle)*side*14,y=car.y-Math.sin(car.angle)*20-Math.cos(car.angle)*side*14;g.fillStyle(color,.7).fillCircle(x,y,3+car.charge*3);g.lineStyle(2,color,.6).lineBetween(x,y,x-Math.cos(car.angle)*13,y-Math.sin(car.angle)*13)}}
        if(car.boosting>0){g.fillStyle(0xc9ff7b,.3).fillEllipse(car.x-Math.cos(car.angle)*30,car.y-Math.sin(car.angle)*30,45,25);g.lineStyle(5,0xf8f4b9,.8).lineBetween(car.x-Math.cos(car.angle)*21,car.y-Math.sin(car.angle)*21,car.x-Math.cos(car.angle)*44,car.y-Math.sin(car.angle)*44)}
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
