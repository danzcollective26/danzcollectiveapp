import { lazy, Suspense, useState } from 'react'
import KartSilhouette from './KartSilhouette'
import type { KartQuality } from './preferences'
const KartShowroom = lazy(() => import('./KartShowroom'))
import { MenuTabs } from '../ArcadeMenu'
import SelectionReel, { type MenuChoice } from '../SelectionReel'
import { CHASSIS, WHEELS, DRIVERS, KART_COLORS, kartStats, type KartBuild } from './garage'

const PARTS=[{id:'chassis',label:'CHASIS'},{id:'wheels',label:'RUEDAS'},{id:'color',label:'PINTURA'},{id:'driver',label:'PILOTO'}]
const PAINT_NAMES=['TAXI GOLD','LIMA CLUB','PETROL RUN','CREW ROSÉ','IVORY','CORAL']
export default function KartGarage({builds,duel,quality,onChange}:{builds:[KartBuild,KartBuild];duel:boolean;quality:KartQuality;onChange:(player:0|1,build:KartBuild)=>void}){
  const [selected,setSelected]=useState<0|1>(0),[part,setPart]=useState('chassis'),player=duel?selected:0,build=builds[player],stats=kartStats(build)
  const update=(value:Partial<KartBuild>)=>onChange(player,{...build,...value})
  const choices:MenuChoice[]=part==='chassis'?[...CHASSIS]:part==='wheels'?[...WHEELS]:part==='driver'?DRIVERS.map(d=>({...d,note:'Tu piloto. Mismas reglas.'})):KART_COLORS.map((color,i)=>({id:color,name:PAINT_NAMES[i],note:'Solo cambia el aspecto.'}))
  if(part==='color'&&!KART_COLORS.includes(build.color as typeof KART_COLORS[number]))choices.push({id:build.color,name:'COLOR LIBRE',note:'Tu pintura personalizada.'})
  return <div className="kart-console-garage">
    {duel&&<div className="kart-console-players" role="group" aria-label="Kart que personalizas">{([0,1] as const).map(id=><button key={id} type="button" aria-pressed={player===id} onClick={()=>setSelected(id)}>P{id+1}</button>)}</div>}
    <MenuTabs label="Piezas del garaje" tabs={PARTS} value={part} onChange={setPart}/>
    <SelectionReel label={PARTS.find(p=>p.id===part)!.label} choices={choices} value={build[part as keyof KartBuild]} onChange={value=>update({[part]:value})}>
      <div className="kart-console-preview" style={{color:build.color}} aria-label={`Kart P${player+1}`}>
{quality==='flat'?<KartSilhouette build={build}/>:<Suspense fallback={<KartSilhouette build={build}/>}><KartShowroom build={build} quality={quality}/></Suspense>}
      </div>
    </SelectionReel>
    {part==='color'&&<label className="kart-console-color">COLOR LIBRE<input type="color" value={build.color} aria-label={`Color libre P${player+1}`} onChange={e=>update({color:e.target.value})}/></label>}
    <div className="kart-console-stats" aria-label="Características del kart"><span>PUNTA<b>{Math.round(stats.speed*.46)} <small>KM/H</small></b></span><span>AGARRE<b>{Math.round(stats.grip*100)}<small>%</small></b></span><span>RESISTENCIA<b>{Math.round(stats.durability*100)}<small>%</small></b></span></div>
    <details className="kart-console-details"><summary>VER TODAS LAS ESTADÍSTICAS</summary><p>Salida {Math.round(stats.acceleration/1.6*100)}% · Derrape {Math.round(stats.drift*100)}% · Neumáticos {Math.round(stats.tireDurability*100)}%</p><small>Chasis y ruedas cambian la conducción. Pintura y piloto son cosméticos.</small></details>
  </div>
}
