import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminPhoto, Database } from '../types/database'
import { verifiedSignedUrl } from '../cloud/PrivateGallery'
import { useViewerBack } from '../cloud/useViewerBack'
import OriginalFileActions from '../cloud/OriginalFileActions'
import { PHOTO_BUCKET } from './photoBatch'
import '../cloud/PrivateGallery.css'

type Photo = AdminPhoto & { url?: string }
export default function AlbumPhotoViewer({ client, userId, eventId, title, photos, photoId, onPhoto, onClose }: {
  client: SupabaseClient<Database>; userId: string; eventId: string; title: string
  photos: Photo[]; photoId: string; onPhoto: (id: string) => void; onClose: () => void
}) {
  const photo = photos.find(p => p.id === photoId)
  const [source, setSource] = useState<{ id: string; url: string } | null>(null)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dialog = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; x: number; y: number; px: number; py: number } | null>(null)
  const lastTap = useRef(0)
  const pointerType = useRef('mouse')
  const close = useViewerBack(true, onClose)
  const index = photos.findIndex(p => p.id === photoId)
  const move = (step: number) => { const next = photos[(index + step + photos.length) % photos.length]; if (next) onPhoto(next.id) }

  useEffect(() => { setZoom(false); setPan({ x: 0, y: 0 }); lastTap.current = 0 }, [photoId])
  useEffect(() => {
    let current = true
    let timer: ReturnType<typeof setTimeout>
    let expiry: ReturnType<typeof setTimeout>
    setSource(null); setError('')
    async function refresh() {
      if (!photo) return
      try {
        const at = Date.now()
        const result = await client.storage.from(PHOTO_BUCKET).createSignedUrls([photo.storage_path], 60)
        if (!current) return
        const url = !result.error ? verifiedSignedUrl(client, result.data?.[0]?.signedUrl ?? null) : null
        if (!url) throw new Error('Photo unavailable')
        setSource({ id: photo.id, url }); setError('')
        clearTimeout(expiry)
        expiry = setTimeout(() => { if (current) { setSource(null); setError('Vuelve a abrir la foto para renovar el acceso.') } }, Math.max(0, at + 60_000 - Date.now()))
      } catch { if (current) setError('No se pudo abrir el original. Puedes volver al álbum e intentarlo de nuevo.') }
      if (current) timer = setTimeout(() => { void refresh() }, 45_000)
    }
    void refresh()
    return () => { current = false; clearTimeout(timer); clearTimeout(expiry) }
  }, [client, userId, eventId, photo?.id, photo?.storage_path])

  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector('button')?.focus()
    return () => {
      document.body.style.overflow = overflow
      if (before?.isConnected) before.focus()
    }
  }, [])
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1) }
      if (e.key === 'Tab') {
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [])
        const first = buttons[0], last = buttons.at(-1)
        if (e.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keys)
    return () => document.removeEventListener('keydown', keys)
  })

  const start = (e: PointerEvent<HTMLDivElement>) => {
    pointerType.current = e.pointerType
    if (!e.isPrimary || e.button !== 0) { gesture.current = null; return }
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* Optional in embedded browsers. */ }
  }
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current, box = stage.current, image = box?.querySelector('img')
    if (!zoom || !g || g.id !== e.pointerId || !box || !image?.naturalWidth) return
    const fit = Math.min(box.clientWidth / image.naturalWidth, box.clientHeight / image.naturalHeight)
    const x = Math.max(0, (image.naturalWidth * fit * 2 - box.clientWidth) / 2), y = Math.max(0, (image.naturalHeight * fit * 2 - box.clientHeight) / 2)
    setPan({ x: Math.max(-x, Math.min(x, g.px + e.clientX - g.x)), y: Math.max(-y, Math.min(y, g.py + e.clientY - g.y)) })
  }
  const end = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current; gesture.current = null
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    if (!zoom && Math.abs(dx) >= 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) move(dx < 0 ? 1 : -1)
    else if (e.pointerType === 'touch' && Math.hypot(dx, dy) < 10) {
      if (lastTap.current > 0 && e.timeStamp - lastTap.current < 320) { setZoom(v => !v); setPan({ x: 0, y: 0 }); lastTap.current = 0 }
      else lastTap.current = e.timeStamp
    }
  }
  if (!photo) return null
  return <div ref={dialog} className="private-gallery-viewer" role="dialog" aria-modal="true" aria-label={`Foto del álbum ${title}`} tabIndex={-1}>
    <div className="private-gallery-viewer-heading"><div><strong>{title}</strong><span className="private-photo-position">Foto {index + 1} de {photos.length} de esta página · {photo.status === 'published' ? 'Publicada' : 'Borrador'}</span></div><button className="outline-btn" onClick={close} aria-label="Cerrar foto del álbum">CERRAR ✕</button></div>
    <div ref={stage} className={`private-gallery-viewer-stage${zoom ? ' is-zoomed' : ''}`} onPointerDown={start} onPointerMove={drag} onPointerUp={end} onPointerCancel={() => { gesture.current = null }} onDoubleClick={() => { if (pointerType.current !== 'touch') { setZoom(v => !v); setPan({ x: 0, y: 0 }) } }}>
      {source?.id === photo.id || photo.url ? <img draggable={false} src={source?.id === photo.id ? source.url : photo.url} style={{ transform: zoom ? `translate(${pan.x}px, ${pan.y}px) scale(2)` : undefined }} alt={photo.original_name || 'Foto del álbum'} referrerPolicy="no-referrer" /> : <p role="status">Abriendo el original…</p>}
    </div>
    <p className="private-viewer-hint">{photo.original_name} · Desliza para cambiar de foto. Doble toque para ampliar.</p>
    <div className="private-gallery-viewer-actions">
      {photos.length > 1 && <button className="outline-btn" onClick={() => move(-1)} aria-label="Foto anterior del álbum">←</button>}
      <button className="outline-btn" aria-pressed={zoom} onClick={() => { setZoom(v => !v); setPan({ x: 0, y: 0 }) }}>{zoom ? 'AJUSTAR −' : 'AMPLIAR +'}</button>
      {photos.length > 1 && <button className="outline-btn" onClick={() => move(1)} aria-label="Foto siguiente del álbum">→</button>}
    </div>
    <OriginalFileActions key={`${userId}:${eventId}:${photo.id}`} client={client} owner={userId} eventId={eventId} photoId={photo.id} path={photo.storage_path} name={photo.original_name} mime={photo.mime_type} bytes={photo.original_bytes} sha256={photo.sha256} />
    {error && <p role="alert">{error}</p>}
  </div>
}
