import {useEffect,useState} from 'react'
import './arcadeChooser.css'

/** A short moving cover followed by a deliberate arcade START button. */
export default function ArcadeLaunch({game,mode,running,onPlay}:{game:'snake'|'groove';mode?:string;running:boolean;onPlay:()=>void}){
 const [phase,setPhase]=useState<'intro'|'ready'|'done'>(running?'done':'intro')
 useEffect(()=>{if(running)setPhase('done')},[running])
 useEffect(()=>{if(phase!=='intro')return;const timer=window.setTimeout(()=>setPhase('ready'),3000);return()=>clearTimeout(timer)},[phase])
 const snake=game==='snake'
 if(phase==='done')return null
 return <div className={`arcade-launch arcade-launch-pro ${game} ${phase}`} role="region" aria-label="Presentación del juego">
   <div className="arcade-launch-art" aria-hidden="true"><img src={snake?'/arcade/cable-escape-cover.webp':'/arcade/groove-ninja-cover-v1.webp'} alt="" /></div>
   <div className="arcade-launch-stripes" aria-hidden="true"/>
   <div className="arcade-launch-title"><small>ARCADANZ ORIGINAL · {snake?'GAME 01':'GAME 02'}</small><strong>{snake?'LA QUE HAS LIAO, JACK':'GROOVE NINJA'}</strong><em>{snake?'EL CABLE NO PERDONA':mode==='scratch'?'SCRATCH SESSION':'VINYL CUT'}</em></div>
   {phase==='ready'?<button type="button" className="arcade-launch-start" onClick={()=>{setPhase('done');onPlay()}} aria-label="JUGAR AHORA">▶ JUGAR <span>INSERT COIN · START</span></button>:<div className="arcade-launch-loading" role="status">PREPARANDO LA CABINA <span>· · ·</span></div>}
   <div className="arcade-launch-meter" aria-hidden="true"/>
 </div>
}
