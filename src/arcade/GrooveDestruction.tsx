import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react'
import './destruction.css'

export type DestructionWeapon='blaster'|'scatter'|'laser'|'paint'|'cannon'|'boomerang'|'flower'|'yeppo'
export type DestructionTarget={id:number;x:number;y:number;vx:number;vy:number;radius:number;hp:number;kind:'vinyl'|'gold'|'shield';spin:number}
export type DestructionShot={x:number;y:number;born:number;weapon:DestructionWeapon;hits:number}
export const DESTRUCTION_WEAPONS:Record<DestructionWeapon,{name:string;icon:string;description:string;damage:number;radius:number;cooldown:number;color:string}>={
 blaster:{name:'Bláster',icon:'✦',description:'Rápido y preciso',damage:1,radius:62,cooldown:160,color:'#8cf9ea'},
 scatter:{name:'Escopeta disco',icon:'≋',description:'Impacto de área',damage:1,radius:115,cooldown:520,color:'#ffdb7c'},
 laser:{name:'Rayo continuo',icon:'⚡',description:'Perfora los blindajes',damage:3,radius:33,cooldown:440,color:'#fa7a86'},
 paint:{name:'Pistola de pintura',icon:'◉',description:'Salpicadura gigante',damage:1,radius:140,cooldown:750,color:'#8eed79'},
 cannon:{name:'Cañón de graves',icon:'♬',description:'Onda expansiva',damage:2,radius:120,cooldown:850,color:'#d5a9ff'},
 boomerang:{name:'Vinilo bumerán',icon:'↝',description:'Doble golpe',damage:2,radius:83,cooldown:610,color:'#ffa970'},
 flower:{name:'Lanzaflores',icon:'✿',description:'Una explosión de pétalos',damage:2,radius:108,cooldown:680,color:'#fff2b9'},
 yeppo:{name:'Guante de Yeppo',icon:'☝',description:'¡PUM! Sin pedir permiso',damage:3,radius:94,cooldown:930,color:'#c8f879'},
}
export const DESTRUCTION_DURATION=60_000
export function destructionHit(target:DestructionTarget,x:number,y:number,radius:number){
 return Math.hypot(target.x-x,target.y-y)<=target.radius+radius*.55
}
export function destructionScore(kind:DestructionTarget['kind'],combo:number){
 return (kind==='gold'?300:kind==='shield'?180:100)*Math.min(4,1+Math.floor(combo/5))
}
const keys=Object.keys(DESTRUCTION_WEAPONS) as DestructionWeapon[]
const random=(min:number,max:number)=>min+Math.random()*(max-min)
function newTarget(id:number,elapsed:number):DestructionTarget{
 const radius=random(25,42)
 const kind=elapsed>12_000&&id%8===0?'shield':id%7===0?'gold':'vinyl'
 const speed=78+Math.min(145,elapsed/600)+random(-12,38)
 return {id,x:random(65,575),y:-60,vx:random(-24,24),vy:speed,radius,hp:kind==='shield'?3:1,kind,spin:random(-3,3)}
}
export default function GrooveDestruction({onBack}:{onBack:()=>void}){
 const [weapon,setWeapon]=useState<DestructionWeapon>('blaster')
 const [running,setRunning]=useState(false)
 const [elapsed,setElapsed]=useState(0)
 const [score,setScore]=useState(0)
 const [combo,setCombo]=useState(0)
 const [best,setBest]=useState(0)
 const [missed,setMissed]=useState(0)
 const [targets,setTargets]=useState<DestructionTarget[]>([])
 const [shot,setShot]=useState<DestructionShot|null>(null)
 const [message,setMessage]=useState('¡Elige tu arma, apunta y dispara!')
 const board=useRef<SVGSVGElement>(null)
 const game=useRef({elapsed:0,targets:[] as DestructionTarget[],id:0,spawn:0,last:0,running:false,lastFire:0,combo:0,score:0,best:0,missed:0})
 const selected=useRef(weapon)
 selected.current=weapon
 const reset=()=>{
  game.current={elapsed:0,targets:[],id:0,spawn:0,last:0,running:true,lastFire:-1000,combo:0,score:0,best:0,missed:0}
  setElapsed(0);setScore(0);setCombo(0);setBest(0);setMissed(0);setShot(null);setTargets([]);setMessage('¡FUEGO A LOS VINILOS!');setRunning(true)
 }
 useEffect(()=>{
  game.current.running=running
  if(!running)return
  let frame=0
  const tick=(now:number)=>{
   const g=game.current
   if(!g.running)return
   const dt=g.last?Math.min(70,now-g.last):0
   g.last=now;g.elapsed+=dt
   if(g.elapsed>=DESTRUCTION_DURATION){
    g.running=false;setRunning(false);setElapsed(DESTRUCTION_DURATION);setTargets([...g.targets]);return
   }
   g.spawn+=dt
   const interval=Math.max(330,840-g.elapsed/130)
   while(g.spawn>=interval){g.spawn-=interval;g.targets.push(newTarget(++g.id,g.elapsed))}
   for(const t of g.targets){t.y+=t.vy*dt/1000;t.x=Math.min(605,Math.max(35,t.x+t.vx*dt/1000));t.spin+=dt*.025}
   const gone=g.targets.filter(t=>t.y>810)
   if(gone.length){g.missed+=gone.length;g.combo=0;g.targets=g.targets.filter(t=>t.y<=810);setCombo(0);setMissed(g.missed)}
   setElapsed(g.elapsed);setTargets([...g.targets])
   frame=requestAnimationFrame(tick)
  }
  frame=requestAnimationFrame(tick)
  return()=>{game.current.last=0;cancelAnimationFrame(frame)}
 },[running])
 useEffect(()=>{
  const hide=()=>{if(document.hidden)setRunning(false)}
  document.addEventListener('visibilitychange',hide)
  return()=>document.removeEventListener('visibilitychange',hide)
 },[])
 const fire=(event:ReactPointerEvent<SVGSVGElement>)=>{
  if(!running)return
  event.preventDefault()
  const svg=board.current
  if(!svg)return
  const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY
  const matrix=svg.getScreenCTM();if(!matrix)return
  const hit=pt.matrixTransform(matrix.inverse())
  if(hit.x<0||hit.x>640||hit.y<0||hit.y>760)return
  const g=game.current,w=DESTRUCTION_WEAPONS[selected.current]
  if(g.elapsed-g.lastFire<w.cooldown)return
  g.lastFire=g.elapsed
  let n=0,earned=0
  g.targets=g.targets.filter(t=>{
   if(!destructionHit(t,hit.x,hit.y,w.radius))return true
   t.hp-=w.damage
   if(t.hp<=0){n++;g.combo++;g.best=Math.max(g.best,g.combo);earned+=destructionScore(t.kind,g.combo);return false}
   return true
  })
  if(n){g.score+=earned;setScore(g.score);setCombo(g.combo);setBest(g.best);setMessage(n>1?`¡MULTIDESTRUCCIÓN ×${n}! +${earned}`:`¡CRACK! +${earned}`)}
  else {g.combo=0;setCombo(0);setMessage('¡Fallaste! El siguiente no se escapa.')}
  setTargets([...g.targets])
  setShot({x:hit.x,y:hit.y,born:Date.now(),weapon:selected.current,hits:n})
  window.setTimeout(()=>setShot(previous=>previous?.born===g.lastFire?null:previous),240)
 }
 const leave=()=>{setRunning(false);onBack()}
 return <section className="content inner-page dn-page" aria-label="Groove Ninja Modo Destrucción">
  <button className="back" type="button" onClick={leave}>← VOLVER A GROOVE NINJA</button>
  <header className="dn-heading"><span>ARCADANZ / GROOVE NINJA</span><h1>MODO<br/><em>DESTRUCCIÓN.</em></h1><p>Vinilos al vuelo. Ocho armas absurdas. Sesiones de 60 segundos. Aquí no se cortan: ¡se hacen trizas!</p></header>
  <div className="dn-layout">
   <section className="dn-weapons" aria-label="Elegir arma de destrucción"><h2>ARSENAL DEL CAOS</h2><div className="dn-weapon-grid">{keys.map(key=><button type="button" key={key} aria-pressed={weapon===key} onClick={()=>setWeapon(key)}><span className="dn-weapon-symbol" aria-hidden="true">{DESTRUCTION_WEAPONS[key].icon}</span><span><strong>{DESTRUCTION_WEAPONS[key].name}</strong><small>{DESTRUCTION_WEAPONS[key].description}</small></span></button>)}</div><p>Apunta tocando el disco. Cada arma tiene alcance, potencia y tiempo de recarga propios. Los blindados necesitan más de un impacto.</p></section>
   <div className="dn-stage"><div className="dn-hud"><div>PUNTOS <strong data-testid="destruction-score">{score.toLocaleString('es-ES')}</strong></div><div>TIEMPO <strong>{Math.ceil((DESTRUCTION_DURATION-elapsed)/1000)}s</strong></div><div>COMBO <strong>×{Math.min(4,1+Math.floor(combo/5))}</strong></div></div>
    <div className="dn-board-wrap">
     <svg ref={board} onPointerDown={fire} viewBox="0 0 640 760" className="dn-board" role="img" aria-label="Dianas de vinilo para disparar" style={{touchAction:'none'}}>
      <defs><radialGradient id="dn-record"><stop stopColor="#525251"/><stop offset=".37" stopColor="#11151a"/><stop offset=".7" stopColor="#343940"/><stop offset="1" stopColor="#090d12"/></radialGradient><radialGradient id="dn-room"><stop stopColor="#535649"/><stop offset=".7" stopColor="#252c32"/><stop offset="1" stopColor="#111418"/></radialGradient></defs>
      <rect width="640" height="760" fill="url(#dn-room)"/>
      {Array.from({length:12},(_,i)=><path key={i} d={`M${i*70-120} 760 L320 210`} stroke="#dcca9144" strokeWidth="2"/>)}
      {Array.from({length:8},(_,i)=><path key={i} d={`M0 ${410+i*i*7} H640`} stroke="#dcca912d" strokeWidth="2"/>)}
      <path d="M0 105H640" stroke="#d4b86a" strokeWidth="9"/><path d="M0 125H640" stroke="#171717" strokeWidth="12"/>
      {targets.map(t=><g key={t.id} transform={`translate(${t.x} ${t.y}) rotate(${t.spin})`} className="dn-target">
       <circle cy="6" r={t.radius+4} fill="#0008"/><circle r={t.radius} fill="url(#dn-record)" stroke={t.kind==='gold'?'#fbd877':t.kind==='shield'?'#a7e5ff':'#aeb0aa'} strokeWidth="4"/>
       {[.54,.67,.78,.9].map(s=><circle key={s} r={t.radius*s} fill="none" stroke="#dee0df66" strokeWidth=".8"/>)}
       <circle r={t.radius*.38} fill={t.kind==='gold'?'#edc965':t.kind==='shield'?'#96c5d1':'#dc725a'}/><circle r={t.radius*.12} fill="#161310"/>
       {t.kind==='shield'&&<text textAnchor="middle" y={-t.radius-9} fontSize="21" fill="#d2eeff">◆ {t.hp}</text>}
      </g>)}
      {shot&&<g className="dn-shot" transform={`translate(${shot.x} ${shot.y})`} key={shot.born}>
       <circle r={DESTRUCTION_WEAPONS[shot.weapon].radius*.75} fill="none" stroke={DESTRUCTION_WEAPONS[shot.weapon].color} strokeWidth="7"/>
       <circle r="13" fill="#fff8e6" stroke={DESTRUCTION_WEAPONS[shot.weapon].color} strokeWidth="5"/>
       {Array.from({length:9},(_,i)=><path key={i} d="M24 0L76 0" stroke={i%2?'#fff2bb':DESTRUCTION_WEAPONS[shot.weapon].color} strokeWidth={i%2?2:6} transform={`rotate(${i*40})`}/>)}
      </g>}
     </svg>
     {!running&&<div className="dn-overlay"><strong>{elapsed>=DESTRUCTION_DURATION?'¡CABINA DESTROZADA!':'¿PREPARADO PARA EL CAOS?'}</strong><p>{elapsed>=DESTRUCTION_DURATION?`${score} PUNTOS · MEJOR RACHA ${best} · ${missed} VINILOS ESCAPADOS`:'Elige un arma y apunta a los discos. Los dorados puntúan más; los azules son blindados.'}</p><button type="button" onClick={reset}>{elapsed>=DESTRUCTION_DURATION?'OTRA DESTRUCCIÓN':'¡EMPEZAR DESTRUCCIÓN!'}</button>{elapsed>0&&elapsed<DESTRUCTION_DURATION&&<button type="button" className="dn-resume" onClick={()=>setRunning(true)}>REANUDAR PARTIDA</button>}</div>}
    </div>
    <div className="dn-footer"><span role="status">{message}</span><button type="button" onClick={()=>setRunning(x=>!x)} disabled={elapsed===0||elapsed>=DESTRUCTION_DURATION}>{running?'PAUSAR':'REANUDAR'}</button></div>
   </div>
  </div>
  <p className="dn-local-note">MODO EXPERIMENTAL · Puntuación local de esta sesión, sin afectar los récords competitivos ni DANZPOINTS. Armas ficticias de arcade, sin efectos reales.</p>
 </section>
}
