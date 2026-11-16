export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="content section-fallback" role="status">
      <p>{label}</p>
      <div className="danz-skeleton danz-skeleton-title" />
      <div className="danz-skeleton danz-skeleton-line" />
      <div className="danz-skeleton danz-skeleton-line short" />
    </div>
  )
}

export function GallerySkeleton({ label = 'Cargando fotografías', count = 8 }: { label?: string; count?: number }) {
  return (
    <div className="danz-skeleton-grid" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => <div key={index} className="danz-skeleton danz-skeleton-photo" />)}
    </div>
  )
}

export function PassportSkeleton() {
  return (
    <div className="danz-skeleton-stamps" aria-hidden="true">
      <div className="danz-skeleton danz-skeleton-stamp" />
      <div className="danz-skeleton danz-skeleton-stamp" />
    </div>
  )
}
