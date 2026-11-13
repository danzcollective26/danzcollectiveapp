import {useEffect,useRef,useState} from 'react'
import DanzFlower from '../content/DanzFlower'
import {DANZ_TRACKS} from './playlist'
import './radio.css'

const PREF='danz-radio-enabled-v1'
const HIDDEN='danz-radio-minimized-v2'
function readBool(key:string,fallback=false){try{const v=localStorage.getItem(key);return v===null?fallback:v==='true'}catch{return fallback}}
function clock(seconds:number){const n=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}

export default function DanzRadio({arcadeActive=false}:{arcadeActive?:boolean}){
 const audioRef=useRef<HTMLAudioElement>(null)
 const [on,setOn]=useState(()=>readBool(PREF))
 const [playing,setPlaying]=useState(false)
 const [index,setIndex]=useState(0)
 const [available,setAvailable]=useState(false)
 const [checking,setChecking]=useState(true)
 // The radio never opens across the page by default; a small edge tab is sufficient.
 const [minimized,setMinimized]=useState(()=>readBool(HIDDEN,true))
 const [queue,setQueue]=useState(false)
 const [notice,setNotice]=useState(false)
 const [muted,setMuted]=useState(false)
 const [position,setPosition]=useState(0)
 const [duration,setDuration]=useState(0)
 const [error,setError]=useState('')
 const current=DANZ_TRACKS[index]
 useEffect(()=>{
  const controller=new AbortController()
  void fetch(DANZ_TRACKS[0].src,{method:'HEAD',signal:controller.signal,cache:'no-store'}).then(response=>{
   if(!controller.signal.aborted){setAvailable(response.ok&&response.headers.get('content-type')?.includes('audio')===true);setChecking(false)}
  }).catch(()=>{if(!controller.signal.aborted){setAvailable(false);setChecking(false)}})
  return()=>controller.abort()
 },[])
 useEffect(()=>{try{localStorage.setItem(PREF,String(on))}catch{}},[on])
 useEffect(()=>{try{localStorage.setItem(HIDDEN,String(minimized))}catch{}},[minimized])
 useEffect(()=>{
  const audio=audioRef.current
  if(!audio)return
  if(!on||arcadeActive||!available){audio.pause();setPlaying(false);return}
  void audio.play().then(()=>{setPlaying(true);setError('')}).catch(()=>{setPlaying(false);setOn(false);setError('Pulsa PLAY para activar la música.')})
 },[on,arcadeActive,index,available])
 useEffect(()=>{
  if(!available||!on||arcadeActive)return
  setNotice(true)
  const timer=window.setTimeout(()=>setNotice(false),3600)
  return()=>window.clearTimeout(timer)
 },[index,available,on,arcadeActive])
 const choose=(n:number)=>{setIndex((n+DANZ_TRACKS.length)%DANZ_TRACKS.length);setPosition(0);setDuration(0);setError('')}
 const toggle=()=>{
  if(!available){setError('Los seis temas siguen pendientes de subida.');setMinimized(false);return}
  if(arcadeActive)return
  if(!on){
   // Direct playback on the touch gesture is important for Android/iOS autoplay policies.
   void audioRef.current?.play().then(()=>setPlaying(true)).catch(()=>setError('Pulsa de nuevo PLAY para activar el audio.'))
  }else audioRef.current?.pause()
  setOn(value=>!value);setError('')
 }
 const seek=(value:number)=>{const audio=audioRef.current;if(audio&&Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=value;setPosition(value)}}
 return <aside className={`danz-radio${minimized?' danz-radio-mini':''}${arcadeActive?' danz-radio-suspended':''}`} aria-label="Hilo musical DANZ">
   {/* Persistent audio element avoids restarting songs when the panel is collapsed or Arcade opens. */}
   <audio ref={audioRef} src={current.src} preload="none" muted={muted}
     onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)}
     onLoadedMetadata={e=>setDuration(e.currentTarget.duration)}
     onEnded={()=>choose(index+1)}
     onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)}
     onError={()=>{if(available){setOn(false);setError('Este archivo no se puede reproducir.')}}} />
   {!arcadeActive&&(minimized?
     <div className="danz-radio-tab">
       <button type="button" className="danz-radio-tab-open" onClick={()=>setMinimized(false)} aria-label="Abrir hilo musical">
         <span aria-hidden="true">♫</span><span className="danz-radio-tab-copy"><strong>{available?current.title:'HILO DANZ'}</strong><small>{playing?'SONANDO':available?'EN PAUSA':'6 TEMAS · PENDIENTE'}</small></span>
       </button>
       {available&&<button type="button" className="danz-radio-tab-play" onClick={toggle} aria-label={playing?'Pausar música':'Reproducir música'}>{playing?'Ⅱ':'▶'}</button>}
     </div>:
     <>
       {notice&&<div className="danz-radio-notice" role="status"><small>AHORA SUENA EN DANZ</small><strong>{current.title}</strong><span>{current.artist}</span></div>}
       <section className="danz-radio-player">
         <div className="danz-radio-heading"><span>♪ HILO MUSICAL / DANZ</span><button type="button" onClick={()=>{setMinimized(true);setQueue(false)}} aria-label="Minimizar reproductor">−</button></div>
         <div className="danz-radio-track">
           <div className="danz-radio-art" data-track={current.id} aria-label={current.cover?'Carátula de '+current.title:'Identidad visual de DANZ'}>{current.cover?<img src={current.cover} alt="" loading="lazy" />:<DanzFlower />}</div>
           <div className="danz-radio-track-info"><strong title={current.title}>{current.title}</strong><span title={current.artist}>{current.artist}</span><small>{index+1} / {DANZ_TRACKS.length} · {playing?'REPRODUCIENDO':checking?'COMPROBANDO AUDIO':available?'EN PAUSA':'AUDIO PENDIENTE'}</small></div>
         </div>
         <div className="danz-radio-timeline"><input type="range" min={0} max={Math.max(1,duration)} step={1} value={Math.min(position,Math.max(1,duration))} disabled={!available||!duration} onChange={event=>seek(Number(event.target.value))} aria-label="Posición de la canción"/><div><span>{clock(position)}</span><span>{clock(duration)}</span></div></div>
         <div className="danz-radio-buttons">
           <button type="button" onClick={()=>choose(index-1)} aria-label="Tema anterior">⏮</button>
           <button type="button" className="danz-radio-play" disabled={!available} onClick={toggle} aria-label={playing?'Pausar hilo musical':'Reproducir hilo musical'}>{playing?'Ⅱ':'▶'}</button>
           <button type="button" onClick={()=>choose(index+1)} aria-label="Tema siguiente">⏭</button>
           <button type="button" aria-label={muted?'Activar sonido':'Silenciar'} aria-pressed={muted} onClick={()=>setMuted(x=>!x)}>{muted?'♩':'♫'}</button>
           <button type="button" aria-label={queue?'Ocultar lista de canciones':'Mostrar lista de canciones'} aria-expanded={queue} onClick={()=>setQueue(x=>!x)}>☷</button>
         </div>
         {queue&&<ol className="danz-radio-queue">{DANZ_TRACKS.map((track,n)=><li key={track.id}><button type="button" aria-current={n===index?'true':undefined} onClick={()=>choose(n)}><span>{String(n+1).padStart(2,'0')}</span><span><strong>{track.title}</strong><small>{track.artist}</small></span></button></li>)}</ol>}
         {error&&<p className="danz-radio-error" role="status">{error}</p>}
         {!checking&&!available&&<p className="danz-radio-offline" role="status">El reproductor está preparado. Falta subir los seis MP3 al almacenamiento de DANZ.</p>}
       </section>
     </>
   )}
 </aside>
}
