import type { CSSProperties, PointerEvent } from 'react'
import VersusJoystick from '../VersusJoystick'
import { RACE_LAPS, type Car, type Point } from './engine'

export type Pedal='throttle'|'drift'|'brake'
const ACTIONS:[Pedal,string,string][]=[['throttle','Acelerar','GAS'],['drift','Derrapar','DERRAPE'],['brake','Frenar','FRENO']]
export default function KartController({car,active,automatic,onVector,onHold,onPit}:{car:Car;active:boolean;automatic:boolean;onVector:(v:Point)=>void;onHold:(key:Pedal,held:boolean)=>void;onPit:()=>void}){
  const id=car.id as 0|1
  const hold=(e:PointerEvent<HTMLButtonElement>,key:Pedal,value:boolean)=>{e.preventDefault();if(value)e.currentTarget.setPointerCapture(e.pointerId);onHold(key,value)}
  const servicing=car.pit!==null||car.tow>0
  return <section className={`kart-controller versus-controller versus-p${id+1}`} style={{'--player':car.build.color} as CSSProperties} aria-label={`Mando de kart P${id+1}`}><div className="versus-face">
    <VersusJoystick player={id} active={active&&!servicing} onChange={onVector} keyboardEnabled={false} keyboardHelp={id===0?'Apunta el rumbo con el joystick. Teclado: W gas, S freno, A/D giro, F derrape, B boxes.':'Apunta el rumbo con el joystick. Teclado: flechas gas/freno/giro, L derrape, O boxes.'}/>
    <div className="kart-control-meta"><strong>P{id+1}<small>V{Math.min(RACE_LAPS,car.laps+1)}/{RACE_LAPS} · {Math.round(car.health*100)}%</small></strong>
      <div className={`kart-health${car.health<.35?' damaged':''}`} role="progressbar" aria-label={`Estado del kart P${id+1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(car.health*100)}><i style={{width:`${car.health*100}%`}}/></div>
      <div className="kart-charge" aria-label={`Carga de derrape P${id+1}`}><i style={{width:`${car.charge*100}%`}}/></div>
      {ACTIONS.map(([key,label,text])=><button className={`kart-pedal pedal-${key}`} key={key} type="button" disabled={!active||servicing} aria-label={`P${id+1} ${label}`} onPointerDown={e=>hold(e,key,true)} onPointerUp={e=>hold(e,key,false)} onPointerCancel={e=>hold(e,key,false)} onLostPointerCapture={e=>hold(e,key,false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onHold(key,true)}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onHold(key,false)}}} onBlur={()=>onHold(key,false)}>{text}{key==='throttle'&&automatic&&<small>AUTO</small>}</button>)}
      <button className="kart-boxes" type="button" aria-label={`P${id+1} Solicitar boxes`} aria-pressed={car.pitRequested} disabled={!active||servicing} onClick={onPit}>{servicing?'PIT STOP':car.pitRequested?'CANCELAR':'BOXES'}</button>
    </div></div></section>
}
