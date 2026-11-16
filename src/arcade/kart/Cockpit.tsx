import type { Car } from './engine'

export default function Cockpit({car}:{car:Car}){
  return <div className="kart-cockpit" aria-hidden="true" style={{color:car.build.color}}>
    <svg viewBox="0 0 800 210" preserveAspectRatio="xMidYMax slice">
      <defs><linearGradient id="danz-dash" x2="0" y2="1"><stop stopColor="#38434a"/><stop offset="1" stopColor="#0b151b"/></linearGradient></defs>
      <path d="M-20 185 65 133 170 112 252 135 548 135 630 112 735 133 820 185V230H-20Z" fill="url(#danz-dash)" stroke="#718381" strokeWidth="3"/>
      <path d="m70 138 98-17 72 26m320 0 72-26 98 17" fill="none" stroke="currentColor" strokeWidth="10"/>
      <path d="M290 157h220v43H290z" fill="#0b1e22" stroke="#64766a" strokeWidth="2"/>
      <text x="400" y="181" textAnchor="middle" fill="#d8e8d0" fontFamily="monospace" fontWeight="bold" fontSize="13">DANZ / RACING DEPT.</text>
      <g transform={`translate(400 170) rotate(${car.steering*32})`}>
        <circle r="91" fill="none" stroke="#090f14" strokeWidth="26"/><circle r="91" fill="none" stroke="#4e5c5a" strokeWidth="2"/>
        <path d="M-78-42 0-7 78-42M0 0v82" fill="none" stroke="#8e9b94" strokeWidth="13" strokeLinejoin="round"/>
        <circle r="27" fill="#18262b" stroke="currentColor" strokeWidth="3"/>
        <path d="M0-15c-8-14-19-1-11 6-17 2-11 19 0 15-2 17 17 17 15 0 15 6 22-13 7-16 7-13-10-20-11-5Z" fill="currentColor" transform="translate(0 1) scale(.7)"/>
        <path d="M-4-99h8v16h-8z" fill="currentColor"/>
      </g>
    </svg>
  </div>
}
