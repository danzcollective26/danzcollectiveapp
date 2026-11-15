export default function SnakeCable({ points, grid }: { points:readonly {x:number;y:number}[];grid:number }) {
  const line=points.map(p=>`${p.x+.5},${p.y+.5}`).join(' '),tail=points.at(-1)!,previous=points.at(-2)??{x:tail.x-1,y:tail.y}
  const angle=Math.atan2(tail.y-previous.y,tail.x-previous.x)*180/Math.PI
  return <svg className="snake-body-art snake-cable-detailed" viewBox={`0 0 ${grid} ${grid}`} aria-hidden="true">
    <polyline className="cable-shadow" points={line}/><polyline className="cable-jacket" points={line}/><polyline className="cable-braid" points={line}/><polyline className="cable-highlight" points={line}/>
    <g transform={`translate(${tail.x+.5} ${tail.y+.5}) rotate(${angle})`}><rect x="-.34" y="-.32" width=".68" height=".64" rx=".15" fill="#131d21" stroke="#738079" strokeWidth=".05"/><path d="M-.21-.26v.52M-.08-.26v.52" stroke="#85917b" strokeWidth=".04"/><rect x=".27" y="-.14" width=".46" height=".28" rx=".03" fill="#d6ba72"/><path d="M.45-.15v.3M.61-.15v.3" stroke="#28302b" strokeWidth=".06"/><path d="M.27-.1h.45" stroke="#fff1b4" strokeWidth=".05"/></g>
  </svg>
}
