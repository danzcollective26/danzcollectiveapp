import { DRIVERS, type KartBuild } from './garage'

/** A readable 2D identity for each real kart build, shared across all garage tabs. */
export default function KartSilhouette({ build }: { build: KartBuild }) {
  const driver = DRIVERS.find(d => d.id === build.driver) ?? DRIVERS[0]
  const sprint = build.chassis === 'sprint'
  const hauler = build.chassis === 'hauler'
  const wheelWidth = build.wheels === 'endurance' ? 21 : build.wheels === 'light' ? 13 : 17
  const wheelColor = build.wheels === 'slick' ? '#e2c77b' : build.wheels === 'slide' ? '#9c8d6e' : '#6f888b'
  return <svg viewBox="0 0 240 150" role="img" data-chassis={build.chassis} aria-label={`Vista superior del chasis ${build.chassis}`}>
    <ellipse cx="120" cy="133" rx="98" ry="11" fill="#07141c" opacity=".65"/>
    <g fill="#091b20" stroke={wheelColor} strokeWidth="2">
      {[43,180].flatMap(x => [29,96].map(y => <g key={`${x}:${y}`}>
        <rect x={x} y={y} width={wheelWidth} height="33" rx={wheelWidth/3}/>
        {build.wheels === 'grip' || build.wheels === 'endurance'
          ? <path d={`M${x+4} ${y+7}h${wheelWidth-8}m-${wheelWidth-8} 8h${wheelWidth-8}m-${wheelWidth-8} 8h${wheelWidth-8}`} stroke="#b6c6ac" fill="none" strokeWidth="2"/>
          : <path d={`M${x+3} ${y+6}v21`} stroke={wheelColor} fill="none" strokeWidth="1.8"/>}
      </g>))}
    </g>
    {sprint ? <g data-shape="sprint">
      <path d="M112 10 128 10 145 49 150 118 92 118 95 49Z" fill={build.color} stroke="#f8e6b5" strokeWidth="2.5"/>
      <path d="M112 12 128 12 128 47 112 47Z" fill="#102934"/>
      <path d="M84 23h72l14 10-8 12H78l-8-12Z" fill={build.color} stroke="#e8e0b8" strokeWidth="2"/>
      <path d="M80 114h80l8 12H72Z" fill="#f3e5b2" stroke="#0c2731" strokeWidth="3"/>
      <path d="M91 64 66 87v24l27-10M149 64l25 23v24l-27-10" fill={build.color} stroke="#f8e6b5" strokeWidth="2"/>
      <path d="M116 16h8M112 22h16M104 113h32" stroke="#112a33" strokeWidth="3"/>
    </g> : hauler ? <g data-shape="hauler">
      <path d="M84 15H156L168 39V119H72V39Z" fill={build.color} stroke="#f6e4ad" strokeWidth="3"/>
      <path d="M77 27H163M74 47H166M77 110H163" stroke="#122a32" strokeWidth="8"/>
      <path d="M85 20H155V47H85ZM85 97h70v18H85Z" fill="#b9bb9a" opacity=".48"/>
      <path d="M73 51 63 60v43l10 8M167 51l10 9v43l-10 8" fill="none" stroke="#f2dfaa" strokeWidth="5"/>
      <path d="M81 55h8v48h-8m70-48h8v48h-8" stroke="#182b33" strokeWidth="4" fill="none"/>
      <path d="M90 16v-8h60v8M90 119v9h60v-9" stroke="#dce0cb" strokeWidth="6" strokeLinecap="round"/>
      <path d="M86 40h68M85 108h70" stroke="#c4d5c0" strokeWidth="2"/>
    </g> : <g data-shape="club">
      <path d="M104 17Q120 5 136 17L149 48l11 68-14 9H94l-14-9 11-68Z" fill={build.color} stroke="#e9debb" strokeWidth="2.5"/>
      <path d="M102 18h36l5 22H97Z" fill="#173541"/>
      <path d="M78 30h32v14H74m58-14h34v14h-36" fill={build.color} stroke="#e9debb" strokeWidth="3"/>
      <path d="M84 116h72l9 8H75Z" fill="#e6dcb6" stroke="#0c2731" strokeWidth="2"/>
      <path d="M90 56 74 75v30l15-7m61-42 16 19v30l-15-7" fill={build.color} stroke="#e9debb" strokeWidth="2"/>
      <path d="M99 17h42M103 108h34" stroke="#1b3940" strokeWidth="3"/>
    </g>}
    <path d="M109 70q11-12 22 0l10 33h-42Z" fill={driver.color} stroke="#172d31" strokeWidth="2"/>
    <circle cx="120" cy="69" r="18" fill={driver.helmet} stroke="#f7edce" strokeWidth="2"/>
    <path d="M105 66q15-9 30 0v12h-30Z" fill="#132e38"/>
    <path d="M110 69h20" stroke="#5e9498" strokeWidth="2"/>
    <path d="M102 88 94 99m44-11 8 11" stroke="#e8d3ac" strokeWidth="5" strokeLinecap="round"/>
    <path d="M109 99q11-7 22 0" fill="none" stroke="#142c33" strokeWidth="5"/>
    <circle cx="120" cy="103" r="6" fill="#193b42" stroke="#b2cbc2" strokeWidth="2"/>
  </svg>
}
