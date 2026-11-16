import {useEffect,useRef,useState} from 'react'
import DanzFlower from '../content/DanzFlower'
import {DANZ_TRACKS} from './playlist'
import {useMusicAccess} from './useMusicAccess'
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
 const [publicAvailable,setAvailable]=useState(false)
 const [publicChecking,setChecking]=useState(true)
 // The radio never opens across the page by default; a small edge tab is sufficient.
 const [minimized,setMinimized]=useState(()=>readBool(HIDDEN,true))
 const [queue,setQueue]=useState(false)
 const [notice,setNotice]=useState(false)
 const [muted,setMuted]=useState(false)
 const [position,setPosition]=useState(0)
 const [duration,setDuration]=useState(0)
 const [error,setError]=useState('')
 const current=DANZ_TRACKS[index]
 const musicAccess=useMusicAccess(current.protectedId)
 const source=current.protectedId?musicAccess.src:current.src
 const available=current.protectedId?musicAccess.status==='ready'&&Boolean(source):publicAvailable
 const checking=current.protectedId?musicAccess.status==='loading':publicChecking
 const resumeAt=useRef(0)
 useEffect(()=>{
  const controller=new AbortController()
  if(current.protectedId)return()=>controller.abort()
  setAvailable(false);setChecking(true)
  void fetch(current.src,{method:'HEAD',signal:controller.signal,cache:'no-store'}).then(response=>{
   if(!controller.signal.aborted){setAvailable(response.ok&&response.headers.get('content-type')?.includes('audio')===true);setChecking(false)}
  }).catch(()=>{if(!controller.signal.aborted){setAvailable(false);setChecking(false)}})
  return()=>controller.abort()
 },[current.src,current.protectedId])
 useEffect(()=>{try{localStorage.setItem(PREF,String(on))}catch{}},[on])
 useEffect(()=>{try{localStorage.setItem(HIDDEN,String(minimized))}catch{}},[minimized])
 useEffect(()=>{
  const audio=audioRef.current
  if(!audio)return
  if(!on||arcadeActive||!available){audio.pause();setPlaying(false);return}
  let cancelled=false
  void audio.play().then(()=>{if(!cancelled){setPlaying(true);setError('')}}).catch(()=>{if(!cancelled){setPlaying(false);setOn(false);setError('Pulsa PLAY para activar la música.')}})
  return()=>{cancelled=true}
 },[on,arcadeActive,index,available,source])
 useEffect(()=>{
  if(!on||arcadeActive||!current.protectedId)return
  const timer=setInterval(()=>{if(!musicAccess.freshSource())musicAccess.prepare()},30_000)
  return()=>clearInterval(timer)
 },[on,arcadeActive,current.protectedId,musicAccess.prepare])
 useEffect(()=>{
  if(!available||!on||arcadeActive)return
  setNotice(true)
  const timer=window.setTimeout(()=>setNotice(false),3600)
  return()=>window.clearTimeout(timer)
 },[index,available,on,arcadeActive])
 const choose=(n:number)=>{setAvailable(false);setChecking(true);resumeAt.current=0;setIndex((n+DANZ_TRACKS.length)%DANZ_TRACKS.length);setPosition(0);setDuration(0);setError('')}
 const toggle=()=>{
  if(!available){setError('Este tema no está disponible. Prueba otro en la lista.');setMinimized(false);return}
  if(arcadeActive)return
  if(current.protectedId&&!musicAccess.freshSource()){musicAccess.prepare();return}
  if(!on){
   // Direct playback on the touch gesture is important for Android/iOS autoplay policies.
   void audioRef.current?.play().then(()=>setPlaying(true)).catch(()=>setError('Pulsa de nuevo PLAY para activar el audio.'))
  }else audioRef.current?.pause()
  setOn(value=>!value);setError('')
 }
 const seek=(value:number)=>{const audio=audioRef.current;if(audio&&Number.isFinite(audio.duration)&&audio.duration>0){resumeAt.current=value;if(current.protectedId&&!musicAccess.freshSource()){musicAccess.prepare();return}audio.currentTime=value;setPosition(value)}}
 return <aside className={`danz-radio${minimized?' danz-radio-mini':''}${arcadeActive?' danz-radio-suspended':''}`} aria-label="Hilo musical DANZ">
   {/* Persistent audio element avoids restarting songs when the panel is collapsed or Arcade opens. */}
   <audio ref={audioRef} src={source} preload="none" muted={muted} controlsList="nodownload noremoteplayback"
     onTimeUpdate={e=>{if(!current.protectedId||(musicAccess.status==='ready'&&e.currentTarget.readyState>0)){resumeAt.current=e.currentTarget.currentTime;setPosition(e.currentTarget.currentTime)}}}
     onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);if(current.protectedId&&resumeAt.current>0)e.currentTarget.currentTime=Math.min(resumeAt.current,e.currentTarget.duration-.05)}}
     onEnded={()=>choose(index+1)}
     onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)}
     onError={()=>{if(available&&(!current.protectedId||musicAccess.status==='ready')){setOn(false);setError('Este archivo no se puede reproducir.')}}} />
   {!arcadeActive&&(minimized?
     <div className="danz-radio-tab">
       <button type="button" className="danz-radio-tab-open" onClick={()=>setMinimized(false)} aria-label="Abrir hilo musical">
         <span aria-hidden="true">♫</span><span className="danz-radio-tab-copy"><strong>{available?current.title:'HILO DANZ'}</strong><small>{playing?'SONANDO':available?'EN PAUSA':`${DANZ_TRACKS.length} TEMAS · ${checking?'COMPROBANDO':'ELIGE OTRO'}`}</small></span>
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
         {current.protectedId&&musicAccess.status==='signin'&&<p className="danz-radio-offline" role="status">Inicia sesión para escuchar este tema. <a href="/?seccion=cuenta">IR A MI CUENTA</a></p>}
         {!checking&&!available&&musicAccess.status!=='signin'&&<p className="danz-radio-offline" role="status">Este tema no está disponible ahora. Puedes elegir otro en la lista.</p>}
       </section>
     </>
   )}
 </aside>
}
