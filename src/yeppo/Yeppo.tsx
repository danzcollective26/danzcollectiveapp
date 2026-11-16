import {useCallback,useEffect,useLayoutEffect,useRef,useState, type FormEvent} from 'react'
import {yeppoGuide,YEPPO_SUGGESTIONS,type GuideReply,type YeppoDestination} from './guide'
import {mayAppear,readLedger,writeLedger,dismissed,messageHasFacts,nextPhrase,type YeppoEvent} from './rules'
import {readYeppoEnabled,setYeppoEnabled,readYeppoSilencedUntil,silenceYeppoForOneHour,YEPPO_PREFERENCE_EVENT} from './settings'
import YeppoFeedback from './YeppoFeedback'
import YeppoMascot,{type YeppoMood} from './YeppoMascot'
import './yeppo.css'
type Page='inicio'|'pasaporte'|'fotos'|'arcade'|'danzers'|'danzin'|'danzflor'|'danzpoints'|'cuenta'|'admin'
type Expression=YeppoMood
type RoamMove='stroll'|'sneak'|'dash'
export type YeppoDemoRequest={id:number;move:RoamMove}
const roamMoves:readonly RoamMove[]=['stroll','sneak','dash']
const expressions:Expression[]=['neutral','smirk','wink','surprised','sleepy','eyebrow']
const INTRO_KEY='danz-yeppo-welcome-v1'
const VISIT_KEY='danz-yeppo-visit-peek-v1'
function visitPeekAvailable(){try{return !sessionStorage.getItem(VISIT_KEY)}catch{return false}}
export const yeppoWelcomePending=()=>{try{return localStorage.getItem(INTRO_KEY)!=='done'}catch{return false}}
export const markYeppoWelcomeDone=()=>{try{localStorage.setItem(INTRO_KEY,'done')}catch{/* Private browsing may disable storage. */}}
type Prank={title:string;left:number;top:number;width:number}
export default function Yeppo({page,gameActive=false,events=[],onNavigate,demoRequest}:{page:Page;gameActive?:boolean;events?:YeppoEvent[];onNavigate?:(page:YeppoDestination)=>void;demoRequest?:YeppoDemoRequest}){
 const [enabled,setEnabled]=useState(readYeppoEnabled)
 const [chatOpen,setChatOpen]=useState(false)
 const [feedbackOpen,setFeedbackOpen]=useState(false)
 const [feedbackDraft,setFeedbackDraft]=useState<{category:'error'|'sugerencia'|'ayuda'|'yeppo';message:string}>({category:'sugerencia',message:''})
 const [question,setQuestion]=useState('')
 const [chat,setChat]=useState<Array<{from:'yeppo'|'visitor';text:string;destination?:YeppoDestination;label?:string;feedbackCategory?:'error'|'sugerencia'|'ayuda'|'yeppo';feedbackDraft?:string}>>([{from:'yeppo',text:'¡Epa! Soy Yeppo. Pregúntame por fotos, sellos, juegos o ropa. No soy una IA generativa todavía, pero conozco DANZ.'}])
 const [visible,setVisible]=useState(false)
 const [roaming,setRoaming]=useState(false)
 const [roamReaction,setRoamReaction]=useState(0)
 const [roamDemo,setRoamDemo]=useState(false)
 const [roamSequence,setRoamSequence]=useState(0)
 const [roamMove,setRoamMove]=useState<RoamMove>('stroll')
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
 const roamStage=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(previousPage.current!==page){previousPage.current=page;sectionAt.current=Date.now();setVisitPeek(false)}},[page])
 useEffect(()=>{if(!visitPeek)return;try{sessionStorage.setItem(VISIT_KEY,'done')}catch{}const timer=window.setTimeout(()=>setVisitPeek(false),4500);return()=>window.clearTimeout(timer)},[visitPeek])
 useEffect(()=>{
  const refresh=()=>{const next=readYeppoEnabled();setEnabled(next);if(!next){setVisible(false);setRoaming(false);setRoamDemo(false);setWelcome('off');setVisitPeek(false);setChatOpen(false);setFeedbackOpen(false)}}
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
   setLine(phrase);setExpression(expressions[(ledger.count+Math.floor(now/1000))%expressions.length]);setRoaming(ledger.count%4===0);setRoamMove(roamMoves[ledger.count%roamMoves.length]);setRoamDemo(false);setRoamReaction(0);setVisible(true);setMenu(false)
   writeLedger({...ledger,count:ledger.count+1,lastAt:now});active.current=0
   until.current=now+5500
  },1000)
  return()=>{clearInterval(interval);window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity)}
 },[page,gameActive,events,enabled,visible,welcome,visitPeek,chatOpen])
 useEffect(()=>{if(!visible)return;const duration=roamDemo?8800:roaming?(roamMove==='sneak'?7900:roamMove==='dash'?5000:5800):roamReaction?4500:5500;const id=window.setTimeout(()=>{const ledger=readLedger();writeLedger({...ledger,dismissals:0});setVisible(false);setMenu(false)},duration);return()=>clearTimeout(id)},[visible,line,roamReaction,roamDemo,roaming,roamMove])
 // Measure the actual hand and card before painting. The crossing and the card's
 // reaction share one animation clock; no navigation or synthetic tap is fired.
 useLayoutEffect(()=>{
  if(!visible||!roaming||gameActive||chatOpen||page==='admin'||page==='cuenta')return
  const stage=roamStage.current
  const hand=stage?.querySelector<SVGElement>('.yeppo-contact-point')
  if(!stage||!hand)return
  // Respect a visitor's motion preference: keep the stationary greeting instead.
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
  const eligible=Array.from(document.querySelectorAll<HTMLElement>('.arcade-choice,.feature,.module,.passport-home-link'))
   .filter(el=>{const box=el.getBoundingClientRect();return el.getClientRects().length>0&&box.width>70&&box.right>200&&Math.min(box.bottom,window.innerHeight-76)-Math.max(box.top,125)>48&&!el.closest('.yeppo,[aria-modal="true"]')})
  if(!eligible.length)return
  const chosen=eligible.reduce((best,el)=>{
   const b=el.getBoundingClientRect(),a=best.getBoundingClientRect()
   return Math.abs(b.top+b.height/2-window.innerHeight*.55)<Math.abs(a.top+a.height/2-window.innerHeight*.55)?el:best
  })
  stage.classList.add('yeppo-measuring-visit')
  chosen.style.setProperty('--yeppo-card-trip',getComputedStyle(stage).getPropertyValue('--yeppo-trip'))
  chosen.classList.add('yeppo-playful-tap')
  const handBox=hand.getBoundingClientRect(),card=chosen.getBoundingClientRect()
  const contactX=Math.min(window.innerWidth-24,card.right-18)
  const visibleTop=Math.max(125,card.top+15),visibleBottom=Math.min(window.innerHeight-76,card.bottom-15)
  const contactY=visibleTop+(visibleBottom-visibleTop)*.6
  stage.style.setProperty('--yeppo-contact-x',`${contactX-handBox.left-handBox.width/2}px`)
  stage.style.setProperty('--yeppo-contact-y',`${contactY-handBox.top-handBox.height/2}px`)
  stage.dataset.card=chosen.textContent?.trim().slice(0,80)
  stage.classList.remove('yeppo-measuring-visit')
  stage.classList.add('yeppo-visiting-card')
  const crossing=stage.getAnimations().find(animation=>(animation as CSSAnimation).animationName==='yeppo-card-visit')
  const reaction=chosen.getAnimations().find(animation=>(animation as CSSAnimation).animationName==='yeppo-card-reaction')
  if(crossing&&reaction&&crossing.startTime!==null)reaction.startTime=crossing.startTime
  const cancel=()=>{
   chosen.classList.remove('yeppo-playful-tap')
   chosen.style.removeProperty('--yeppo-card-trip')
   stage.classList.remove('yeppo-visiting-card')
   delete stage.dataset.card
  }
  // Scrolling or a resize invalidates viewport coordinates. End this appearance
  // instead of letting the hand touch empty space or following the visitor.
  const moved=(event:Event)=>{if(event.target instanceof Node&&stage.contains(event.target))return;cancel();setVisible(false);setRoaming(false)}
  window.addEventListener('scroll',moved,{passive:true,capture:true})
  window.addEventListener('resize',moved,{passive:true})
  return()=>{cancel();window.removeEventListener('scroll',moved,true);window.removeEventListener('resize',moved)}
 },[visible,roaming,roamDemo,gameActive,chatOpen,page,roamSequence])
 const talk=(value:string)=>{
  const phrase=value.trim().slice(0,300)
  if(!phrase)return
  const reply:GuideReply=yeppoGuide(phrase)
  setChat(previous=>[...previous.slice(-8),{from:'visitor',text:phrase},{from:'yeppo',...reply}])
  setQuestion('')
  setExpression('wink')
 }
 const submitQuestion=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();talk(question)}
 const openChat=()=>{setChatOpen(true);setVisible(false);setRoaming(false);setRoamDemo(false);setMenu(false)}
 const previewWalk=useCallback((requested?:RoamMove)=>{const move=requested??roamMoves[roamSequence%roamMoves.length];setRoamMove(move);setChatOpen(false);setFeedbackOpen(false);setWelcome('off');setVisitPeek(false);setRoaming(true);setRoamDemo(true);setRoamSequence(n=>n+1);setRoamReaction(0);setLine(['Voy de paseo. No me sigas.','Shhh. No me has visto.','¡Voy, voy! ¡Que llego tarde!'][roamMoves.indexOf(move)]);setExpression('wink');setVisible(true);setMenu(false)},[roamSequence])
 const lastDemo=useRef(0)
 useEffect(()=>{if(!demoRequest||demoRequest.id<=lastDemo.current||!enabled||gameActive)return;lastDemo.current=demoRequest.id;previewWalk(demoRequest.move)},[demoRequest,enabled,gameActive,previewWalk])
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
   <button type="button" className="yeppo-chat-launcher" onClick={openChat} aria-label="Hablar con Yeppo"><YeppoMascot expression="wink" pose="point"/><span>HABLA CONMIGO</span></button>
 </aside>
 if(chatOpen)return <aside className="yeppo yeppo-chat-shell" aria-label="Charla con Yeppo">
   <section className="yeppo-chat-dialog" role="dialog" aria-label="Hablar con Yeppo">
    <header className="yeppo-chat-header"><span>🌸 YEPPO <small>GUÍA DE DANZ · SIN IA GENERATIVA</small></span><button type="button" onClick={()=>setChatOpen(false)} aria-label="Cerrar charla con Yeppo">×</button></header>
    {feedbackOpen?<YeppoFeedback page={page} initialCategory={feedbackDraft.category} initialMessage={feedbackDraft.message} onClose={()=>setFeedbackOpen(false)}/>:<div className="yeppo-chat-messages" role="log" aria-live="polite">{chat.map((message,i)=><div key={i} className={message.from==='yeppo'?'yeppo-chat-reply':'yeppo-chat-question'}>
      <p>{message.text}</p>
      {message.destination&&<span className="yeppo-reply-point" aria-hidden="true"><YeppoMascot expression="wink" pose="point"/></span>}
      {message.destination&&onNavigate&&<button type="button" onClick={()=>{setChatOpen(false);onNavigate(message.destination!)}}>{message.label??'IR A SECCIÓN'} ↗</button>}
      {message.feedbackCategory&&<button type="button" onClick={()=>{setFeedbackDraft({category:message.feedbackCategory!,message:message.feedbackDraft??''});setFeedbackOpen(true)}}>REGISTRAR {message.feedbackCategory==='sugerencia'?'SUGERENCIA':'INCIDENCIA'} ↗</button>}
    </div>)}</div>}
    {!feedbackOpen&&<div className="yeppo-chat-suggestions">{YEPPO_SUGGESTIONS.map(s=><button key={s} type="button" onClick={()=>talk(s)}>{s}</button>)}</div>}
    {!feedbackOpen&&<form className="yeppo-chat-form" onSubmit={submitQuestion}><label htmlFor="yeppo-question">Pregúntale algo a Yeppo</label><div><input id="yeppo-question" value={question} maxLength={300} autoComplete="off" onChange={e=>setQuestion(e.target.value)} placeholder="Fotos, juegos, sellos…" /><button type="submit" disabled={!question.trim()}>ENVIAR</button></div></form>}
    <button type="button" className="yeppo-walk-demo-launch" onClick={()=>previewWalk()}>🌸 VER A YEPPO PASEARSE ↗</button>
    <button type="button" className="yeppo-feedback-open" onClick={()=>{setFeedbackDraft({category:'sugerencia',message:''});setFeedbackOpen(x=>!x)}}>{feedbackOpen?'VOLVER A HABLAR CON YEPPO':'¿UN PROBLEMA O UNA IDEA? CUÉNTAMELO ↗'}</button>
    <small className="yeppo-chat-disclaimer">Respuestas guiadas en este dispositivo. No escribas datos privados. Para información de fiestas, consulta la publicación oficial.</small>
   </section>
 </aside>
 if(visible&&roaming)return <aside className="yeppo yeppo-walkabout" data-testid="yeppo-walkabout" aria-label="Yeppo paseando por DANZ">
   <button type="button" className="yeppo-walkabout-close" onClick={close} aria-label="Cerrar aparición de Yeppo" title="Cerrar paseo de Yeppo">×</button>
   <div ref={roamStage} key={roamSequence} className={`yeppo-roam-stage yeppo-roam-${roamMove}${roamDemo?' yeppo-roam-demo':''}`}>
    <div className="yeppo-roam-speech"><span>{roamReaction?['¡Me has pillado, pillín!','¡Eh! ¡Cosquillas no!','¿Quieres que te cuente algo?'][((roamReaction-1)%3)]:line}</span>
     <button type="button" className="yeppo-roam-talk" onClick={openChat}>HABLAR ↗</button>
    </div>
    <button type="button" className={`yeppo-roam-mascot${roamReaction?' yeppo-roam-react':''}`} onClick={()=>{setRoamReaction(n=>n+1);setExpression(n=>n==='wink'?'surprised':'wink')}} aria-label="Tocar a Yeppo para que reaccione">
      <YeppoMascot expression={roamReaction%2===0?expression:'surprised'} interacting/>
      <span>¡TÓCAME!</span>
    </button>
   </div>
  </aside>
 return <aside className="yeppo" aria-label="Yeppo, la flor de DANZ">
   <div className="yeppo-bubble"><span>{line}</span><button type="button" aria-label="Cerrar Yeppo" onClick={close}>×</button><button type="button" className="yeppo-bubble-talk" onClick={openChat}>PREGÚNTAME ↗</button></div>
   <button type="button" className="yeppo-avatar" aria-label="Opciones de Yeppo" onClick={()=>setMenu(x=>!x)}><YeppoMascot expression={expression} pose="point"/><span>YEPPO</span></button>
   {menu&&<div className="yeppo-menu"><button onClick={()=>{silenceYeppoForOneHour();setVisible(false)}}>Callar 1 hora</button><button onClick={()=>{setYeppoEnabled(false);setVisible(false)}}>Desactivar</button></div>}
 </aside>
}
