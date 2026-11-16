import { useEffect, useState, type ReactNode } from 'react'
import ArcadeMenu from './ArcadeMenu'
import SelectionReel from './SelectionReel'
import { requestArcadeFullscreen } from './arcadeFullscreen'

const MODES=[{id:'cut',name:'VINYL CUT',badge:'CORTES AL VUELO',note:'Desliza, corta y encadena vinilos.'},{id:'scratch',name:'SCRATCH SESSION',badge:'PATRONES AL RITMO',note:'Lee la flecha y clava el gesto en el pulso.'},{id:'destruction',name:'DESTRUCCIÓN',badge:'OCHO ARMAS',note:'Apunta a los discos. Haz trizas la cabina.'}]
const TABS=[{id:'play',label:'JUGAR'},{id:'settings',label:'AJUSTES'},{id:'help',label:'CÓMO JUGAR'}]
export default function ArcadeLaunch({game,mode,running,onPlay,onExit,onModeChange,onDestruction,children,settings}:{game:'snake'|'groove';mode?:string;running:boolean;onPlay:()=>void;onExit?:()=>void;onModeChange?:(mode:'cut'|'scratch')=>void;onDestruction?:()=>void;children?:ReactNode;settings?:ReactNode}){
  const [launched,setLaunched]=useState(running),[page,setPage]=useState('play'),[destruction,setDestruction]=useState(false)
  useEffect(()=>{if(running)setLaunched(true)},[running])
  if(launched||running)return null
  const snake=game==='snake',start=()=>{requestArcadeFullscreen();setLaunched(true);if(destruction&&onDestruction)onDestruction();else onPlay()}
  return <ArcadeMenu title={snake?'LIAO, JACK':'GROOVE NINJA'} eyebrow={snake?'LA QUE HAS LIAO / EL CABLE NO PERDONA':'DANZ / ANALOG SESSIONS'} art={snake?'/arcade/jack-approved-mobile.webp':'/arcade/groove-ninja-approved-mobile.webp'} accent={snake?'#d9fa69':'#e9b975'} tabs={TABS} page={page} onPage={setPage} onBack={onExit??(()=>{})} action={{label:'JUGAR AHORA',onClick:start}} footer={snake?'PRACTICA A TU RITMO':'60 SEGUNDOS · LA CABINA ES TUYA'}>
    {page==='play'&&(snake?<div className="menu-setup-stack">{children}</div>:<SelectionReel label="Modo de Groove Ninja" choices={onDestruction?MODES:MODES.slice(0,2)} value={destruction?'destruction':mode??'cut'} onChange={id=>{setDestruction(id==='destruction');if(id!=='destruction')onModeChange?.(id as 'cut'|'scratch')}}><div className="console-mode-icon">{destruction?'✹':mode==='scratch'?'↔':'◎'}</div></SelectionReel>)}
    {page==='settings'&&<div className="menu-settings">{snake?settings:children}{snake&&<small>También puedes deslizar sobre el tablero para girar.</small>}</div>}
    {page==='help'&&<div className="menu-help"><h2>{snake?'QUE NO TE PILLEN.':'CORTA. MEZCLA. REPITE.'}</h2>{snake?<><p>Recoge las caras de la crew, haz crecer el cable y esquiva paredes y tu propia cola.</p><p><b>CLÁSICO:</b> sobrevive. <b>LABERINTO:</b> abre paso por doce recorridos.</p><small>Flechas o WASD, botones o gestos. Los récords competitivos se gestionan desde la biblioteca.</small></>:<><p><b>VINYL CUT:</b> desliza sobre los discos. Sigue sus flechas y busca multicortes.</p><p><b>SCRATCH:</b> mueve el plato en la dirección y el momento marcados.</p><p><b>DESTRUCCIÓN:</b> elige arma y toca los vinilos para disparar.</p><small>Música de ensayo. Práctica local sin DANZPOINTS; las preferencias de estilo están en ajustes de la sesión.</small></>}</div>}
  </ArcadeMenu>
}
