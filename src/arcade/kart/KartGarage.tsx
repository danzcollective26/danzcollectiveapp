import { useState, type CSSProperties } from 'react'
import { CHASSIS, WHEELS, DRIVERS, KART_COLORS, kartStats, buildName, type KartBuild } from './garage'

export default function KartGarage({builds,duel,onChange}:{builds:[KartBuild,KartBuild];duel:boolean;onChange:(player:0|1,build:KartBuild)=>void}){
  const [selected,setSelected]=useState<0|1>(0),player=duel?selected:0,build=builds[player],stats=kartStats(build)
  const update=(value:Partial<KartBuild>)=>onChange(player,{...build,...value})
  const wheels=WHEELS.find(w=>w.id===build.wheels)!,chassis=CHASSIS.find(c=>c.id===build.chassis)!
  return <details className="kart-garage"><summary><span>TU GARAJE <b>{buildName(build)}</b></span><i>+</i></summary>
    {duel&&<div className="kart-garage-players" role="group" aria-label="Kart que personalizas">{([0,1] as const).map(id=><button key={id} type="button" aria-pressed={player===id} onClick={()=>setSelected(id)}>P{id+1}</button>)}</div>}
    <div className="kart-build-preview" style={{'--build-color':build.color} as CSSProperties} aria-label={`Kart P${player+1}: ${buildName(build)}`}>
      <svg viewBox="0 0 210 110" aria-hidden="true"><ellipse cx="108" cy="91" rx="79" ry="9" fill="#061820"/><g fill="#10252b" stroke="#78918a" strokeWidth="2"><rect x="37" y="37" width="24" height="32" rx="8"/><rect x="146" y="37" width="24" height="32" rx="8"/><rect x="37" y="72" width="24" height="25" rx="7"/><rect x="146" y="72" width="24" height="25" rx="7"/></g><path d={build.chassis==='sprint'?'M62 40 106 28 145 40 153 84 56 84Z':build.chassis==='hauler'?'M51 37H159V87H51Z':'M59 36Q106 21 150 36L155 85H54Z'} fill="var(--build-color)" stroke="#c2c9a1" strokeWidth="2"/><path d="M57 82H155" stroke="#bdc8bd" strokeWidth="6"/><rect x="86" y="31" width="42" height="47" rx="14" fill={DRIVERS.find(d=>d.id===build.driver)!.color}/><circle cx="107" cy="34" r="16" fill={DRIVERS.find(d=>d.id===build.driver)!.helmet}/><path d="M95 34Q107 27 119 34V42H95Z" fill="#112d36"/><path d="M78 64 89 54M125 54 137 64" stroke="#e1d1a8" strokeWidth="5"/><path d="M85 65Q107 56 131 65" fill="none" stroke="#10252b" strokeWidth="5"/></svg>
      <span><b>P{player+1} / {DRIVERS.find(d=>d.id===build.driver)!.name}</b><small>Pintura y piloto: a tu gusto.</small></span>
    </div>
    <fieldset><legend>CHASIS</legend><div className="kart-part-grid three">{CHASSIS.map(c=><button type="button" key={c.id} aria-pressed={build.chassis===c.id} onClick={()=>update({chassis:c.id})}>{c.name}</button>)}</div><p>{chassis.note}</p></fieldset>
    <fieldset><legend>RUEDAS · SEIS CONFIGURACIONES</legend><div className="kart-part-grid three">{WHEELS.map((w,i)=><button type="button" key={w.id} aria-pressed={build.wheels===w.id} onClick={()=>update({wheels:w.id})}><i className={`kart-wheel-option wheel-${i}`} aria-hidden="true"/>{w.name}</button>)}</div><p>{wheels.note}</p></fieldset>
    <div className="kart-build-stats" aria-label="Características del kart">{[
      ['PUNTA',`${Math.round(stats.speed*.46)} KM/H`,stats.speed/235],['SALIDA',`${Math.round(stats.acceleration/1.6*100)}%`,stats.acceleration/2.1],['AGARRE',`${Math.round(stats.grip*100)}%`,stats.grip/1.2],['DERRAPE',`${Math.round(stats.drift*100)}%`,stats.drift/1.25],['CHASIS',`${Math.round(stats.durability*100)}%`,stats.durability/1.5],['NEUMÁTICOS',`${Math.round(stats.tireDurability*100)}%`,stats.tireDurability/1.4],
    ].map(([name,value,amount])=><div key={name}><span>{name}<b>{value}</b></span><i><em style={{width:`${Math.min(1,Number(amount))*100}%`}}/></i></div>)}</div>
    <fieldset><legend>PINTURA</legend><div className="kart-paint-options">{KART_COLORS.map(color=><button type="button" key={color} style={{background:color}} aria-label={`Pintura ${color}`} aria-pressed={build.color===color} onClick={()=>update({color})}/>)}<label>LIBRE<input type="color" value={build.color} aria-label={`Color libre P${player+1}`} onChange={e=>update({color:e.target.value})}/></label></div></fieldset>
    <fieldset><legend>PILOTO · COSMÉTICO</legend><div className="kart-part-grid three">{DRIVERS.map(d=><button type="button" key={d.id} aria-pressed={build.driver===d.id} onClick={()=>update({driver:d.id})}>{d.name}</button>)}</div></fieldset>
    <small>Chasis y ruedas cambian la conducción. Pintura y piloto solo cambian el aspecto. Todas las piezas están abiertas en esta versión local.</small>
  </details>
}
