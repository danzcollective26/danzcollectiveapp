/** Yeppo is DANZFLOR's walking six-petal flower, inspired by the approved bag motif.
 * Vector drawing, with real limbs and facial moods; not a person or an Arcade avatar.
 */
export type YeppoMood='neutral'|'smirk'|'wink'|'surprised'|'sleepy'|'eyebrow'
export default function YeppoMascot({expression='smirk'}:{expression?:YeppoMood}){
 const wink=expression==='wink'
 const sleepy=expression==='sleepy'
 const surprised=expression==='surprised'
 const brow=expression==='eyebrow'
 const smirk=expression==='smirk'
 return <svg className={`yeppo-flower yeppo-character yeppo-expression-${expression}`} viewBox="0 0 174 192" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id="yeppo-yellow" x1="0" y1="0" x2=".7" y2="1">
    <stop stopColor="#ffe98c"/><stop offset=".8" stopColor="#ffd268"/><stop offset="1" stopColor="#f8c85f"/>
   </linearGradient>
  </defs>
  <g className="yeppo-sparkles" fill="#ffdf7b"><path d="M145 11l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M30 33l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g>
  <g className="yeppo-limbs" fill="none" stroke="#4b3338" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
   <path className="yeppo-left-arm" d="M77 97Q43 101 29 77T22 36"/>
   <path className="yeppo-right-arm" d="M112 94Q155 93 149 126"/>
   <path className="yeppo-left-leg" d="M83 104Q63 135 53 162"/>
   <path className="yeppo-right-leg" d="M109 104Q116 132 131 163"/>
  </g>
  <g className="yeppo-limbs-fill" fill="none" stroke="url(#yeppo-yellow)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
   <path className="yeppo-left-arm" d="M77 97Q43 101 29 77T22 36"/>
   <path className="yeppo-right-arm" d="M112 94Q155 93 149 126"/>
   <path className="yeppo-left-leg" d="M83 104Q63 135 53 162"/>
   <path className="yeppo-right-leg" d="M109 104Q116 132 131 163"/>
  </g>
  <g stroke="#4b3338" strokeWidth="6" strokeLinejoin="round" fill="url(#yeppo-yellow)">
   <path className="yeppo-left-hand" d="M12 41Q2 37 7 27L12 20Q17 16 19 22Q17 9 25 10Q32 11 29 21Q39 15 41 25Q42 34 30 37L25 45Q18 47 12 41Z"/>
   <path className="yeppo-right-hand" d="M139 128Q132 121 138 116Q143 111 147 116Q148 108 156 113Q162 117 159 122Q168 121 168 130Q166 141 155 141L146 140Q139 140 139 128Z"/>
   <path className="yeppo-left-foot" d="M37 159Q29 166 30 173Q31 180 51 181Q77 185 75 173Q74 163 60 159Z"/>
   <path className="yeppo-right-foot" d="M119 160Q115 170 121 177Q130 182 151 180Q162 179 157 171Q150 158 133 158Z"/>
  </g>
  <g className="yeppo-head" transform="translate(0 0)" fill="url(#yeppo-yellow)" stroke="#4b3338" strokeWidth="5.2">
   {Array.from({length:6},(_,i)=><ellipse key={i} cx="97" cy="39" rx="15.8" ry="24" transform={`rotate(${i*60} 97 70)`}/>)}
   <ellipse cx="97" cy="70" rx="25" ry="23" strokeWidth="4.8"/>
  </g>
  <g className="yeppo-features" fill="none" stroke="#4b3338" strokeWidth="4" strokeLinecap="round">
   {brow&&<path d="M82 56l11-5"/>}
   {sleepy?<><path d="M80 69q7 5 13 0"/><path d="M104 69q7 5 13 0"/></>
    :<><path d={wink?'M80 71q7 4 13-1':'M86 65v7'}/><path d="M108 65v7"/></>}
   {surprised?<ellipse cx="98" cy="83" rx="4.5" ry="7.5"/>:<path d={smirk||brow?'M88 83q11 10 22-1':'M87 82q11 13 23 0'}/>}
  </g>
  {wink&&<g className="yeppo-tongue"><path d="M96 89q7 2 7 8q-3 7-8 1Z" fill="#e97b7b" stroke="#4b3338" strokeWidth="2"/></g>}
 </svg>
}
