import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import DanzFlower from '../content/DanzFlower'
import OriginalFileActions from './OriginalFileActions'
import './PrivateGallery.css'

export type PrivateGalleryProps = {
  client: SupabaseClient<Database> | null
  userId: string | null
  authLoading: boolean
  onSignIn: () => void
  initialEventId?: string
}

type Event = Pick<Database['public']['Tables']['danz_events']['Row'], 'id' | 'title' | 'starts_at'>
type Photo = { id: string; path: string; previewPath: string; name: string | null; mime: string | null; bytes: number; sha256: string | null; url: string }
type Scope = { client: SupabaseClient<Database> | null; owner: string | null }
type EventState = Scope & { items: Event[]; loading: boolean; error: boolean }
type PhotoState = Scope & { eventId: string; items: Photo[]; loading: boolean; error: boolean; expiresAt: number }
type PhotoZoom = { owner: string; eventId: string; photoId: string; x: number; y: number }
type PhotoGesture = { id: number; x: number; y: number; originX: number; originY: number; moved: boolean }
const BUCKET = 'danz-event-photos'
const URL_TTL_SECONDS = 60
const REFRESH_MS = 45_000

function sameAccount(state: Scope, client: SupabaseClient<Database> | null, owner: string | null) {
  return state.client === client && state.owner === owner
}

// The SDK builds URLs from its configured Storage endpoint. This getter performs
// no request; its public URL is used ONLY to check that endpoint, never to load a file.
export function verifiedSignedUrl(client: SupabaseClient<Database>, value: string | null): string | null {
  if (!value) return null
  try {
    const configured = new URL(client.storage.from(BUCKET).getPublicUrl('__origin_check__').data.publicUrl)
    const signed = new URL(value)
    const expectedPath = configured.pathname.replace('/object/public/', '/object/sign/').replace('__origin_check__', '')
    return signed.origin === configured.origin && signed.pathname.startsWith(expectedPath) && signed.searchParams.has('token')
      ? signed.href : null
  } catch { return null }
}

function eventDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleDateString('es-ES', { dateStyle: 'medium' })
}

