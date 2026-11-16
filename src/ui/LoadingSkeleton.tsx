import './premium.css'
export default function LoadingSkeleton({ label, kind = 'gallery' }: { label: string; kind?: 'gallery' | 'passport' }) {
  return <div className={`loading-skeleton skeleton-${kind}`} role="status" aria-busy="true">
    <p>{label}</p>
    <div className="skeleton-grid" aria-hidden="true">{Array.from({ length: kind === 'passport' ? 2 : 6 }, (_, i) => <div className="skeleton-card" key={i}><i/><span/><span/></div>)}</div>
  </div>
}
