import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import VersusJoystick from '../VersusJoystick'
import { RACE_LAPS, type Car, type Point } from './engine'

export type Pedal='throttle'|'drift'|'brake'
const ACTIONS:[Pedal,string,string][]=[['throttle','Acelerar','GAS'],['drift','Derrapar','DERRAPE'],['brake','Frenar','FRENO']]
export default function KartController({car,active,automatic,onVector,onHold,onPit,firstPerson=false}:{car:Car;active:boolean;automatic:boolean;onVector:(v:Point)=>void;onHold:(key:Pedal,held:boolean)=>void;onPit:()=>void;firstPerson?:boolean}){
  const id=car.id as 0|1
  // Multiple fingers or keyboard + touch may hold the same pedal. Releasing one
  // source must not release another active source.
  const holds=useRef<Record<Pedal,{pointers:Set<number>;keyboard:boolean}>>({
    throttle:{pointers:new Set(),keyboard:false},
    drift:{pointers:new Set(),keyboard:false},
    brake:{pointers:new Set(),keyboard:false},
  })
  const callback=useRef(onHold);callback.current=onHold
  const emit=(key:Pedal)=>{const source=holds.current[key];callback.current(key,source.keyboard||source.pointers.size>0)}
  const hold=(e:PointerEvent<HTMLButtonElement>,key:Pedal,value:boolean)=>{
    if(value&&e.pointerType==='mouse'&&e.button!==0)return
    e.preventDefault()
    const pointers=holds.current[key].pointers
    if(value){pointers.add(e.pointerId);e.currentTarget.setPointerCapture(e.pointerId)}
    else pointers.delete(e.pointerId)
    emit(key)
  }
  const holdKey=(key:Pedal,value:boolean)=>{holds.current[key].keyboard=value;emit(key)}
  useEffect(()=>{if(!active){for(const key of ['throttle','drift','brake'] as const){holds.current[key].pointers.clear();holds.current[key].keyboard=false;emit(key)}}},[active])
  useEffect(()=>()=>{for(const key of ['throttle','drift','brake'] as const)callback.current(key,false)},[])
  const servicing=car.pit!==null||car.tow>0
  return <section className={`kart-controller versus-controller versus-p${id+1}`} style={{'--player':car.build.color} as CSSProperties} aria-label={`Mando de kart P${id+1}`}><div className="versus-face">
    <VersusJoystick player={id} active={active&&!servicing} onChange={onVector} keyboardEnabled={false} keyboardHelp={firstPerson?'Gira a izquierda o derecha con el joystick. W gas, S freno, A/D giro, F derrape, B boxes.':id===0?'Apunta el rumbo con el joystick. Teclado: W gas, S freno, A/D giro, F derrape, B boxes.':'Apunta el rumbo con el joystick. Teclado: flechas gas/freno/giro, L derrape, O boxes.'}/>
    <div className="kart-control-meta"><strong>P{id+1}<small>V{Math.min(RACE_LAPS,car.laps+1)}/{RACE_LAPS} · {Math.round(car.health*100)}%</small></strong>
      <div className={`kart-health${car.health<.35?' damaged':''}`} role="progressbar" aria-label={`Estado del kart P${id+1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(car.health*100)}><i style={{width:`${car.health*100}%`}}/></div>
      <div className="kart-charge" aria-label={`Carga de derrape P${id+1}`}><i style={{width:`${car.charge*100}%`}}/></div>
      {ACTIONS.map(([key,label,text])=><button className={`kart-pedal pedal-${key}`} key={key} type="button" disabled={!active||servicing} aria-label={`P${id+1} ${label}`} onPointerDown={e=>hold(e,key,true)} onPointerUp={e=>hold(e,key,false)} onPointerCancel={e=>hold(e,key,false)} onLostPointerCapture={e=>hold(e,key,false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();holdKey(key,true)}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();holdKey(key,false)}}} onBlur={()=>holdKey(key,false)}>{text}{key==='throttle'&&automatic&&<small>AUTO</small>}</button>)}
      <button className="kart-boxes" type="button" aria-label={`P${id+1} Solicitar boxes`} aria-pressed={car.pitRequested} disabled={!active||servicing} onClick={onPit}>{servicing?'PIT STOP':car.pitRequested?'CANCELAR':'BOXES'}</button>
    </div></div></section>
}
