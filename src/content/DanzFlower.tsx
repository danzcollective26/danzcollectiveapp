/** Geometric derivative of the collective's supplied six-petal flower. */
export default function DanzFlower({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="4.5">{[[50, 20], [76, 35], [76, 65], [50, 80], [24, 65], [24, 35]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="17.8" />)}</g>
    <circle cx="50" cy="50" r="19.2" fill="currentColor" />
  </svg>
}
