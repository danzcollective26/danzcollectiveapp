import type Phaser from 'phaser'

function box(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string | CanvasGradient){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,fill:string | CanvasGradient){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}

/** Local, original sprite art: the security lead and Yeppo, not a new cover. */
export function bakeClubPeople(scene:Phaser.Scene,accent:string){
  for(const role of ['security','yeppo'])for(let frame=0;frame<2;frame++){
    const texture=scene.textures.createCanvas(`club-${role}-${frame}`,96,112)!,c=texture.getContext(),step=frame?3:-3
    c.translate(48,48)
    c.fillStyle='#0007';c.beginPath();c.ellipse(0,43,25,8,0,0,Math.PI*2);c.fill()
    box(c,-14,19,12,24+step,4,'#0d1b25');box(c,3,19,12,24-step,4,'#172a34')
    box(c,-17,39+step,18,8,3,'#a8b3a3');box(c,3,39-step,18,8,3,'#bac5af');box(c,-16,43+step,17,3,1,'#101c24');box(c,4,43-step,17,3,1,'#101c24')
    const cloth=c.createLinearGradient(-25,-7,25,30);cloth.addColorStop(0,role==='security'?'#5a6459':'#65847d');cloth.addColorStop(.45,role==='security'?'#303e3e':'#314c50');cloth.addColorStop(1,'#15272d')
    box(c,-23,-6,46,36,9,cloth)
    box(c,-31,-3,12,29+step,5,'#24373c');box(c,19,-3,12,29-step,5,'#405449')
    circle(c,-25,25+step,6,'#c3916c');circle(c,25,25-step,6,'#d6a37a')
    box(c,-30,7,10,5,1,accent);box(c,20,7,10,5,1,accent)
    // Consistent costume detail across Arena and Chase. Purely baked sprite
    // highlights: facial features, silhouettes and two-frame steps stay as approved.
    c.strokeStyle=role==='security'?'#d4c9a180':'#a5ded080'
    c.lineWidth=1.5;c.beginPath();c.moveTo(-17,0);c.lineTo(-12,17);c.lineTo(-7,21)
    c.moveTo(17,0);c.lineTo(12,17);c.lineTo(7,21);c.stroke()
    box(c,-12,30+step,7,2,1,'#d9e6c077')
    box(c,5,30-step,7,2,1,'#d9e6c077')
    box(c,-9,6,18,7,1,'#cfdbc0');c.fillStyle='#263b32';c.font='bold 4px Arial';c.textAlign='center';c.fillText(role==='security'?'SECURITY':'CREW',0,11)
    box(c,-21,25,42,5,2,'#10232b');box(c,-4,25,8,5,1,'#9eac93')
    if(role==='security'){
      circle(c,0,-17,21,'#141e24');const skin=c.createLinearGradient(-18,-35,18,5);skin.addColorStop(0,'#e2b58d');skin.addColorStop(.5,'#ce976e');skin.addColorStop(1,'#986346');box(c,-18,-33,36,42,14,skin)
      circle(c,-18,-13,4,'#be885f');circle(c,18,-13,4,'#be885f')
      c.fillStyle='#282825';c.beginPath();c.ellipse(0,-28,18,10,0,Math.PI,Math.PI*2);c.fill();box(c,-17,-31,34,7,4,'#252b29')
      c.fillStyle='#3d332c';c.beginPath();c.moveTo(-17,-8);c.quadraticCurveTo(0,8,17,-8);c.lineTo(12,6);c.quadraticCurveTo(0,17,-12,6);c.closePath();c.fill()
      c.strokeStyle='#f0c59d';c.lineWidth=2;c.beginPath();c.moveTo(-8,-7);c.lineTo(-4,-6);c.moveTo(4,-6);c.lineTo(8,-7);c.stroke()
      box(c,-13,-19,10,3,1,'#302b27');box(c,3,-19,10,3,1,'#302b27');circle(c,-8,-14,2,'#1c292a');circle(c,8,-14,2,'#1c292a');c.strokeStyle='#a76e4b';c.lineWidth=2;c.beginPath();c.moveTo(0,-12);c.lineTo(-2,-5);c.lineTo(2,-4);c.stroke()
      c.strokeStyle='#d2d7b1';c.lineWidth=1;c.beginPath();c.moveTo(-9,2);c.lineTo(9,2);c.stroke()
      box(c,21,13,15,22,2,'#e9dab5');c.fillStyle='#7d7359';c.fillRect(24,18,9,1);c.fillRect(24,22,6,1);c.strokeStyle='#a45e4d';c.strokeRect(24,27,9,4)
    }else{
      for(let n=0;n<6;n++){const a=n*Math.PI/3;circle(c,Math.cos(a)*18,-15+Math.sin(a)*18,13,'#11282d');circle(c,Math.cos(a)*17,-17+Math.sin(a)*17,11,accent)}
      circle(c,0,-17,19,accent);box(c,-15,-25,30,14,6,'#19333b');box(c,-10,-22,5,6,1,'#e9ffdf');box(c,5,-22,5,6,1,'#e9ffdf');c.strokeStyle='#284135';c.lineWidth=2;c.beginPath();c.moveTo(-6,-5);c.quadraticCurveTo(0,0,7,-5);c.stroke()
    }
    texture.refresh()
  }
}

/** A baked material and light pass; no extra game loop or realtime blur. */
export function bakeClubFloor(scene:Phaser.Scene,key:string,w:number,h:number){
  const texture=scene.textures.createCanvas(key,w,h)!,c=texture.getContext()
  const floor=c.createLinearGradient(0,0,w,h);floor.addColorStop(0,'#334b4e');floor.addColorStop(.45,'#20363b');floor.addColorStop(1,'#14262e');c.fillStyle=floor;c.fillRect(0,0,w,h)
  for(let y=0;y<h;y+=36)for(let x=0;x<w;x+=36){c.fillStyle=(x+y)%72?'#c5d4ad08':'#050d141a';c.fillRect(x+1,y+1,34,34);c.fillStyle='#a4c0ae11';c.fillRect(x+2,y+2,31,1)}
  // Deterministic worn concrete, independent of gameplay randomness.
  for(let n=0;n<1500;n++){const x=(n*73+17)%w,y=(n*137+43)%h;c.fillStyle=n%2?'#b0c3ac10':'#070d151c';c.fillRect(x,y,n%4+1,1)}
  for(const [x,color] of [[w*.12,'#93dcb4'],[w*.88,'#d49e85']] as const){const glow=c.createRadialGradient(x,0,4,x,h*.1,h*.85);glow.addColorStop(0,color+'38');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(0,0,w,h)}
  c.strokeStyle='#c9d7b811';c.lineWidth=2;c.beginPath();c.moveTo(w*.25,0);c.lineTo(w*.52,h);c.lineTo(w*.7,h);c.lineTo(w*.32,0);c.closePath();c.fillStyle='#b5d4b107';c.fill();c.stroke()
  texture.refresh();scene.add.image(0,0,key).setOrigin(0)
}
