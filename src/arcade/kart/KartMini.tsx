import { useEffect, useRef, useState } from 'react'
import GameSurface from '../GameSurface'
import { useVersusView } from '../useVersusView'
import { worldVector } from '../versusView'
import { createKartRenderer } from './renderKart'
import { KartAudio } from './KartAudio'
import KartMinimap from './KartMinimap'
import KartController, { type Pedal } from './KartController'
import KartMenu from './KartMenu'
import Cockpit from './Cockpit'
import { cockpitSteering, effectiveCamera } from './camera'
import { requestArcadeFullscreen } from '../arcadeFullscreen'
import { buildKey, buildName, type KartBuild } from './garage'
import { readKartPreferences, saveKartPreferences, type KartPreferences } from './preferences'
import { createRace, startRace, pauseRace, stepRace, raceOrder, TRACKS, RACE_LAPS, formatRaceTime, readKartBest, saveKartBest, NO_INPUT, type Race, type KartMode, type TrackId, type KartInput } from './engine'
import '../versusControls.css'
import './kart.css'

const freshInputs=():[KartInput,KartInput]=>[{...NO_INPUT},{...NO_INPUT}]
const grid=(mode:KartMode,track:TrackId,prefs:KartPreferences)=>createRace(mode,track,mode==='duel'?prefs.builds:[prefs.builds[0]])

