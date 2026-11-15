import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react'
import GameSurface from '../GameSurface'
import VersusJoystick from '../VersusJoystick'
import { useVersusView } from '../useVersusView'
import { worldVector } from '../versusView'
import { createKartRenderer } from './renderKart'
import { KartAudio } from './KartAudio'
import KartMinimap from './KartMinimap'
import { KART_LIVERIES, readKartPreferences, saveKartPreferences } from './preferences'
import { createRace, startRace, pauseRace, stepRace, raceOrder, TRACKS, RACE_LAPS, formatRaceTime, readKartBest, saveKartBest, NO_INPUT, type Race, type KartMode, type TrackId, type KartInput } from './engine'
import '../versusControls.css'
import './kart.css'

const MODES: [KartMode,string,string][] = [['race','CREW RACE','Tú y tres rivales'],['time','CONTRARRELOJ','Tu mejor sesión'],['duel','DUELO LOCAL','Dos, frente a frente']]
const freshInputs = (): [KartInput,KartInput] => [{...NO_INPUT},{...NO_INPUT}]

export default function KartMini({ onBack }: { onBack:()=>void }) {
  const state=useRef(createRace()), [hud,setHud]=useState<Race>(state.current)
  const inputs=useRef(freshInputs()), keys=useRef(new Set<string>())
  const [preferences,setPreferences]=useState(readKartPreferences),preferencesRef=useRef(preferences);preferencesRef.current=preferences
  const audio=useRef<KartAudio|null>(null)
  const [settingsOpen,setSettingsOpen]=useState(false),[newBest,setNewBest]=useState(false)
  const [renderMode,setRenderMode]=useState('3d')
  const renderer=useRef<ReturnType<typeof createKartRenderer>|null>(null)
  const host=useRef<HTMLDivElement>(null), panel=useRef<HTMLElement>(null)
  const [ready,setReady]=useState(false), [error,setError]=useState(''), [retry,setRetry]=useState(0)
  useEffect(()=>{saveKartPreferences(preferences);renderer.current?.wake()},[preferences])
  const [best,setBest]=useState(()=>readKartBest('dock'))
  const duel=hud.mode==='duel', active=hud.phase==='playing', moving=active||hud.phase==='countdown'
  const clear=()=>{inputs.current=freshInputs();keys.current.clear()}
  const sync=(next:Race)=>{const reset=next.phase!==state.current.phase;state.current=next;setHud(next);renderer.current?.wake(reset)}
  const pause=()=>{clear();audio.current?.pause();sync(pauseRace(state.current))}
  const landscape=useVersusView(pause), view=useRef({duel,landscape});view.current={duel,landscape}
  const play=()=>{clear();setSettingsOpen(false);if(state.current.phase!=='paused')setNewBest(false);if(preferencesRef.current.sound){try{audio.current??=new KartAudio();audio.current.start()}catch{setPreferences(v=>({...v,sound:false}))}}sync(startRace(state.current));panel.current?.focus({preventScroll:true});try{void panel.current?.requestFullscreen?.({navigationUI:'hide'}).catch(()=>{})}catch{/* CSS viewport is retained. */}}
  const exit=()=>{pause();if(document.fullscreenElement===panel.current)void document.exitFullscreen().catch(()=>{});onBack()}
  const actions=useRef({pause,exit});actions.current={pause,exit}
  const choose=(mode:KartMode,track:TrackId)=>{clear();sync(createRace(mode,track));setBest(readKartBest(track))}

  useEffect(()=>{
    const parent=host.current;if(!parent)return
    let alive=true,booted=false,publish=0,recorded=false
    setReady(false);setError('')
    const timeout=window.setTimeout(()=>{if(alive&&!booted)setError('La parrilla no se ha podido abrir. Vuelve a cargarla.')},8000)
    try{renderer.current=createKartRenderer(parent,()=>state.current,dt=>{
      if(!alive)return
      const control=inputs.current.map((input,id)=>{
        const turn=(keys.current.has(id===0?'d':'ArrowRight')?1:0)-(keys.current.has(id===0?'a':'ArrowLeft')?1:0)
        const vector=input.vector && (view.current.duel?worldVector(input.vector,id as 0|1,view.current.landscape):input.vector)
        return {...input,vector,turn,drift:input.drift||keys.current.has(id===0?'f':'l'),brake:input.brake||keys.current.has(id===0?'s':'ArrowDown')}
      })
      const previous=state.current,next=stepRace(previous,control,dt);state.current=next;publish+=dt;audio.current?.tick(next,preferencesRef.current.sound)
      if(next.phase==='finished'&&!recorded&&next.mode==='time'&&next.cars[0].finishedAt!==null){recorded=true;if(saveKartBest(next.track,next.cars[0].finishedAt)){setBest(next.cars[0].finishedAt);setNewBest(true)}}
      if(next.phase==='countdown')recorded=false
      if(next!==previous&&(publish>=80||next.phase!==previous.phase)){publish=0;setHud(next)}
    },()=>{booted=true;window.clearTimeout(timeout);if(alive){setReady(true);setRenderMode(parent.dataset.renderMode??'3d')}},()=>preferencesRef.current)}catch{setError('No se ha podido cargar la parrilla. Prueba otra vez.')}
    return()=>{alive=false;window.clearTimeout(timeout);renderer.current?.destroy();renderer.current=null;clear()}
  },[hud.track,hud.mode,retry,preferences.quality,preferences.livery])

  useEffect(()=>{
    const previous=document.body.style.overflow,element=panel.current;document.body.style.overflow='hidden';let native=false
    const hidden=()=>{if(document.hidden)actions.current.pause()},blur=()=>actions.current.pause()
    const fullscreen=()=>{if(document.fullscreenElement===element)native=true;else if(native){native=false;actions.current.pause()}}
    const key=(e:KeyboardEvent,down:boolean)=>{
      if(e.key==='Escape'&&down){actions.current.exit();return}
      if((e.target as HTMLElement)?.closest('input,select,textarea')||e.defaultPrevented)return
      const k=e.key.length===1?e.key.toLowerCase():e.key
      if(!['a','d','s','f','ArrowLeft','ArrowRight','ArrowDown','l'].includes(k))return
      e.preventDefault();if(down)keys.current.add(k);else keys.current.delete(k)
    }
    const down=(e:KeyboardEvent)=>key(e,true),up=(e:KeyboardEvent)=>key(e,false)
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur)
    document.addEventListener('visibilitychange',hidden);document.addEventListener('fullscreenchange',fullscreen)
    return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('fullscreenchange',fullscreen);audio.current?.destroy();audio.current=null;if(document.fullscreenElement===element)void document.exitFullscreen().catch(()=>{})}
  },[])
  const hold=(e:PointerEvent<HTMLButtonElement>,id:0|1,key:'drift'|'brake',value:boolean)=>{e.preventDefault();if(value)e.currentTarget.setPointerCapture(e.pointerId);inputs.current[id]={...inputs.current[id],[key]:value}}
  const order=raceOrder(hud),position=order.findIndex(c=>c.id===0)+1
  const controller=(id:0|1)=><section className={`kart-controller versus-controller versus-p${id+1}`} style={{'--player':KART_LIVERIES[(preferences.livery+id)%4].color} as CSSProperties} aria-label={`Mando de kart P${id+1}`}><div className="versus-face">
    <VersusJoystick player={id} active={active} onChange={v=>{inputs.current[id]={...inputs.current[id],vector:v}}}/>
    <div className="kart-control-meta"><strong>P{id+1} <small>V{Math.min(RACE_LAPS,hud.cars[id].laps+1)}/{RACE_LAPS}</small></strong><div className="kart-charge" aria-label={`Carga de derrape P${id+1}`}><i style={{width:`${hud.cars[id].charge*100}%`}}/></div>
      {(['drift','brake'] as const).map(key=><button key={key} type="button" disabled={!active} aria-label={`P${id+1} ${key==='drift'?'Derrapar':'Frenar'}`} onPointerDown={e=>hold(e,id,key,true)} onPointerUp={e=>hold(e,id,key,false)} onPointerCancel={e=>hold(e,id,key,false)} onLostPointerCapture={e=>hold(e,id,key,false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();inputs.current[id]={...inputs.current[id],[key]:true}}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')inputs.current[id]={...inputs.current[id],[key]:false}}} onBlur={()=>{inputs.current[id]={...inputs.current[id],[key]:false}}}>{key==='drift'?'DERRAPE':'FRENO'}</button>)}
    </div></div></section>
  return <section ref={panel} tabIndex={-1} className={`kart-game${duel?' kart-duel':' kart-solo'}`} aria-label="DANZ Kart Mini" data-phase={hud.phase} data-mode={hud.mode} data-track={hud.track} data-elapsed={Math.floor(hud.elapsed)} data-p1={`${hud.cars[0].x.toFixed(1)},${hud.cars[0].y.toFixed(1)}`} data-laps={hud.cars[0].laps} data-drifting={hud.cars[0].drifting} data-render-mode={renderMode}>
    <header className="kart-top"><button type="button" onClick={exit} aria-label="Salir de DANZ Kart Mini">← ARCADE</button><div><strong>DANZ <em>KART MINI</em></strong><small>COLLECTIVE RACING DEPARTMENT</small></div><button type="button" aria-label="Ajustes del kart" onClick={()=>{pause();setSettingsOpen(true)}}>···</button><button type="button" disabled={!moving&&hud.phase!=='paused'} onClick={()=>hud.phase==='paused'?play():pause()}>{hud.phase==='paused'?'REANUDAR':'PAUSAR'}</button></header>
    <div className="kart-hud"><span>VUELTA <b>{Math.min(RACE_LAPS,hud.cars[0].laps+1)}/{RACE_LAPS}</b></span><strong>{formatRaceTime(hud.elapsed)}</strong><span>{hud.mode==='time'?'RÉCORD':'POSICIÓN'} <b>{hud.mode==='time'?formatRaceTime(best):`${position}/${hud.cars.length}`}</b></span></div>
    <div className="kart-layout">{duel&&controller(1)}<GameSurface ratio={1000/720} className={`kart-board-slot${renderMode==='3d'?' kart-board-3d':''}`}><div className="kart-board" ref={host} role="img" aria-label={`Circuito ${TRACKS[hud.track].name}, ${hud.cars.length} karts`} data-ready={ready}/>
      {moving&&preferences.camera==='follow'&&!duel&&renderMode==='3d'&&<KartMinimap race={hud} livery={preferences.livery}/>}
      {active&&<div className="kart-speed"><strong>{Math.round(hud.cars[0].speed*.46)}</strong><small>KM/H</small>{hud.cars[0].boosting>0&&<b>IMPULSO</b>}</div>}
      {hud.phase==='countdown'&&<div className="kart-countdown" role="status">{Math.max(1,Math.ceil(hud.countdown/1000))}<small>AL VERDE, SALIMOS.</small></div>}
    </GameSurface>{controller(0)}</div>
    <footer className="kart-foot">{hud.mode==='time'?'CONTRARRELOJ · RÉCORD LOCAL':'CARRERA LOCAL · SIN DANZPOINTS'}<span>Joystick: apunta tu rumbo · A/D gira · F derrapa · S frena{duel?' · P2: flechas + L':''}</span></footer>
    {!moving&&<div className="kart-menu"><div className="kart-menu-card"><span className="kart-eyebrow">{hud.phase==='finished'?'PARTY OVER / PARQUE CERRADO':hud.phase==='paused'?'PIT STOP':'ARCADANZ / GAME 004'}</span><h1>{hud.phase==='finished'?(newBest?'RÉCORD PERSONAL.':hud.mode==='time'?'SESIÓN COMPLETA.':position===1?'PRIMERO EN LLEGAR.':'UNA MÁS Y CERRAMOS.'):hud.phase==='paused'?'RESPIRA. VUELVE.':'DANZ KART MINI.'}</h1><p>{error|| (hud.phase==='finished'?`${formatRaceTime(hud.elapsed)} · ${hud.cars[0].laps}/${RACE_LAPS} vueltas · ${position} de ${hud.cars.length}`:'Tres vueltas por el muelle. Tu kart acelera solo: apunta el rumbo, frena en las horquillas y carga el derrape al girar.')}</p>
      {hud.phase==='ready'&&<><div className="kart-mode-picker" role="group" aria-label="Modo de DANZ Kart Mini">{MODES.map(([mode,title,description])=><button type="button" key={mode} aria-pressed={hud.mode===mode} onClick={()=>choose(mode,hud.track)}><strong>{title}</strong><small>{description}</small></button>)}</div><div className="kart-track-picker" role="group" aria-label="Circuito de DANZ Kart Mini">{Object.values(TRACKS).map(track=><button type="button" key={track.id} aria-pressed={hud.track===track.id} onClick={()=>choose(hud.mode,track.id)}>{track.name}<small>{track.subtitle}</small></button>)}</div><div className="kart-liveries" role="group" aria-label="Carrocería del kart">{KART_LIVERIES.map((livery,i)=><button type="button" key={livery.name} aria-pressed={preferences.livery===i} onClick={()=>setPreferences(v=>({...v,livery:i}))}><i style={{background:livery.color}}/>{livery.name}</button>)}</div><p className="kart-howto"><b>EL TRUCO:</b> apunta con el joystick. Mantén DERRAPE al girar; carga la barra y suelta para ganar impulso.{duel?' Uno a cada extremo del móvil.':''}</p></>}
      {hud.phase==='finished'&&<div className="kart-podium">{order.slice(0,3).map((car,i)=><div key={car.id} data-place={i+1}><span>{i===0?'WINNER':'FINISHER'}</span><strong>{String(i+1).padStart(2,'0')}</strong><b>{hud.mode==='race'&&car.id>0?`CREW ${car.id}`:`P${car.id+1}`}</b></div>)}</div>}
      {hud.phase==='finished'&&<ol className="kart-results">{order.map((car,i)=><li key={car.id}><b>{i+1}.</b><span>{hud.mode==='race'&&car.id>0?`CREW ${car.id}`:`P${car.id+1}`}<small>MEJOR VUELTA {formatRaceTime(car.bestLap)}</small></span><strong>{car.finishedAt===null?`${car.laps}/3 VUELTAS`:formatRaceTime(car.finishedAt)}</strong></li>)}</ol>}
      <details className="kart-preferences" open={settingsOpen} onToggle={e=>setSettingsOpen(e.currentTarget.open)}><summary>AJUSTES DE LA SESIÓN <span>+</span></summary><div>
        <label>CÁMARA<select value={preferences.camera} disabled={duel} onChange={e=>setPreferences(v=>({...v,camera:e.target.value==='track'?'track':'follow'}))}><option value="follow">SEGUIMIENTO</option><option value="track">PISTA COMPLETA</option></select><small>{duel?'En duelo se ve toda la pista.':'Elige la vista cercana o el circuito entero.'}</small></label>
        <label>GRÁFICOS<select value={preferences.quality} onChange={e=>setPreferences(v=>({...v,quality:e.target.value as typeof v.quality}))}><option value="auto">3D · AUTOMÁTICO</option><option value="lite">3D · LIGERO</option><option value="high">3D · ALTA CALIDAD</option><option value="flat">2D · COMPATIBLE</option></select></label>
        <button type="button" aria-pressed={preferences.sound} onClick={()=>{setPreferences(v=>({...v,sound:!v.sound}));audio.current?.pause()}}>SONIDO {preferences.sound?'ON':'OFF'}<small>Motor · ruedas · salida · vueltas</small></button>
      </div></details>
      {error?<button className="kart-start" type="button" onClick={()=>setRetry(n=>n+1)}>RECARGAR PARRILLA</button>:<button className="kart-start" type="button" disabled={!ready} onClick={play}>{!ready?'PREPARANDO PARRILLA…':hud.phase==='paused'?'VOLVER A PISTA':hud.phase==='finished'?'REVANCHA':'SALIR A PISTA'}</button>}
      {(hud.phase==='finished'||hud.phase==='paused')&&<button className="kart-secondary" type="button" onClick={()=>choose(hud.mode,hud.track)}>MODOS Y CIRCUITOS</button>}
      <small className="kart-disclosure">3 MODOS LOCALES · 2 CIRCUITOS · TU MARCA QUEDA EN ESTE NAVEGADOR</small>
    </div></div>}
  </section>
}
