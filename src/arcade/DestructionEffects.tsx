import type {DestructionWeapon,DestructionShot} from './GrooveDestruction'

/** Distinct SVG weapon silhouettes and trails. No image downloads or heavy effects. */
const bursts=Array.from({length:12},(_,i)=>i*30)
export function DestructionFx({shot}:{shot:DestructionShot}){
 const color=({blaster:'#8cf9ea',scatter:'#ffdb7c',laser:'#fa7a86',paint:'#8eed79',cannon:'#d5a9ff',boomerang:'#ffa970',flower:'#fff2b9',yeppo:'#c8f879'} as Record<DestructionWeapon,string>)[shot.weapon]
 const {x,y}=shot
 return <g className={'dn-fx dn-fx-'+shot.weapon} data-weapon-fx={shot.weapon} pointerEvents="none">
  {shot.weapon==='laser'&&<g><path d={`M${x} 760V0`} stroke={color} strokeWidth="36" opacity=".22"/><path d={`M${x} 760V0`} stroke="#fff4e7" strokeWidth="9"/><path d={`M${x} 760V0`} stroke={color} strokeWidth="3"/></g>}
  {shot.weapon==='scatter'&&<g>{[-42,-21,0,21,42].map((angle,i)=><g key={i} transform={`translate(${x},${y}) rotate(${angle})`}><path d="M0 0L0 -145" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray="12 11"/><circle cy="-130" r="9" fill="#fff1cc"/></g>)}</g>}
  {shot.weapon==='blaster'&&<g><path d={`M320 760L${x} ${y}`} stroke={color} strokeWidth="8" strokeLinecap="round"/><path d={`M320 760L${x} ${y}`} stroke="#fff" strokeWidth="2"/><circle cx={x} cy={y} r="21" fill="none" stroke={color} strokeWidth="5"/></g>}
  {shot.weapon==='paint'&&<g>{bursts.map((angle,i)=><ellipse key={i} cx={x+Math.cos(angle*Math.PI/180)*(35+i%3*29)} cy={y+Math.sin(angle*Math.PI/180)*(35+i%3*29)} rx={8+i%3*6} ry={13+i%4*7} transform={`rotate(${angle} ${x+Math.cos(angle*Math.PI/180)*(35+i%3*29)} ${y+Math.sin(angle*Math.PI/180)*(35+i%3*29)})`} fill={i%3===0?'#fce77a':i%3===1?'#86ffd5':color}/>)}</g>}
  {shot.weapon==='cannon'&&<g>{[42,85,130].map((r,i)=><circle key={r} cx={x} cy={y} r={r} fill="none" stroke={i===0?'#fff':color} strokeWidth={11-i*2} opacity={1-i*.22}/>)}<text x={x} y={y-18} fontSize="36" textAnchor="middle" fill="#fff" fontWeight="900">BOOM</text></g>}
  {shot.weapon==='boomerang'&&<g><path d={`M${x-120} ${y+50}Q${x+15} ${y-170} ${x+155} ${y+15}Q${x+40} ${y+95} ${x-70} ${y+3}`} stroke={color} strokeWidth="9" fill="none" strokeDasharray="30 12" strokeLinecap="round"/><g transform={`translate(${x+70} ${y-60}) rotate(-25)`}><circle r="36" fill="#121518" stroke="#ffce91" strokeWidth="6"/><circle r="13" fill="#edb74c"/></g></g>}
  {shot.weapon==='flower'&&<g>{bursts.slice(0,8).map((angle,i)=><g key={i} transform={`translate(${x},${y}) rotate(${angle})`}><ellipse cy="-70" rx="17" ry="36" fill={i%2?'#fff1af':'#ffc377'} stroke="#563b3b" strokeWidth="2"/></g>)}<circle cx={x} cy={y} r="23" fill="#fff6d1"/><text x={x} y={y+12} fontSize="29" textAnchor="middle">✿</text></g>}
  {shot.weapon==='yeppo'&&<g transform={`translate(${x},${y}) rotate(-17)`}><path d="M-28 60Q-40 14-28-18Q-22-45-4-39Q3-55 18-40Q32-43 38-26Q53-14 42 5L40 49Q10 76-28 60Z" fill={color} stroke="#413333" strokeWidth="9"/><path d="M-21 7L30-10M-17 23L33 7" stroke="#413333" strokeWidth="5" strokeLinecap="round"/><text x="0" y="-67" textAnchor="middle" fontSize="35" fill="#fff2cb" fontWeight="900">¡TOMA!</text></g>}
  {shot.weapon!=='laser'&&shot.weapon!=='blaster'&&<circle cx={x} cy={y} r={shot.hits?18:9} fill="#fff" opacity=".6"/>}
 </g>
}

export function DestructionWeaponPreview({weapon}:{weapon:DestructionWeapon}){
 const icon:Record<DestructionWeapon,string>={blaster:'✦',scatter:'✹',laser:'⚡',paint:'●',cannon:'♫',boomerang:'↝',flower:'✿',yeppo:'☝'}
 return <div className={'dn-equipped dn-equipped-'+weapon} data-equipped-weapon={weapon} aria-label={'Arma equipada: '+weapon}>
  <div className="dn-equipped-body"><span className="dn-equipped-barrel">{icon[weapon]}</span><span className="dn-equipped-grip"/><span className="dn-equipped-glint"/></div>
 </div>
}
