import { memo } from 'react'

/** Reusable, static vector scenography. Keeps the center clear for targets. */
export default memo(function ClubRig({ id }: { id:string }) {
  return <g aria-hidden="true" pointerEvents="none">
    <defs><linearGradient id={`${id}-case`} x2="1" y2="1"><stop stopColor="#626961"/><stop offset=".15" stopColor="#232e30"/><stop offset=".8" stopColor="#10191e"/><stop offset="1" stopColor="#4e5a58"/></linearGradient><radialGradient id={`${id}-cone`} cx="35%" cy="25%"><stop stopColor="#6b7169"/><stop offset=".5" stopColor="#242b2b"/><stop offset=".85" stopColor="#11191b"/><stop offset="1" stopColor="#55605b"/></radialGradient><linearGradient id={`${id}-beam`} x2="0" y2="1"><stop stopColor="#ffe6a8" stopOpacity=".2"/><stop offset="1" stopColor="#eed49e" stopOpacity="0"/></linearGradient></defs>
    <path d="M45 105H595M45 118H595" stroke="#141d1e" strokeWidth="7"/>
    {Array.from({length:10},(_,n)=><path key={n} d={`M${50+n*54} 104l24 16 26-16`} fill="none" stroke="#9b9d84" strokeOpacity=".4" strokeWidth="2"/>)}
    {[65,575].map((x,i)=><g key={x}><path d={`M${x-8} 120 ${x+8} 120 ${i?550:90} 625 ${i?380:260} 625Z`} fill={`url(#${id}-beam)`}/><rect x={x-13} y="115" width="26" height="14" rx="4" fill="#111b20" stroke="#7c8e7f"/><path d={`M${x-8} 130h16`} stroke="#f7dfa0" strokeWidth="3"/>
      <rect x={x-30} y="238" width="60" height="204" rx="6" fill="#000" opacity=".3" transform="translate(5 9)"/><rect x={x-30} y="238" width="60" height="204" rx="6" fill={`url(#${id}-case)`} stroke="#949a83" strokeOpacity=".6"/>
      {[274,340,402].map((y,n)=><g key={y}><circle cx={x} cy={y} r={n===0?19:24} fill="#090f14" stroke="#70786e" strokeWidth="2"/><circle cx={x} cy={y} r={n===0?14:19} fill={`url(#${id}-cone)`}/><circle cx={x} cy={y} r="6" fill="#111a20"/></g>)}
      <path d={`M${x-22} 249h9M${x+13} 249h9M${x-22} 433h9M${x+13} 433h9`} stroke="#b7bd9d" strokeWidth="3"/>
      <path d={`M${x-26} 448q-15 45 8 76t-7 67`} stroke="#111b1d" strokeWidth="4" fill="none"/>
    </g>)}
    <path d="M28 632Q320 606 612 632L620 649Q320 626 20 649Z" fill="#0b161c" stroke="#959581" strokeOpacity=".3"/>
  </g>
})
