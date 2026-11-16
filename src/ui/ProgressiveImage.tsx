import { useRef, useState, type CSSProperties } from 'react'
import './photos.css'

export default function ProgressiveImage({ src, previewSrc, alt, className = '', loading = 'lazy', style, referrerPolicy }: {
  src: string; previewSrc?: string; alt: string; className?: string; loading?: 'lazy' | 'eager'; style?: CSSProperties; referrerPolicy?: 'no-referrer'
}) {
  const latest = useRef(src)
  latest.current = src
  const [ready, setReady] = useState('')
  const [failed, setFailed] = useState('')
  const loaded = ready === src
  const error = failed === src
  return <span className={`progressive-photo ${className}`} data-loaded={loaded} data-error={error}>
    <img src={src} style={style} alt={alt} loading={loading} decoding="async" draggable={false} referrerPolicy={referrerPolicy} data-ready={loaded} onLoad={async event => {
      const image = event.currentTarget, requested = src
      try { await image.decode() } catch { /* A loaded image is usable on browsers without decode(). */ }
      if (latest.current === requested && image.isConnected && image.naturalWidth > 0) setReady(requested)
    }} onError={() => { if (latest.current === src) setFailed(src) }}/>
    {!loaded && previewSrc && previewSrc !== src && <img className="photo-preview-layer" style={style} src={previewSrc} alt="" aria-hidden="true" referrerPolicy={referrerPolicy} draggable={false} decoding="async"/>}
    {!loaded && (!previewSrc || previewSrc === src) && !error && <span className="photo-placeholder" aria-hidden="true"/>}
    {error && <span className="photo-load-error" role="status">{previewSrc ? 'Vista previa · la foto completa no está disponible.' : 'Imagen no disponible'}</span>}
  </span>
}
