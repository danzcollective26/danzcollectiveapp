import {useEffect,useRef,useState} from 'react'
import {mayAppear,readLedger,writeLedger,dismissed,messageHasFacts,nextPhrase,type YeppoEvent} from './rules'
import {readYeppoEnabled,setYeppoEnabled,readYeppoSilencedUntil,silenceYeppoForOneHour,YEPPO_PREFERENCE_EVENT} from './settings'
import './yeppo.css'
type Page='inicio'|'pasaporte'|'fotos'|'arcade'|'danzers'|'danzin'|'danzflor'|'danzpoints'|'cuenta'|'admin'
type Expression='neutral'|'smirk'|'wink'|'surprised'|'sleepy'|'eyebrow'
const expressions:Expression[]=['neutral','smirk','wink','surprised','sleepy','eyebrow']
function Face({expression}:{expression:Expression}){
 const sleepy=expression==='sleepy',wink=expression==='wink',brow=expression==='eyebrow'
 return <svg viewBox="0 0 100 100" className="yeppo-flower" aria-hidden="true">
  <g stroke="currentColor" strokeWidth="4.5" fill="#fff">{[[50,20],[76,35],[76,65],[50,80],[24,65],[24,35]].map(([cx,cy])=><circle key={cx+'-'+cy} cx={cx} cy={cy} r="17.8"/>)}</g>
  <circle cx="50" cy="50" r="21" fill="#dbff74" stroke="#171717" strokeWidth="2.5"/>
  <g stroke="#171717" strokeWidth="3.2" fill="none" strokeLinecap="round">
   {brow&&<path d="M36 38l13-5"/>}
   {sleepy?<><path d="M35 47q6 4 12 0M55 47q6 4 12 0"/></>:<><path d={wink?'M35 48q5 3 11 0':'M40 44v5'}/><path d="M60 44v5"/></>}
   {expression==='surprised'?<ellipse cx="50" cy="60" rx="4" ry="6"/>:<path d={expression==='smirk'||brow?'M40 58q12 11 23-3':'M40 59q10 9 20 0'}/>}
  </g>
 </svg>
}
export default function Yeppo({page,gameActive=false,events=[]}:{page:Page;gameActive?:boolean;events?:YeppoEvent[]}){
 const [enabled,setEnabled]=useState(readYeppoEnabled)
 const [visible,setVisible]=useState(false)
 const [line,setLine]=useState('')
 const [expression,setExpression]=useState<Expression>('smirk')
 const [menu,setMenu]=useState(false)
 const active=useRef(0),lastActivity=useRef(Date.now()),lastTick=useRef(Date.now()),sectionAt=useRef(Date.now()),previousPage=useRef(page)
 const until=useRef(0)
 useEffect(()=>{if(previousPage.current!==page){previousPage.current=page;sectionAt.current=Date.now()}},[page])
 useEffect(()=>{
  const refresh=()=>{setEnabled(readYeppoEnabled());if(!readYeppoEnabled())setVisible(false)}
  window.addEventListener(YEPPO_PREFERENCE_EVENT,refresh);window.addEventListener('storage',refresh)
  return()=>{window.removeEventListener(YEPPO_PREFERENCE_EVENT,refresh);window.removeEventListener('storage',refresh)}
 },[])
 useEffect(()=>{
  const activity=()=>{lastActivity.current=Date.now()}
  window.addEventListener('pointerdown',activity,{passive:true});window.addEventListener('keydown',activity)
  const interval=window.setInterval(()=>{
   const now=Date.now(),delta=Math.max(0,Math.min(1500,now-lastTick.current));lastTick.current=now
   if(document.visibilityState==='visible'&&now-lastActivity.current<90_000)active.current+=delta
   if(!enabled||visible||now<readYeppoSilencedUntil()||now<until.current||gameActive||page==='admin'||page==='cuenta'||document.hidden)return
   if(document.querySelector('[aria-modal="true"],.is-immersive,.gn-immersive,.passport-receipt,.private-gallery-viewer,.gallery-lightbox'))return
   const ledger=readLedger(now)
   if(!mayAppear(ledger,now,active.current))return
   const verified=events.find(e=>e.verified&&(!messageHasFacts(e.kind)||e.variables)&&nextPhrase(e.kind,e.variables,ledger.count))
   let category:YeppoEvent['kind']=verified?.kind??(page==='pasaporte'||page==='danzers'?'pasaporte':page==='danzflor'?'danzflor':page==='arcade'?'juego':now-sectionAt.current>150_000?'seccion':'hora')
   if(messageHasFacts(category)&&!verified)category='seccion'
   const phrase=nextPhrase(category,verified?.variables,ledger.count+Math.floor(now/60000)%9)
   if(!phrase)return
   setLine(phrase);setExpression(expressions[(ledger.count+Math.floor(now/1000))%expressions.length]);setVisible(true);setMenu(false)
   writeLedger({...ledger,count:ledger.count+1,lastAt:now})
   until.current=now+5500
  },1000)
  return()=>{clearInterval(interval);window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity)}
 },[page,gameActive,events,enabled,visible])
 useEffect(()=>{if(!visible)return;const id=window.setTimeout(()=>{setVisible(false);setMenu(false)},5500);return()=>clearTimeout(id)},[visible,line])
 const close=()=>{writeLedger(dismissed(readLedger(),Date.now()));setVisible(false);setMenu(false)}
 if(!enabled||!visible||gameActive)return null
 return <aside className="yeppo" aria-label="Yeppo, la flor de DANZ">
   <div className="yeppo-bubble"><span>{line}</span><button type="button" aria-label="Cerrar Yeppo" onClick={close}>×</button></div>
   <button type="button" className="yeppo-avatar" aria-label="Opciones de Yeppo" onClick={()=>setMenu(x=>!x)}><Face expression={expression}/><span>YEPPO</span></button>
   {menu&&<div className="yeppo-menu"><button onClick={()=>{silenceYeppoForOneHour();setVisible(false)}}>Callar 1 hora</button><button onClick={()=>{setYeppoEnabled(false);setVisible(false)}}>Desactivar</button></div>}
 </aside>
}
