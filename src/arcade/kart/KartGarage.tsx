import { useState, type CSSProperties } from 'react'
import { MenuTabs } from '../ArcadeMenu'
import SelectionReel, { type MenuChoice } from '../SelectionReel'
import { CHASSIS, WHEELS, DRIVERS, KART_COLORS, kartStats, type KartBuild } from './garage'

const PARTS=[{id:'chassis',label:'CHASIS'},{id:'wheels',label:'RUEDAS'},{id:'color',label:'PINTURA'},{id:'driver',label:'PILOTO'}]
const PAINT_NAMES=['TAXI GOLD','LIMA CLUB','PETROL RUN','CREW ROSÉ','IVORY','CORAL','VIOLET RUSH','MINT CHROME','SOLAR GOLD','ELECTRIC BLUE','PINK AFTER','TERRACOTTA']
export default function KartGarage({builds,duel,onChange}:{builds:[KartBuild,KartBuild];duel:boolean;onChange:(player:0|1,build:KartBuild)=>void}){
  const [selected,setSelected]=useState<0|1>(0),[part,setPart]=useState('chassis'),player=duel?selected:0,build=builds[player],stats=kartStats(build)
  const update=(value:Partial<KartBuild>)=>onChange(player,{...build,...value})
  const choices:MenuChoice[]=part==='chassis'?[...CHASSIS]:part==='wheels'?[...WHEELS]:part==='driver'?DRIVERS.map(d=>({...d,note:'Tu piloto. Mismas reglas.'})):KART_COLORS.map((color,i)=>({id:color,name:PAINT_NAMES[i],note:'Solo cambia el aspecto.'}))
  if(part==='color'&&!KART_COLORS.includes(build.color as typeof KART_COLORS[number]))choices.push({id:build.color,name:'COLOR LIBRE',note:'Tu pintura personalizada.'})
  return <div className="kart-console-garage">
    {duel&&<div className="kart-console-players" role="group" aria-label="Kart que personalizas">{([0,1] as const).map(id=><button key={id} type="button" aria-pressed={player===id} onClick={()=>setSelected(id)}>P{id+1}</button>)}</div>}
    <MenuTabs label="Piezas del garaje" tabs={PARTS} value={part} onChange={setPart}/>
    <SelectionReel label={PARTS.find(p=>p.id===part)!.label} choices={choices} value={build[part as keyof KartBuild]} onChange={value=>update({[part]:value})}>
      <div className="kart-console-preview" style={{color:build.color}} aria-label={`Kart P${player+1}`}>
<svg viewBox="0 0 210 110" aria-hidden="true"><ellipse cx="108" cy="91" rx="79" ry="9" fill="#061820"/><g className={`kart-menu-tires wheels-${build.wheels}`} fill="#10252b" stroke="#78918a" strokeWidth="2"><rect x="37" y="37" width="24" height="32" rx="8"/><rect x="146" y="37" width="24" height="32" rx="8"/><rect x="37" y="72" width="24" height="25" rx="7"/><rect x="146" y="72" width="24" height="25" rx="7"/></g><path d={build.chassis==='sprint'?'M62 40 106 28 145 40 153 84 56 84Z':build.chassis==='hauler'?'M51 37H159V87H51Z':'M59 36Q106 21 150 36L155 85H54Z'} fill="currentColor" stroke="#c2c9a1" strokeWidth="2"/><path d="M57 82H155" stroke="#bdc8bd" strokeWidth="6"/>
{build.chassis==='sprint'
  ? <g aria-hidden="true"><path d="M69 40 89 34 87 78 72 78Z M94 32 102 30 104 78H92Z" fill="#fff0cb" opacity=".86"/><path d="M128 35 137 38 141 78H131Z" fill="#101c25" opacity=".5"/><path d="M63 77H147" stroke="#f7d8a0" strokeWidth="2"/></g>
  : build.chassis==='hauler'
  ? <g aria-hidden="true"><path d="M58 43H78V78H58Z M133 43H153V78H133Z" fill="#f1d9a4" opacity=".64"/><path d="M59 48H77M134 48H152" stroke="#273c49" strokeWidth="3"/><path d="M59 72H152" stroke="#1a2e34" strokeWidth="4"/><path d="M65 39H145" stroke="#fff4c5" strokeWidth="3" strokeDasharray="5 8"/></g>
  : <g aria-hidden="true"><path d="M63 41 87 36 86 79H65Z M127 36 147 41 147 79H128Z" fill="#eaf0dc" opacity=".3"/><path d="M64 77H146" stroke="#f7e9bd" strokeWidth="2"/><path d="M65 44 84 39M130 39 145 44" stroke="#fff2bc" strokeWidth="2"/></g>}
<path d="M61 83H152" stroke="#141a1c" strokeWidth="2" opacity=".55"/><rect x="86" y="31" width="42" height="47" rx="14" fill={DRIVERS.find(d=>d.id===build.driver)!.color}/><circle cx="107" cy="34" r="16" fill={DRIVERS.find(d=>d.id===build.driver)!.helmet}/><path d="M95 34Q107 27 119 34V42H95Z" fill="#112d36"/><path d="M78 64 89 54M125 54 137 64" stroke="#e1d1a8" strokeWidth="5"/><path d="M85 65Q107 56 131 65" fill="none" stroke="#10252b" strokeWidth="5"/></svg>
      </div>
    </SelectionReel>
    {part==='color'&&<div className="kart-paint-palette" role="group" aria-label="Paleta de pinturas DANZPORTER">
      {KART_COLORS.map((paint,i)=><button key={paint} type="button"
        className="kart-paint-chip" style={{'--kart-paint':paint} as CSSProperties}
        aria-label={`Pintura ${PAINT_NAMES[i]}`} aria-pressed={build.color.toLowerCase()===paint}
        title={PAINT_NAMES[i]} onClick={()=>update({color:paint})}><span aria-hidden="true"/></button>)}
    </div>}
    {part==='color'&&<label className="kart-console-color">COLOR LIBRE<input type="color" value={build.color} aria-label={`Color libre P${player+1}`} onChange={e=>update({color:e.target.value})}/></label>}
    <div className="kart-console-stats" aria-label="Características del kart"><span>PUNTA<b>{Math.round(stats.speed*.46)} <small>KM/H</small></b></span><span>AGARRE<b>{Math.round(stats.grip*100)}<small>%</small></b></span><span>RESISTENCIA<b>{Math.round(stats.durability*100)}<small>%</small></b></span></div>
    <details className="kart-console-details"><summary>VER TODAS LAS ESTADÍSTICAS</summary><p>Salida {Math.round(stats.acceleration/1.6*100)}% · Derrape {Math.round(stats.drift*100)}% · Neumáticos {Math.round(stats.tireDurability*100)}%</p><small>Chasis y ruedas cambian la conducción. Pintura y piloto son cosméticos.</small></details>
  </div>
}
