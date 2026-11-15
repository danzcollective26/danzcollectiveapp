import {useEffect,useRef,useState, type FormEvent} from 'react'
import {yeppoGuide,YEPPO_SUGGESTIONS,type GuideReply,type YeppoDestination} from './guide'
import {mayAppear,readLedger,writeLedger,dismissed,messageHasFacts,nextPhrase,type YeppoEvent} from './rules'
import {readYeppoEnabled,setYeppoEnabled,readYeppoSilencedUntil,silenceYeppoForOneHour,YEPPO_PREFERENCE_EVENT} from './settings'
import YeppoFeedback from './YeppoFeedback'
import YeppoMascot,{type YeppoMood} from './YeppoMascot'
import './yeppo.css'
type Page='inicio'|'pasaporte'|'fotos'|'arcade'|'danzers'|'danzin'|'danzflor'|'danzpoints'|'cuenta'|'admin'
type Expression=YeppoMood
const expressions:Expression[]=['neutral','smirk','wink','surprised','sleepy','eyebrow']
const INTRO_KEY='danz-yeppo-welcome-v1'
const VISIT_KEY='danz-yeppo-visit-peek-v1'
function visitPeekAvailable(){try{return !sessionStorage.getItem(VISIT_KEY)}catch{return false}}
export const yeppoWelcomePending=()=>{try{return localStorage.getItem(INTRO_KEY)!=='done'}catch{return false}}
export const markYeppoWelcomeDone=()=>{try{localStorage.setItem(INTRO_KEY,'done')}catch{/* Private browsing may disable storage. */}}
type Prank={title:string;left:number;top:number;width:number}
export default function Yeppo({page,gameActive=false,events=[],onNavigate}:{page:Page;gameActive?:boolean;events?:YeppoEvent[];onNavigate?:(page:YeppoDestination)=>void}){
 const [enabled,setEnabled]=useState(readYeppoEnabled)
 const [chatOpen,setChatOpen]=useState(false)
 const [feedbackOpen,setFeedbackOpen]=useState(false)
 const [feedbackDraft,setFeedbackDraft]=useState<{category:'error'|'sugerencia'|'ayuda'|'yeppo';message:string}>({category:'sugerencia',message:''})
 const [question,setQuestion]=useState('')
 const [chat,setChat]=useState<Array<{from:'yeppo'|'visitor';text:string;destination?:YeppoDestination;label?:string;feedbackCategory?:'error'|'sugerencia'|'ayuda'|'yeppo';feedbackDraft?:string}>>([{from:'yeppo',text:'¡Epa! Soy Yeppo. Pregúntame por fotos, sellos, juegos o ropa. No soy una IA generativa todavía, pero conozco DANZ.'}])
 const [visible,setVisible]=useState(false)
 const [roaming,setRoaming]=useState(false)
 const [roamReaction,setRoamReaction]=useState(0)
 const [visitPeek,setVisitPeek]=useState(()=>readYeppoEnabled()&&page==='inicio'&&!yeppoWelcomePending()&&visitPeekAvailable())
 const [line,setLine]=useState('')
 const [expression,setExpression]=useState<Expression>('smirk')
 const [menu,setMenu]=useState(false)
 const [welcome,setWelcome]=useState<'off'|'peek'|'intro'>(()=>{
  return readYeppoEnabled()&&page==='inicio'&&yeppoWelcomePending()?'peek':'off'
 })
 const [prank,setPrank]=useState<Prank|null>(null)
 const welcomeUsed=useRef(!yeppoWelcomePending())
 const active=useRef(0),lastActivity=useRef(Date.now()),lastTick=useRef(Date.now()),sectionAt=useRef(Date.now()),previousPage=useRef(page)
 const until=useRef(0)
 useEffect(()=>{if(previousPage.current!==page){previousPage.current=page;sectionAt.current=Date.now();setVisitPeek(false)}},[page])
 useEffect(()=>{if(!visitPeek)return;try{sessionStorage.setItem(VISIT_KEY,'done')}catch{}const timer=window.setTimeout(()=>setVisitPeek(false),4500);return()=>window.clearTimeout(timer)},[visitPeek])
 useEffect(()=>{
  const refresh=()=>{const next=readYeppoEnabled();setEnabled(next);if(!next){setVisible(false);setRoaming(false);setWelcome('off');setVisitPeek(false);setChatOpen(false);setFeedbackOpen(false)}}
  window.addEventListener(YEPPO_PREFERENCE_EVENT,refresh);window.addEventListener('storage',refresh)
  return()=>{window.removeEventListener(YEPPO_PREFERENCE_EVENT,refresh);window.removeEventListener('storage',refresh)}
 },[])
 useEffect(()=>{
  if(!enabled||welcomeUsed.current||welcome!=='peek'||page!=='inicio'||gameActive)return
  const firstTap=(event:PointerEvent)=>{
   if(!event.isPrimary||document.querySelector('[aria-modal="true"]'))return
   const target=event.target
   if(!(target instanceof Element))return
   const control=target.closest<HTMLElement>('nav button,.feature,.module,.passport-home-link')
   if(!control||control.closest('.yeppo'))return
   const rect=control.getBoundingClientRect()
   control.classList.add('yeppo-tab-trick')
   window.setTimeout(()=>control.classList.remove('yeppo-tab-trick'),850)
   const title=(control.textContent||'DANZ').trim().slice(0,24)
   welcomeUsed.current=true
   markYeppoWelcomeDone()
   setPrank({title,left:Math.max(5,Math.min(rect.left,window.innerWidth-145)),top:Math.max(60,Math.min(rect.top,window.innerHeight-70)),width:Math.max(85,Math.min(rect.width,220))})
   setWelcome('intro');setExpression('wink');setMenu(false);setVisible(false)
   const ledger=readLedger()
   writeLedger({...ledger,lastAt:Date.now(),count:Math.min(5,ledger.count+1)})
   active.current=0
   window.setTimeout(()=>setPrank(null),900)
  }
  window.addEventListener('pointerdown',firstTap,true)
  return()=>window.removeEventListener('pointerdown',firstTap,true)
 },[enabled,welcome,page,gameActive])
 useEffect(()=>{
  if(welcome!=='intro')return
  const timer=window.setTimeout(()=>setWelcome('off'),11000)
  return()=>window.clearTimeout(timer)
 },[welcome])
 useEffect(()=>{
  const activity=()=>{lastActivity.current=Date.now()}
  window.addEventListener('pointerdown',activity,{passive:true});window.addEventListener('keydown',activity)
  const interval=window.setInterval(()=>{
   const now=Date.now(),delta=Math.max(0,Math.min(1500,now-lastTick.current));lastTick.current=now
   if(document.visibilityState==='visible'&&now-lastActivity.current<90_000)active.current+=delta
   if(!enabled||welcome!=='off'||visitPeek||chatOpen||!welcomeUsed.current||visible||now<readYeppoSilencedUntil()||now<until.current||gameActive||page==='admin'||page==='cuenta'||document.hidden)return
   if(document.querySelector('[aria-modal="true"],.is-immersive,.gn-immersive,.passport-receipt,.private-gallery-viewer,.gallery-lightbox'))return
   const ledger=readLedger(now)
   if(!mayAppear(ledger,now,active.current))return
   const verified=events.find(e=>e.verified&&(!messageHasFacts(e.kind)||e.variables)&&nextPhrase(e.kind,e.variables,ledger.count))
   let category:YeppoEvent['kind']=verified?.kind??(page==='pasaporte'||page==='danzers'?'pasaporte':page==='danzflor'?'danzflor':page==='arcade'?'juego':now-sectionAt.current>150_000?'seccion':'hora')
   if(messageHasFacts(category)&&!verified)category='seccion'
   const phrase=nextPhrase(category,verified?.variables,ledger.count+Math.floor(now/60000)%9)
   if(!phrase)return
   setLine(phrase);setExpression(expressions[(ledger.count+Math.floor(now/1000))%expressions.length]);setRoaming(ledger.count%2===0);setRoamReaction(0);setVisible(true);setMenu(false)
   writeLedger({...ledger,count:ledger.count+1,lastAt:now});active.current=0
   until.current=now+5500
  },1000)
  return()=>{clearInterval(interval);window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity)}
 },[page,gameActive,events,enabled,visible,welcome,visitPeek,chatOpen])
 useEffect(()=>{if(!visible)return;const id=window.setTimeout(()=>{const ledger=readLedger();writeLedger({...ledger,dismissals:0});setVisible(false);setMenu(false)},5500);return()=>clearTimeout(id)},[visible,line])
 const talk=(value:string)=>{
  const phrase=value.trim().slice(0,300)
  if(!phrase)return
  const reply:GuideReply=yeppoGuide(phrase)
  setChat(previous=>[...previous.slice(-8),{from:'visitor',text:phrase},{from:'yeppo',...reply}])
  setQuestion('')
  setExpression('wink')
 }
 const submitQuestion=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();talk(question)}
 const openChat=()=>{setChatOpen(true);setVisible(false);setRoaming(false);setMenu(false)}
 const close=()=>{writeLedger(dismissed(readLedger(),Date.now()));setVisible(false);setRoaming(false);setMenu(false)}
 const leaveWelcome=()=>{setWelcome('off');setPrank(null)}
 if(!enabled||gameActive||page==='admin')return null
 if(welcome==='peek'&&page==='inicio')return <aside className="yeppo yeppo-first-peek" aria-label="Yeppo asomándose">
   <div className="yeppo-peek-text">Psst… ¿a dónde vas, figura?</div>
   <div className="yeppo-peek-avatar"><YeppoMascot expression="smirk"/><span>YEPPO</span></div>
 </aside>
 if(visitPeek&&page==='inicio'&&welcome==='off')return <aside className="yeppo yeppo-visit-peek" aria-label="Yeppo te saluda">
   <div className="yeppo-visit-line">¡Epa! Vuelves a DANZ. Yo vigilo el cotarro.</div>
   <div className="yeppo-peek-avatar"><YeppoMascot expression="wink"/><span>YEPPO</span></div>
 </aside>
 if(welcome==='intro')return <>
   {prank&&<div className="yeppo-stolen-tab" style={{left:prank.left,top:prank.top,width:prank.width}} aria-hidden="true">{prank.title}</div>}
   <aside className="yeppo yeppo-welcome" role="region" aria-label="Yeppo te presenta DANZ">
     <div className="yeppo-welcome-copy"><small>EH, EH… UN MOMENTO.</small><strong>SOY YEPPO. <span>LA FLOR MÁS PESADA DE DANZ.</span></strong>
       <p>Te cuento el mapa, que luego te pierdes.</p>
       <dl><div><dt>FOTOS</dt><dd>Recuerdos de las fiestas; las privadas, con tu sello.</dd></div>
       <div><dt>PASAPORTE</dt><dd>Guarda tu asistencia y desbloquea galerías.</dd></div>
       <div><dt>ARCADANZ</dt><dd>Snake y Groove. Dale caña a los récords.</dd></div>
       <div><dt>DANZFLOR</dt><dd>Ropa y colecciones del colectivo.</dd></div></dl>
       <button className="yeppo-welcome-continue" onClick={leaveWelcome}>VALE, YEPPO. DÉJAME VIVIR ↗</button>
       <small>Tranquilo, solo hago esto una vez.</small>
     </div>
     <div className="yeppo-welcome-face"><YeppoMascot expression="wink"/><span className="yeppo-welcome-stars" aria-hidden="true">✦ ✧</span></div>
   </aside>
 </>
 if(!visible&&!chatOpen)return <aside className="yeppo yeppo-available" aria-label="Hablar con Yeppo">
   <button type="button" className="yeppo-chat-launcher" onClick={openChat} aria-label="Hablar con Yeppo"><YeppoMascot expression="wink"/><span>HABLA CONMIGO</span></button>
 </aside>
 if(chatOpen)return <aside className="yeppo yeppo-chat-shell" aria-label="Charla con Yeppo">
   <section className="yeppo-chat-dialog" role="dialog" aria-label="Hablar con Yeppo">
    <header className="yeppo-chat-header"><span>🌸 YEPPO <small>GUÍA DE DANZ · SIN IA GENERATIVA</small></span><button type="button" onClick={()=>setChatOpen(false)} aria-label="Cerrar charla con Yeppo">×</button></header>
    {feedbackOpen?<YeppoFeedback page={page} initialCategory={feedbackDraft.category} initialMessage={feedbackDraft.message} onClose={()=>setFeedbackOpen(false)}/>:<div className="yeppo-chat-messages" role="log" aria-live="polite">{chat.map((message,i)=><div key={i} className={message.from==='yeppo'?'yeppo-chat-reply':'yeppo-chat-question'}>
      <p>{message.text}</p>
      {message.destination&&onNavigate&&<button type="button" onClick={()=>{setChatOpen(false);onNavigate(message.destination!)}}>{message.label??'IR A SECCIÓN'} ↗</button>}
      {message.feedbackCategory&&<button type="button" onClick={()=>{setFeedbackDraft({category:message.feedbackCategory!,message:message.feedbackDraft??''});setFeedbackOpen(true)}}>REGISTRAR {message.feedbackCategory==='sugerencia'?'SUGERENCIA':'INCIDENCIA'} ↗</button>}
    </div>)}</div>}
    {!feedbackOpen&&<div className="yeppo-chat-suggestions">{YEPPO_SUGGESTIONS.map(s=><button key={s} type="button" onClick={()=>talk(s)}>{s}</button>)}</div>}
    {!feedbackOpen&&<form className="yeppo-chat-form" onSubmit={submitQuestion}><label htmlFor="yeppo-question">Pregúntale algo a Yeppo</label><div><input id="yeppo-question" value={question} maxLength={300} autoComplete="off" onChange={e=>setQuestion(e.target.value)} placeholder="Fotos, juegos, sellos…" /><button type="submit" disabled={!question.trim()}>ENVIAR</button></div></form>}
    <button type="button" className="yeppo-feedback-open" onClick={()=>{setFeedbackDraft({category:'sugerencia',message:''});setFeedbackOpen(x=>!x)}}>{feedbackOpen?'VOLVER A HABLAR CON YEPPO':'¿UN PROBLEMA O UNA IDEA? CUÉNTAMELO ↗'}</button>
    <small className="yeppo-chat-disclaimer">Respuestas guiadas en este dispositivo. No escribas datos privados. Para información de fiestas, consulta la publicación oficial.</small>
   </section>
 </aside>
 if(visible&&roaming)return <aside className="yeppo yeppo-walkabout" data-testid="yeppo-walkabout" aria-label="Yeppo paseando por DANZ">
   <div className="yeppo-roam-stage">
    <div className="yeppo-roam-speech"><span>{roamReaction?['¡Me has pillado, pillín!','¡Eh! ¡Cosquillas no!','¿Quieres que te cuente algo?'][((roamReaction-1)%3)]:line}</span>
     <button type="button" onClick={close} aria-label="Cerrar aparición de Yeppo">×</button>
     <button type="button" className="yeppo-roam-talk" onClick={openChat}>HABLAR ↗</button>
    </div>
    <button type="button" className={`yeppo-roam-mascot${roamReaction?' yeppo-roam-react':''}`} onClick={()=>{setRoamReaction(n=>n+1);setExpression(n=>n==='wink'?'surprised':'wink')}} aria-label="Tocar a Yeppo para que reaccione">
      <YeppoMascot expression={roamReaction%2===0?expression:'surprised'}/>
      <span>¡TÓCAME!</span>
    </button>
   </div>
  </aside>
 return <aside className="yeppo" aria-label="Yeppo, la flor de DANZ">
   <div className="yeppo-bubble"><span>{line}</span><button type="button" aria-label="Cerrar Yeppo" onClick={close}>×</button><button type="button" className="yeppo-bubble-talk" onClick={openChat}>PREGÚNTAME ↗</button></div>
   <button type="button" className="yeppo-avatar" aria-label="Opciones de Yeppo" onClick={()=>setMenu(x=>!x)}><YeppoMascot expression={expression}/><span>YEPPO</span></button>
   {menu&&<div className="yeppo-menu"><button onClick={()=>{silenceYeppoForOneHour();setVisible(false)}}>Callar 1 hora</button><button onClick={()=>{setYeppoEnabled(false);setVisible(false)}}>Desactivar</button></div>}
 </aside>
}