export default function PrivateGallery({ client, userId, authLoading, onSignIn, initialEventId = '' }: PrivateGalleryProps) {
  const [events, setEvents] = useState<EventState>({ client: null, owner: null, items: [], loading: true, error: false })
  const [choice, setChoice] = useState<{ owner: string | null; id: string }>({ owner: userId, id: initialEventId })
  const [photos, setPhotos] = useState<PhotoState>({ client: null, owner: null, eventId: '', items: [], loading: true, error: false, expiresAt: 0 })
  const [retry, setRetry] = useState(0)
  const [pageSize, setPageSize] = useState(60)
  const [fullPhoto, setFullPhoto] = useState<{ owner: string; eventId: string; id: string; url: string } | null>(null)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [viewer, setViewer] = useState<{ owner: string; eventId: string; photoId: string } | null>(null)
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState<PhotoZoom | null>(null)
  const gesture = useRef<PhotoGesture | null>(null)
  const activePointers = useRef(new Set<number>())
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null)
  const lastPointerType = useRef('mouse')

  const eventItems = !authLoading && sameAccount(events, client, userId) ? events.items : []
  const selectedEvent = eventItems.find((event) => choice.owner === userId && event.id === choice.id) ?? eventItems[0]
  const eventId = selectedEvent?.id ?? ''
  const photoItems = !authLoading && visible && sameAccount(photos, client, userId) && photos.eventId === eventId && Date.now() < photos.expiresAt ? photos.items : []
  const shownPhoto = viewer?.owner === userId && viewer.eventId === eventId
    ? photoItems.find((photo) => photo.id === viewer.photoId) : undefined
  const ownZoom = zoom?.owner === userId && zoom.eventId === eventId && zoom.photoId === shownPhoto?.id ? zoom : null
  const photoIndex = shownPhoto ? photoItems.findIndex(photo => photo.id === shownPhoto.id) : -1

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!client || !userId || authLoading) {
      setEvents({ client, owner: userId, items: [], loading: true, error: false })
      return
    }
    const abort = new AbortController()
    let current = true
    setEvents({ client, owner: userId, items: [], loading: true, error: false })
    void (async () => {
      try {
        const { data, error } = await client.from('danz_events').select('id,title,starts_at')
          .in('status', ['published', 'archived']).order('starts_at', { ascending: false, nullsFirst: false }).abortSignal(abort.signal)
        if (!current) return
        if (error) throw error
        setEvents({ client, owner: userId, items: data ?? [], loading: false, error: false })
      } catch {
        if (current) setEvents({ client, owner: userId, items: [], loading: false, error: true })
      }
    })()
    return () => { current = false; abort.abort() }
  }, [client, userId, authLoading, retry])

  useEffect(() => {
    if (!client || !userId || authLoading || !eventId || !visible) {
      setPhotos({ client, owner: userId, eventId, items: [], loading: true, error: false, expiresAt: 0 })
      return
    }
    const abort = new AbortController()
    let current = true
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let expiryTimer: ReturnType<typeof setTimeout> | undefined
    const scope = { client, owner: userId, eventId, expiresAt: 0 }
    setPhotos({ ...scope, items: [], loading: true, error: false })
    async function refresh() {
      try {
        // RLS checks attendance and publication; the event filter is an additional
        // query constraint, never a replacement for server authorization.
        const { data, error } = await client!.from('danz_photos').select('id,storage_path,preview_path,original_name,mime_type,original_bytes,sha256')
          .eq('event_id', eventId).eq('status', 'published').order('created_at').order('id').range(0, pageSize - 1).abortSignal(abort.signal)
        if (!current) return
        if (error) throw error
        const rows = data ?? []
        if (!rows.length) clearTimeout(expiryTimer)
        let items: Photo[] = []
        let expiresAt = 0
        if (rows.length) {
          const signedAt = Date.now()
          expiresAt = signedAt + URL_TTL_SECONDS * 1000
          const { data: signed, error: signingError } = await client!.storage.from(BUCKET)
            .createSignedUrls(rows.map((row) => row.preview_path ?? row.storage_path), URL_TTL_SECONDS)
          if (!current) return
          if (signingError || !signed) throw signingError
          const byPath = new Map(signed.filter(item => !item.error).map(item => [item.path, item]))
          items = rows.map((row) => {
            const previewPath = row.preview_path ?? row.storage_path
            const entry = byPath.get(previewPath)
            const url = verifiedSignedUrl(client!, entry?.signedUrl ?? null)
            if (!url) throw new Error('Unavailable private photo')
            return { id: row.id, path: row.storage_path, previewPath, name: row.original_name, mime: row.mime_type, bytes: row.original_bytes, sha256: row.sha256, url }
          })
          clearTimeout(expiryTimer)
          expiryTimer = setTimeout(() => {
            if (current) setPhotos({ ...scope, items: [], loading: false, error: true })
          }, Math.max(0, signedAt + URL_TTL_SECONDS * 1000 - Date.now()))
        }
        setPhotos({ ...scope, items, loading: false, error: false, expiresAt })
      } catch {
        if (current) setPhotos({ ...scope, items: [], loading: false, error: true })
      }
      if (current) refreshTimer = setTimeout(() => { void refresh() }, REFRESH_MS)
    }
    void refresh()
    return () => {
      current = false
      abort.abort()
      clearTimeout(refreshTimer)
      clearTimeout(expiryTimer)
    }
  }, [client, userId, authLoading, eventId, retry, visible, pageSize])

  useEffect(() => { setPageSize(60) }, [client, userId, eventId])
  useEffect(() => {
    setZoom(null)
    gesture.current = null
    lastTap.current = null
    activePointers.current.clear()
  }, [client, userId, authLoading, eventId, shownPhoto?.id])
  useEffect(() => {
    setFullPhoto(null)
    if (!client || !userId || !shownPhoto || shownPhoto.path === shownPhoto.previewPath) return
    let current = true
    const id = shownPhoto.id
    void client.storage.from(BUCKET).createSignedUrls([shownPhoto.path], URL_TTL_SECONDS).then(({ data, error }) => {
      const url = !error ? verifiedSignedUrl(client, data?.[0]?.signedUrl ?? null) : null
      if (current && url) setFullPhoto({ owner: userId, eventId, id, url })
    })
    return () => { current = false }
  }, [client, userId, eventId, shownPhoto?.id, shownPhoto?.url])

  useEffect(() => { setViewer(null) }, [client, userId, authLoading, eventId])

  useEffect(() => {
    if (!shownPhoto) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewer(null)
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        movePhoto(event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown) }
  }, [shownPhoto, photoItems, eventId, userId])

  const isViewerOpen = Boolean(shownPhoto)
  useEffect(() => {
    if (!isViewerOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = viewerRef.current
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [])
    controls()[0]?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const buttons = controls()
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (!first || !last) { event.preventDefault(); dialog?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isViewerOpen])

  function movePhoto(step: number) {
    if (!shownPhoto || !userId) return
    const next = photoItems[(photoIndex + step + photoItems.length) % photoItems.length]
    if (next) setViewer({ owner: userId, eventId, photoId: next.id })
  }

  function toggleZoom() {
    if (!shownPhoto || !userId) return
    setZoom(ownZoom ? null : { owner: userId, eventId, photoId: shownPhoto.id, x: 0, y: 0 })
    lastTap.current = null
  }

  function startPhotoGesture(event: PointerEvent<HTMLDivElement>) {
    activePointers.current.add(event.pointerId)
    lastPointerType.current = event.pointerType
    if (activePointers.current.size > 1) { gesture.current = null; lastTap.current = null; return }
    if (!event.isPrimary || event.button !== 0) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: ownZoom?.x ?? 0, originY: ownZoom?.y ?? 0, moved: false }
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Some embedded views cannot capture pointers; gestures inside the stage still work. */ }
  }

  function panPhoto(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 10) start.moved = true
    if (!ownZoom) return
    const stage = stageRef.current
    const image = stage?.querySelector('img')
    if (!stage || !image?.naturalWidth || !image.naturalHeight) return
    const fit = Math.min(stage.clientWidth / image.naturalWidth, stage.clientHeight / image.naturalHeight)
    const maxX = Math.max(0, (image.naturalWidth * fit * 2 - stage.clientWidth) / 2)
    const maxY = Math.max(0, (image.naturalHeight * fit * 2 - stage.clientHeight) / 2)
    setZoom({ ...ownZoom, x: Math.max(-maxX, Math.min(maxX, start.originX + dx)), y: Math.max(-maxY, Math.min(maxY, start.originY + dy)) })
  }

  function endPhotoGesture(event: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId)
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    gesture.current = null
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const tapped = !start.moved && Math.hypot(dx, dy) < 10
    if (event.pointerType === 'touch' && tapped) {
      const previous = lastTap.current
      if (previous && event.timeStamp - previous.at < 320 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 24) toggleZoom()
      else lastTap.current = { at: event.timeStamp, x: event.clientX, y: event.clientY }
      return
    }
    lastTap.current = null
    if (!ownZoom && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) movePhoto(dx < 0 ? 1 : -1)
  }

  const reload = () => setRetry((value) => value + 1)
  if (!client) return <div className="content private-gallery-state"><h2>Galerías privadas</h2><p>La conexión de las galerías todavía no está disponible.</p></div>
  if (authLoading) return <div className="content private-gallery-state" role="status">Comprobando tu sesión…</div>
  if (!userId) return <div className="content private-gallery-state"><h2>Los recuerdos de tu fiesta</h2><p>Inicia sesión para consultar las galerías a las que tienes acceso.</p><button className="primary-btn" onClick={onSignIn}>INICIAR SESIÓN</button></div>
  if (!sameAccount(events, client, userId) || events.loading) return <div className="content private-gallery-state" role="status">Cargando tus galerías…</div>
  if (events.error) return <div className="content private-gallery-state" role="alert"><p>No hemos podido cargar tus galerías. Inténtalo de nuevo.</p><button className="outline-btn" onClick={reload}>VOLVER A INTENTAR</button></div>
  if (!eventItems.length) return <div className="content private-gallery-state"><h2>Todavía no hay galerías disponibles para tu cuenta</h2><p>Aquí aparecerán los eventos y fotografías cuando tengas acceso y estén publicados.</p><button className="outline-btn" onClick={reload}>ACTUALIZAR GALERÍAS</button></div>

  const photosLoading = !sameAccount(photos, client, userId) || photos.eventId !== eventId || photos.loading
  const photosError = sameAccount(photos, client, userId) && photos.eventId === eventId && photos.error
  return <div className="content private-gallery">
    <div className="private-gallery-events" aria-label="Eventos con acceso a fotos">
      {eventItems.map((event) => <button key={event.id} type="button" aria-pressed={event.id === eventId} onClick={() => { setViewer(null); setChoice({ owner: userId, id: event.id }) }}>
        <span>{eventDate(event.starts_at)}</span><strong>{event.title}</strong>
      </button>)}
    </div>
    <h2>{selectedEvent?.title}</h2>
    {photosLoading ? <p role="status">Cargando fotografías…</p> : photosError ? <div role="alert"><p>No hemos podido abrir las fotografías de este evento.</p><button className="outline-btn" onClick={reload}>VOLVER A INTENTAR</button></div> : !photoItems.length ? <section className="private-gallery-waiting" aria-labelledby="gallery-waiting-title">
      <DanzFlower className="gallery-waiting-flower" />
      <div>
        <span className="gallery-waiting-label">DESPUÉS DE LA NOCHE</span>
        <h3 id="gallery-waiting-title">Los recuerdos vienen de camino.</h3>
        <p>Todavía no hay fotografías publicadas para este evento.</p>
        <p>Cuando publiquemos la galería, podrás ver y descargar tus fotos aquí.</p>
        <div className="gallery-waiting-actions"><button className="primary-btn" onClick={reload}>ACTUALIZAR FOTOS</button><a className="outline-btn external-btn" href="/?seccion=pasaporte">VER MI PASAPORTE</a></div>
      </div>
    </section> : <div className="private-gallery-grid">
      {photoItems.map((photo, index) => <button type="button" key={photo.id} onClick={() => setViewer({ owner: userId, eventId, photoId: photo.id })} aria-label={`Abrir foto privada ${index + 1}`}>
        <img src={photo.url} referrerPolicy="no-referrer" alt={`Fotografía ${index + 1} de ${selectedEvent?.title}`} loading="lazy" />
      </button>)}
    </div>}
    {!photosLoading && !photosError && photoItems.length === pageSize && <button className="outline-btn" onClick={() => setPageSize(n => n + 60)}>CARGAR MÁS FOTOS</button>}
    {shownPhoto && <div className="private-gallery-viewer" ref={viewerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Foto privada de ${selectedEvent?.title}`}>
      <div className="private-gallery-viewer-heading"><div><strong>{selectedEvent?.title}</strong><span className="private-photo-position" role="status">Foto {photoIndex + 1} de {photoItems.length}{photoItems.length === pageSize ? ' cargadas' : ''}</span></div><button className="outline-btn" onClick={() => setViewer(null)} aria-label="Cerrar foto privada">CERRAR ✕</button></div>
      <div className={`private-gallery-viewer-stage${ownZoom ? ' is-zoomed' : ''}`} ref={stageRef} onPointerDown={startPhotoGesture} onPointerMove={panPhoto} onPointerUp={endPhotoGesture} onPointerCancel={event => { activePointers.current.delete(event.pointerId); gesture.current = null; lastTap.current = null }} onDoubleClick={() => { if (lastPointerType.current !== 'touch') toggleZoom() }}>
        <img draggable={false} style={{ transform: ownZoom ? `translate(${ownZoom.x}px, ${ownZoom.y}px) scale(2)` : undefined }} src={fullPhoto?.owner === userId && fullPhoto.eventId === eventId && fullPhoto.id === shownPhoto.id ? fullPhoto.url : shownPhoto.url} referrerPolicy="no-referrer" alt={`Fotografía de ${selectedEvent?.title}`} />
      </div>
      <p className="private-viewer-hint">{ownZoom ? 'Arrastra para recorrer la foto · Doble toque para ajustar.' : 'Desliza para pasar de foto · Doble toque para ampliar.'}</p>
      <div className="private-gallery-viewer-actions">
        {photoItems.length > 1 && <button className="outline-btn" aria-label="Anterior foto privada" onClick={() => movePhoto(-1)}>←</button>}
        <button className="outline-btn" aria-label={ownZoom ? 'Restablecer tamaño de foto privada' : 'Ampliar foto privada'} aria-pressed={Boolean(ownZoom)} onClick={toggleZoom}>{ownZoom ? 'AJUSTAR −' : 'AMPLIAR +'}</button>
        {photoItems.length > 1 && <button className="outline-btn" aria-label="Siguiente foto privada" onClick={() => movePhoto(1)}>→</button>}
      </div>
      <OriginalFileActions key={`${userId}:${eventId}:${shownPhoto.id}`} client={client} owner={userId} eventId={eventId} photoId={shownPhoto.id} path={shownPhoto.path} name={shownPhoto.name} mime={shownPhoto.mime} bytes={shownPhoto.bytes} sha256={shownPhoto.sha256} />
    </div>}
  </div>
}
