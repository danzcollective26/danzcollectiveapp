import { memo } from 'react'
import { TRACKS, type Race } from './engine'
import { KART_LIVERIES } from './preferences'

const outlines=Object.fromEntries(Object.values(TRACKS).map(t=>[t.id,[...t.points,t.points[0]].map(p=>`${p.x},${p.y}`).join(' ')]))
export default memo(function KartMinimap({race,livery}:{race:Race;livery:number}){
  return <svg className="kart-minimap" viewBox="0 0 1000 720" aria-label="Mapa del circuito y posición de los karts" role="img"><polyline points={outlines[race.track]} fill="none" stroke="#081b24" strokeWidth="76" strokeLinejoin="round"/><polyline points={outlines[race.track]} fill="none" stroke="#c1d0af" strokeWidth="20" strokeLinejoin="round"/>{race.cars.map((c,i)=><g key={c.id}><circle cx={c.x} cy={c.y} r={i===0?29:23} fill={KART_LIVERIES[(livery+i)%4].color} stroke="#10242b" strokeWidth="10"/>{i===0&&<circle cx={c.x} cy={c.y} r="8" fill="#18332a"/>}</g>)}</svg>
})
