import { useState } from 'react'
import ArcadeMenu from './ArcadeMenu'
import SelectionReel from './SelectionReel'
import type { CollectaControls } from './collectaControls'
import './collecta.css'

const MODES=[{id:'arena',name:'ARENA',badge:'CIERRE DE PISTA · 1 VS 1',note:'Discos, flightcases y tres rondas para poner orden.'},{id:'chase',name:'PERSECUCIÓN',badge:'PASA EL MARRÓN · 1 VS 1',note:'Pilla al rival. Pasa la factura. Escápate.'},{id:'solo',name:'CONTRA LA MÁQUINA',badge:'ÚLTIMO TURNO · 1 JUGADOR',note:'Tú cierras. La crew automática se resiste.'}]
const TABS=[{id:'play',label:'JUGAR'},{id:'controls',label:'MANDOS'},{id:'help',label:'CÓMO JUGAR'}]
const CONTROLS=[{id:'arrows',name:'FLECHAS',note:'Cuatro direcciones a tu lado.'},{id:'joystick',name:'JOYSTICK',note:'Arrastra y suelta para centrar.'}]
export default function CollectaHub({ onArena, onSolo, onChase, onBack, controls, onControls }: { onArena: () => void; onSolo: () => void; onChase: () => void; onBack: () => void; controls: CollectaControls; onControls: (value: CollectaControls) => void }) {
  const [page,setPage]=useState('play'),[mode,setMode]=useState('arena')
  const update=(player:0|1,id:string)=>{const next:CollectaControls=[...controls];next[player]=id==='joystick'?'joystick':'arrows';onControls(next)}
  return <ArcadeMenu title="DANZ COLLECTA" eyebrow="DÍA DE COBRO / EL ENCARGADO" art="/arcade/collecta-mobile-v1.webp" accent="#efc267" tabs={TABS} page={page} onPage={setPage} onBack={onBack} action={{label:mode==='arena'?'JUGAR ARENA 1 VS 1':mode==='chase'?'JUGAR PERSECUCIÓN':'JUGAR EN SOLITARIO',onClick:mode==='arena'?onArena:mode==='chase'?onChase:onSolo}} footer={mode==='solo'?'ÚLTIMO TURNO · RIVAL AUTOMÁTICO':'UNO A CADA EXTREMO · DUELO LOCAL'}>
    {page==='play'&&<SelectionReel label="Modo de DANZ Collecta" choices={MODES} value={mode} onChange={setMode}><div className="console-mode-icon">{mode==='arena'?'◎':mode==='chase'?'↔':'✦'}</div></SelectionReel>}
    {page==='controls'&&<div className="menu-controls-pickers"><SelectionReel compact label="Mando P1" choices={CONTROLS} value={controls[0]} onChange={id=>update(0,id)}/>{mode!=='solo'&&<SelectionReel compact label="Mando P2" choices={CONTROLS} value={controls[1]} onChange={id=>update(1,id)}/>}</div>}
    {page==='help'&&<div className="menu-help"><h2>EL CIERRE ES TUYO.</h2><p><b>ARENA:</b> abre camino con discos y escapa de tu propia onda. Gana tres rondas.</p><p><b>PERSECUCIÓN:</b> cada captura pasa la factura y suma un punto. Tienes 60 segundos.</p><p><b>ÚLTIMO TURNO:</b> las reglas de Arena, frente a la crew automática.</p><details><summary>MANDOS Y TECLADO</summary><p>En duelo, cada mando mira hacia su jugador. Arena usa casillas; Persecución admite diagonales.</p><small>P1: WASD + F · P2: flechas + L. Al girar se pausa. Práctica local; sin premios competitivos ni salas online.</small></details></div>}
  </ArcadeMenu>
}
