import {useEffect,useRef,useState} from 'react'
import {DANZ_TRACKS} from './playlist'
import './radio.css'
const PREF='danz-radio-enabled-v1'
function readPref(){try{return localStorage.getItem(PREF)==='true'}catch{return false}}
export default function DanzRadio({arcadeActive=false}:{arcadeActive?:boolean}){
 const ref=useRef<HTMLAudioElement>(null)
 const [on,setOn]=useState(readPref)
 const [index,setIndex]=useState(0)
 const [available,setAvailable]=useState(false)
 const [notice,setNotice]=useState(false)
 const [error,setError]=useState('')
 const current=DANZ_TRACKS[index]
 useEffect(()=>{
  const controller=new AbortController()
  void fetch(DANZ_TRACKS[0].src,{method:'HEAD',signal:controller.signal}).then(response=>{if(!controller.signal.aborted)setAvailable(response.ok&&response.headers.get('content-type')?.includes('audio')===true)}).catch(()=>setAvailable(false))
  return()=>controller.abort()
 },[])
 useEffect(()=>{try{localStorage.setItem(PREF,String(on))}catch{}},[on])
 useEffect(()=>{
  const audio=ref.current;if(!audio)return
  if(!on||arcadeActive||!available){audio.pause();return}
  void audio.play().catch(()=>{setError('Pulsa PLAY para activar el hilo musical.')})
 },[on,arcadeActive,index,available])
 useEffect(()=>{
  if(!available)return
  setNotice(true);const t=window.setTimeout(()=>setNotice(false),4400);return()=>window.clearTimeout(t)
 },[index,available])
 const next=()=>{setIndex(n=>(n+1)%DANZ_TRACKS.length);setError('')}
 const prev=()=>{setIndex(n=>(n+DANZ_TRACKS.length-1)%DANZ_TRACKS.length);setError('')}
 const toggle=()=>{if(!available)return;setOn(v=>!v);setError('')}
 if(!available)return arcadeActive?null:<aside className="danz-radio" aria-label="Hilo musical de DANZ"><div className="danz-radio-control"><span aria-hidden="true" style={{padding:'8px 9px',fontSize:19}}>♫</span><div><small>HILO MUSICAL · DANZ</small><strong>6 TEMAS · AUDIO PENDIENTE</strong></div></div></aside>
 return <aside className="danz-radio" aria-label="Hilo musical de DANZ">
   <audio ref={ref} src={current.src} preload="none" onEnded={next} onError={()=>{setOn(false);setError('Este tema no está disponible.') }}/>
   {notice&&on&&!arcadeActive&&<div className="danz-radio-notice" role="status"><span>AHORA SUENA EN DANZ</span><strong>{current.title}</strong><small>{current.artist}</small></div>}
   <div className="danz-radio-control">
      <button onClick={toggle} type="button" aria-pressed={on} aria-label={on?'Pausar hilo musical':'Activar hilo musical'}>{on&&!arcadeActive?'Ⅱ':'▶'}</button>
      <div><small>HILO MUSICAL {arcadeActive?'· PAUSADO EN ARCADE':''}</small><strong>{current.title}</strong></div>
      <button onClick={prev} type="button" aria-label="Tema anterior">‹</button>
      <button onClick={next} type="button" aria-label="Tema siguiente">›</button>
   </div>
   {error&&<span className="danz-radio-error" role="status">{error}</span>}
 </aside>
}
