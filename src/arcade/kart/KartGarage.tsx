import { lazy, Suspense, useEffect, useState } from 'react'
import { MenuTabs } from '../ArcadeMenu'
import SelectionReel, { type MenuChoice } from '../SelectionReel'
import { CABEZON_SCALE } from './bigHead'
import { CHASSIS, WHEELS, DRIVERS, KART_COLORS, driverLook, kartStats, type KartBuild } from './garage'
import { customDriverId, customDriverRef } from './head/identity'
import { deleteHead, listHeads, portraitFor, type StoredHead } from './head/store'

const HeadStudio = lazy(() => import('./head/HeadStudio'))
const PARTS=[{id:'chassis',label:'CHASIS'},{id:'wheels',label:'RUEDAS'},{id:'color',label:'PINTURA'},{id:'driver',label:'PILOTO'}]
const PAINT_NAMES=['TAXI GOLD','LIMA CLUB','PETROL RUN','CREW ROSÉ','IVORY','CORAL']

export default function KartGarage({builds,duel,studio,onStudio,onChange}:{builds:[KartBuild,KartBuild];duel:boolean;studio:boolean;onStudio:(open:boolean)=>void;onChange:(player:0|1,build:KartBuild)=>void}){
  const [selected,setSelected]=useState<0|1>(0),[part,setPart]=useState('chassis'),[heads,setHeads]=useState<StoredHead[]>([]),[revision,setRevision]=useState(0)
  const player=duel?selected:0,build=builds[player],stats=kartStats(build),look=driverLook(build.driver),portrait=portraitFor(build.driver)
  const update=(value:Partial<KartBuild>)=>onChange(player,{...build,...value})
  useEffect(()=>{let live=true;listHeads().then(found=>{
    if(!live)return
    setHeads(found)
    builds.forEach((entry,index)=>{const id=customDriverId(entry.driver);if(id&&!found.some(head=>head.id===id))onChange(index as 0|1,{...entry,driver:'crew'})})
  }).catch(()=>{if(live)setHeads([])});return()=>{live=false}},[revision,builds,onChange])
  const choices:MenuChoice[]=part==='chassis'?[...CHASSIS]:part==='wheels'?[...WHEELS]:part==='driver'?[...DRIVERS.map(d=>({...d,note:'Tu piloto. Mismas reglas.'})),...heads.map(head=>({id:customDriverRef(head.id),name:head.name,note:'Tu cabezón. Solo el dibujo.'}))]:KART_COLORS.map((color,i)=>({id:color,name:PAINT_NAMES[i],note:'Solo cambia el aspecto.'}))
  if(part==='driver'&&customDriverId(build.driver)&&!choices.some(choice=>choice.id===build.driver))choices.push({id:build.driver,name:'TU CABEZÓN',note:'Tu dibujo, en este dispositivo.'})
  if(part==='color'&&!KART_COLORS.includes(build.color as typeof KART_COLORS[number]))choices.push({id:build.color,name:'COLOR LIBRE',note:'Tu pintura personalizada.'})
  const custom=customDriverId(build.driver)
  return <div className="kart-console-garage">
    {studio&&<Suspense fallback={<p role="status">Abriendo el estudio…</p>}><HeadStudio onClose={()=>onStudio(false)} onSaved={head=>{setRevision(n=>n+1);update({driver:customDriverRef(head.id)});onStudio(false)}}/></Suspense>}
    {!studio&&<>
    {duel&&<div className="kart-console-players" role="group" aria-label="Kart que personalizas">{([0,1] as const).map(id=><button key={id} type="button" aria-pressed={player===id} onClick={()=>setSelected(id)}>P{id+1}</button>)}</div>}
    <MenuTabs label="Piezas del garaje" tabs={PARTS} value={part} onChange={setPart}/>
    <SelectionReel label={PARTS.find(p=>p.id===part)!.label} choices={choices} value={String(build[part as keyof KartBuild])} onChange={value=>update(part==='chassis'?{chassis:value as KartBuild['chassis']}:part==='wheels'?{wheels:value as KartBuild['wheels']}:part==='driver'?{driver:value as KartBuild['driver']}:{color:value})}>
      <div className="kart-console-preview" style={{color:build.color}} aria-label={`Kart P${player+1}`} data-cabezon={CABEZON_SCALE}>
        <svg viewBox="-16 -62 242 186" aria-hidden="true"><defs><clipPath id="cabezon-preview"><ellipse cx="107" cy="2" rx="46" ry="50"/></clipPath></defs><ellipse cx="108" cy="96" rx="79" ry="9" fill="#061820"/><g className={`kart-menu-tires wheels-${build.wheels}`} fill="#10252b" stroke="#78918a" strokeWidth="2"><rect x="37" y="48" width="24" height="32" rx="8"/><rect x="146" y="48" width="24" height="32" rx="8"/><rect x="37" y="82" width="24" height="22" rx="7"/><rect x="146" y="82" width="24" height="22" rx="7"/></g><path d={build.chassis==='sprint'?'M62 50 106 38 145 50 153 94 56 94Z':build.chassis==='hauler'?'M51 48H159V96H51Z':'M59 46Q106 32 150 46L155 95H54Z'} fill="currentColor" stroke="#c2c9a1" strokeWidth="2"/><path d="M57 90H155" stroke="#bdc8bd" strokeWidth="6"/><rect x="86" y="42" width="42" height="44" rx="14" fill={look.color}/><ellipse cx="107" cy="2" rx="50" ry="54" fill={look.helmet} stroke="#182e37" strokeWidth="4"/>{portrait&&<image href={portrait} x="58" y="-50" width="98" height="108" clipPath="url(#cabezon-preview)"/>}<path d="M78 2Q107 -16 136 2V18H78Z" fill="#112d36" opacity={portrait?0:.95}/><path d="M78 72 89 62M125 62 137 72" stroke="#e1d1a8" strokeWidth="5"/><path d="M85 74Q107 64 131 74" fill="none" stroke="#10252b" strokeWidth="5"/></svg>
      </div>
    </SelectionReel>
    {part==='driver'&&<div className="cabezon-actions"><button type="button" onClick={()=>onStudio(true)}>CREA TU CABEZÓN</button>{custom&&<button type="button" onClick={()=>{const id=custom;const cloudPath=heads.find(head=>head.id===id)?.cloudPath;void deleteHead(id).then(async()=>{if(cloudPath){const [{deleteGeneratedHead},{supabase}]=await Promise.all([import('./head/cloud'),import('../../auth/client')]);if(supabase)await deleteGeneratedHead(supabase,id,cloudPath).catch(()=>undefined)}setRevision(n=>n+1);update({driver:'crew'})})}}>BORRAR CABEZÓN</button>}</div>}
    {part==='color'&&<label className="kart-console-color">COLOR LIBRE<input type="color" value={build.color} aria-label={`Color libre P${player+1}`} onChange={e=>update({color:e.target.value})}/></label>}
    <div className="kart-console-stats" aria-label="Características del kart"><span>PUNTA<b>{Math.round(stats.speed*.46)} <small>KM/H</small></b></span><span>AGARRE<b>{Math.round(stats.grip*100)}<small>%</small></b></span><span>RESISTENCIA<b>{Math.round(stats.durability*100)}<small>%</small></b></span></div>
    <details className="kart-console-details"><summary>VER TODAS LAS ESTADÍSTICAS</summary><p>Salida {Math.round(stats.acceleration/1.6*100)}% · Derrape {Math.round(stats.drift*100)}% · Neumáticos {Math.round(stats.tireDurability*100)}%</p><small>Chasis y ruedas cambian la conducción. Pintura y piloto son cosméticos. El cabezón también.</small></details>
    </>}
  </div>
}