export default function KartMini({onBack}:{onBack:()=>void}){
  const [preferences,setPreferences]=useState(readKartPreferences),preferencesRef=useRef(preferences);preferencesRef.current=preferences
  const state=useRef(grid('race','dock',preferences)),[hud,setHud]=useState<Race>(state.current)
  const inputs=useRef(freshInputs()),keys=useRef(new Set<string>()),audio=useRef<KartAudio|null>(null)
  const [settingsOpen,setSettingsOpen]=useState(false),[newBest,setNewBest]=useState(false),[renderMode,setRenderMode]=useState('3d')
  const renderer=useRef<ReturnType<typeof createKartRenderer>|null>(null),host=useRef<HTMLDivElement>(null),panel=useRef<HTMLElement>(null)
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0)
  const [best,setBest]=useState(()=>readKartBest('dock',preferences.builds[0]))
  const duel=hud.mode==='duel',active=hud.phase==='playing',moving=active||hud.phase==='countdown'
  const camera=effectiveCamera(preferences.camera,hud.mode),cockpit=camera==='cockpit'
  const artKey=JSON.stringify(hud.cars.map(c=>c.build))+preferences.venue
  const clear=()=>{inputs.current=freshInputs();keys.current.clear()}
  const sync=(next:Race)=>{const reset=next.phase!==state.current.phase;state.current=next;setHud(next);renderer.current?.wake(reset)}
  const pause=()=>{clear();audio.current?.pause();sync(pauseRace(state.current))}
  const landscape=useVersusView(pause),view=useRef({duel,landscape});view.current={duel,landscape}
  const play=()=>{
    clear();setSettingsOpen(false);if(state.current.phase!=='paused')setNewBest(false)
    if(preferencesRef.current.sound){try{audio.current??=new KartAudio();audio.current.start()}catch{setPreferences(v=>({...v,sound:false}))}}
    sync(startRace(state.current));panel.current?.focus({preventScroll:true})
    requestArcadeFullscreen()
  }
  const exit=()=>{pause();if(document.fullscreenElement===panel.current)void document.exitFullscreen().catch(()=>{});onBack()}
  const actions=useRef({pause,exit});actions.current={pause,exit}
  const choose=(mode:KartMode,track:TrackId)=>{clear();sync(grid(mode,track,preferencesRef.current));setBest(readKartBest(track,preferencesRef.current.builds[0]))}
  const configure=(player:0|1,build:KartBuild)=>{
    const builds:[KartBuild,KartBuild]=[...preferencesRef.current.builds];builds[player]=build
    const next={...preferencesRef.current,builds};preferencesRef.current=next;setPreferences(next)
    clear();sync(grid(state.current.mode,state.current.track,next));setBest(readKartBest(state.current.track,builds[0]))
  }
  useEffect(()=>{saveKartPreferences(preferences);renderer.current?.wake()},[preferences])
  useEffect(()=>{
    const parent=host.current;if(!parent)return
    let alive=true,booted=false,publish=0,recorded=false;setReady(false);setError('')
    const timeout=window.setTimeout(()=>{if(alive&&!booted)setError('La parrilla no se ha podido abrir. Vuelve a cargarla.')},8000)
    try{renderer.current=createKartRenderer(parent,()=>state.current,dt=>{
      if(!alive)return
      const control=inputs.current.map((input,id)=>{
        const turn=(keys.current.has(id===0?'d':'ArrowRight')?1:0)-(keys.current.has(id===0?'a':'ArrowLeft')?1:0)
        const firstPerson=effectiveCamera(preferencesRef.current.camera,state.current.mode)==='cockpit'
        const vector=firstPerson?undefined:input.vector&&(view.current.duel?worldVector(input.vector,id as 0|1,view.current.landscape):input.vector)
        return {...input,vector,turn:firstPerson?cockpitSteering(input.vector,turn):turn,throttle:preferencesRef.current.autoThrottle||input.throttle===1||keys.current.has(id===0?'w':'ArrowUp')?1:0,drift:input.drift||keys.current.has(id===0?'f':'l'),brake:input.brake||keys.current.has(id===0?'s':'ArrowDown')}
      })
      inputs.current.forEach(input=>{input.pit=false})
      const previous=state.current,next=stepRace(previous,control,dt);state.current=next;publish+=dt;audio.current?.tick(next,preferencesRef.current.sound)
      if(next.phase==='finished'&&!recorded&&next.mode==='time'&&next.cars[0].finishedAt!==null){recorded=true;if(saveKartBest(next.track,next.cars[0].finishedAt,next.cars[0].build)){setBest(next.cars[0].finishedAt);setNewBest(true)}}
      if(next.phase==='countdown')recorded=false
      if(next!==previous&&(publish>=80||next.phase!==previous.phase)){publish=0;setHud(next)}
    },()=>{booted=true;window.clearTimeout(timeout);if(alive){setReady(true);setRenderMode(parent.dataset.renderMode??'3d')}},()=>preferencesRef.current)}catch{setError('No se ha podido cargar la parrilla. Prueba otra vez.')}
    return()=>{alive=false;window.clearTimeout(timeout);renderer.current?.destroy();renderer.current=null;clear()}
  },[hud.track,hud.mode,retry,preferences.quality,artKey])
  useEffect(()=>{
    const previous=document.body.style.overflow,element=panel.current;document.body.style.overflow='hidden';let native=Boolean(document.fullscreenElement)
    const hidden=()=>{if(document.hidden)actions.current.pause()},blur=()=>actions.current.pause()
    const fullscreen=()=>{if(document.fullscreenElement)native=true;else if(native){native=false;actions.current.pause()}}
    const key=(e:KeyboardEvent,down:boolean)=>{
      if((e.target as HTMLElement)?.closest('input,select,textarea')||e.defaultPrevented)return
      if(e.key==='Escape'&&down){actions.current.exit();return}
      const k=e.key.length===1?e.key.toLowerCase():e.key
      if((k==='b'||k==='o')&&down&&!e.repeat){e.preventDefault();inputs.current[k==='b'?0:1].pit=true;return}
      if(!['a','d','w','s','f','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','l'].includes(k))return
      e.preventDefault();if(down)keys.current.add(k);else keys.current.delete(k)
    }
    const down=(e:KeyboardEvent)=>key(e,true),up=(e:KeyboardEvent)=>key(e,false)
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur)
    document.addEventListener('visibilitychange',hidden);document.addEventListener('fullscreenchange',fullscreen)
    return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('fullscreenchange',fullscreen);audio.current?.destroy();audio.current=null;if(document.fullscreenElement===element)void document.exitFullscreen().catch(()=>{})}
  },[])
  const hold=(id:0|1,key:Pedal,value:boolean)=>{inputs.current[id]={...inputs.current[id],[key]:key==='throttle'?(value?1:0):value}}
  const order=raceOrder(hud),position=order.findIndex(c=>c.id===0)+1,p1=hud.cars[0]
  const controller=(id:0|1)=><KartController car={hud.cars[id]} active={moving} automatic={preferences.autoThrottle} firstPerson={cockpit} onVector={v=>{inputs.current[id]={...inputs.current[id],vector:v}}} onHold={(key,held)=>hold(id,key,held)} onPit={()=>{inputs.current[id].pit=true}}/>
  const serviceText=p1.tow>0?`GRÚA EN ${Math.ceil(p1.tow/1000)} S`:p1.service>0?`REPARANDO · ${Math.ceil(p1.service/1000)} S`:p1.pit!==null?'ASISTENCIA EN BOXES':p1.pitRequested?'BOXES EN LA PRÓXIMA ENTRADA':''
  return <section ref={panel} tabIndex={-1} className={`kart-game${duel?' kart-duel':' kart-solo'}${cockpit?' kart-first-person':''}`} aria-label="DANZPORTER" data-camera={camera} data-phase={hud.phase} data-mode={hud.mode} data-track={hud.track} data-elapsed={Math.floor(hud.elapsed)} data-p1={`${p1.x.toFixed(1)},${p1.y.toFixed(1)}`} data-laps={p1.laps} data-drifting={p1.drifting} data-render-mode={renderMode} data-health={p1.health.toFixed(3)} data-speed={p1.speed.toFixed(1)} data-pit={p1.pit===null?'none':p1.service>0?'repair':'lane'} data-build={buildKey(p1.build)}>
    <header className="kart-top" aria-hidden={!moving}><button type="button" onClick={exit} aria-label="Salir de DANZPORTER">← ARCADE</button><div><strong>DANZ<em>PORTER</em></strong><small>COLLECTIVE RACING DEPARTMENT</small></div><button type="button" aria-label="Ajustes del kart" onClick={()=>{pause();setSettingsOpen(true)}}>···</button><button type="button" disabled={!moving&&hud.phase!=='paused'} onClick={()=>hud.phase==='paused'?play():pause()}>{hud.phase==='paused'?'REANUDAR':'PAUSAR'}</button></header>
    <div className="kart-hud" aria-hidden={!moving}><span>VUELTA <b>{Math.min(RACE_LAPS,p1.laps+1)}/{RACE_LAPS}</b></span><strong>{formatRaceTime(hud.elapsed)}</strong><span>{hud.mode==='time'?'RÉCORD':'POSICIÓN'} <b>{hud.mode==='time'?formatRaceTime(best):`${position}/${hud.cars.length}`}</b></span></div>
    <div className="kart-layout" aria-hidden={!moving}>{duel&&controller(1)}<GameSurface ratio={1000/720} className={`kart-board-slot${renderMode==='3d'||cockpit?' kart-board-3d':''}`}><div className="kart-board" ref={host} role="img" aria-label={`Circuito ${TRACKS[hud.track].name}, ${hud.cars.length} karts`} data-ready={ready}/>
      {moving&&camera!=='track'&&!duel&&<KartMinimap race={hud}/>}
      {moving&&cockpit&&<Cockpit car={p1}/>}
      {active&&<><div className="kart-speed"><strong>{Math.round(p1.speed*.46)}</strong><small>KM/H</small>{p1.boosting>0&&<b>IMPULSO</b>}</div>{serviceText&&<div className="kart-service-banner" role="status">{serviceText}</div>}{p1.health<.35&&!serviceText&&<div className="kart-service-banner damaged">KART DAÑADO · PIDE BOXES</div>}</>}
      {hud.phase==='countdown'&&<div className="kart-countdown" role="status">{Math.max(1,Math.ceil(hud.countdown/1000))}<small>AL VERDE, SALIMOS.</small></div>}
    </GameSurface>{controller(0)}</div>
    <footer className="kart-foot" aria-hidden={!moving}>{hud.mode==='time'?`CONTRARRELOJ · ${buildName(p1.build)}`:'CARRERA LOCAL · SIN DANZPOINTS'}<span>GAS acelera · FRENO detiene · DERRAPE también da gas · BOXES repara</span></footer>
    {!moving&&<KartMenu race={hud} prefs={preferences} ready={ready} error={error} renderMode={renderMode} newBest={newBest} showSettings={settingsOpen} onPlay={play} onExit={exit} onRetry={()=>setRetry(n=>n+1)} onChoose={choose} onBuild={configure} onPreferences={change=>{clear();if(change.sound===false)audio.current?.pause();setPreferences(v=>({...v,...change}))}} onReset={()=>choose(hud.mode,hud.track)}/>}
  </section>
}
