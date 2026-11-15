import {useEffect,useState,type ReactNode} from 'react'
import './arcadeChooser.css'

/** A short moving cover followed by a deliberate arcade START button. */
export default function ArcadeLaunch({game,mode,running,onPlay,onExit,onModeChange,onDestruction,children}:{game:'snake'|'groove';mode?:string;running:boolean;onPlay:()=>void;onExit?:()=>void;onModeChange?:(mode:'cut'|'scratch')=>void;onDestruction?:()=>void;children?:ReactNode}){
 const [phase,setPhase]=useState<'intro'|'ready'|'done'>(running?'done':'intro')
 useEffect(()=>{if(running)setPhase('done')},[running])
 useEffect(()=>{if(phase!=='intro')return;const timer=window.setTimeout(()=>setPhase('ready'),3000);return()=>clearTimeout(timer)},[phase])
 const snake=game==='snake'
 if(phase==='done')return null
 return <div className={`arcade-launch arcade-launch-pro ${game} ${phase}`} role="region" aria-label="Presentación del juego">
   {onExit&&<button type="button" className="arcade-launch-exit" onClick={onExit} aria-label="Volver a la biblioteca ARCADANZ">← BIBLIOTECA</button>}
   <div className="arcade-launch-art" aria-hidden="true"><img src={snake?'/arcade/jack-approved-mobile.webp':'/arcade/groove-ninja-approved-mobile.webp'} alt="" decoding="async" /></div>
   <div className="arcade-launch-stripes" aria-hidden="true"/>
   <div className="arcade-launch-title"><small>ARCADANZ ORIGINAL · {snake?'GAME 01':'GAME 02'}</small><strong>{snake?'LA QUE HAS LIAO, JACK':'GROOVE NINJA'}</strong><em>{snake?'EL CABLE NO PERDONA':mode==='scratch'?'SCRATCH SESSION':'VINYL CUT'}</em></div>
   {phase==='ready'&&children&&<div className="arcade-launch-setup">{children}</div>}
   {phase==='ready'&&!snake&&onModeChange&&<div className="arcade-launch-mode-picker" role="group" aria-label="Modo de Groove Ninja"><button aria-pressed={mode!=='scratch'} onClick={()=>onModeChange('cut')} type="button">VINYL CUT</button><button aria-pressed={mode==='scratch'} onClick={()=>onModeChange('scratch')} type="button">SCRATCH SESSION</button>{onDestruction&&<button type="button" onClick={onDestruction}>DESTRUCCIÓN ✹</button>}</div>}
   {phase==='ready'?<button type="button" className="arcade-launch-start" onClick={()=>{setPhase('done');onPlay()}} aria-label="JUGAR AHORA">▶ JUGAR <span>INSERT COIN · START</span></button>:<div className="arcade-launch-loading" role="status">PREPARANDO LA CABINA <span>· · ·</span></div>}
   <div className="arcade-launch-meter" aria-hidden="true"/>
 </div>
}
