import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import './PrivateGallery.css'

export type PrivateGalleryProps = {
  client: SupabaseClient<Database> | null
  userId: string | null
  authLoading: boolean
  onSignIn: () => void
  initialEventId?: string
}

type Event = Pick<Database['public']['Tables']['danz_events']['Row'], 'id' | 'title' | 'starts_at'>
type Photo = { id: string; path: string; url: string }
type Scope = { client: SupabaseClient<Database> | null; owner: string | null }
type EventState = Scope & { items: Event[]; loading: boolean; error: boolean }
type PhotoState = Scope & { eventId: string; items: Photo[]; loading: boolean; error: boolean; expiresAt: number }
const BUCKET = 'danz-event-photos'
const URL_TTL_SECONDS = 60
const REFRESH_MS = 45_000

function sameAccount(state: Scope, client: SupabaseClient<Database> | null, owner: string | null) {
  return state.client === client && state.owner === owner
}

// The SDK builds URLs from its configured Storage endpoint. This getter performs
// no request; its public URL is used ONLY to check that endpoint, never to load a file.
function verifiedSignedUrl(client: SupabaseClient<Database>, value: string | null): string | null {
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
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [viewer, setViewer] = useState<{ owner: string; eventId: string; photoId: string } | null>(null)
  const [download, setDownload] = useState<{ owner: string; eventId: string; busy: boolean; error: boolean } | null>(null)
  const downloadAbort = useRef<AbortController | null>(null)
  const downloadUrls = useRef(new Set<string>())
  const viewerRef = useRef<HTMLDivElement | null>(null)

  const eventItems = !authLoading && sameAccount(events, client, userId) ? events.items : []
  const selectedEvent = eventItems.find((event) => choice.owner === userId && event.id === choice.id) ?? eventItems[0]
  const eventId = selectedEvent?.id ?? ''
  const accountRef = useRef({ client, userId, authLoading, eventId })
  accountRef.current = { client, userId, authLoading, eventId }
  const photoItems = !authLoading && visible && sameAccount(photos, client, userId) && photos.eventId === eventId && Date.now() < photos.expiresAt ? photos.items : []
  const shownPhoto = viewer?.owner === userId && viewer.eventId === eventId
    ? photoItems.find((photo) => photo.id === viewer.photoId) : undefined

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
          .eq('status', 'published').order('starts_at', { ascending: false, nullsFirst: false }).abortSignal(abort.signal)
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
        const { data, error } = await client!.from('danz_photos').select('id,storage_path')
          .eq('event_id', eventId).eq('status', 'published').order('created_at').abortSignal(abort.signal)
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
            .createSignedUrls(rows.map((row) => row.storage_path), URL_TTL_SECONDS)
          if (!current) return
          if (signingError || !signed) throw signingError
          items = rows.map((row) => {
            const entry = signed.find((item) => item.path === row.storage_path && !item.error)
            const url = verifiedSignedUrl(client!, entry?.signedUrl ?? null)
            if (!url) throw new Error('Unavailable private photo')
            return { id: row.id, path: row.storage_path, url }
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
  }, [client, userId, authLoading, eventId, retry, visible])

  useEffect(() => {
    setViewer(null)
    setDownload(null)
    downloadAbort.current?.abort()
    const urls = downloadUrls.current
    urls.forEach((url) => URL.revokeObjectURL(url))
    urls.clear()
    return () => {
      downloadAbort.current?.abort()
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [client, userId, authLoading, eventId])

  useEffect(() => {
    if (!shownPhoto) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewer(null)
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const index = photoItems.findIndex((photo) => photo.id === shownPhoto.id)
        const step = event.key === 'ArrowRight' ? 1 : -1
        const next = photoItems[(index + step + photoItems.length) % photoItems.length]
        if (next && userId) setViewer({ owner: userId, eventId, photoId: next.id })
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
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
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

  async function downloadPhoto(photo: Photo) {
    if (!userId || !client || authLoading || !verifiedSignedUrl(client, photo.url)) return
    const owner = userId
    const activeClient = client
    const current = () => accountRef.current.client === activeClient && accountRef.current.userId === owner && accountRef.current.eventId === eventId && !accountRef.current.authLoading
    downloadAbort.current?.abort()
    const abort = new AbortController()
    downloadAbort.current = abort
    setDownload({ owner, eventId, busy: true, error: false })
    try {
      const response = await fetch(photo.url, { cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: abort.signal })
      if (!response.ok) throw new Error('Download unavailable')
      const blob = await response.blob()
      if (abort.signal.aborted || !current()) return
      if (!blob.type.startsWith('image/') || !blob.size) throw new Error('Invalid image')
      const url = URL.createObjectURL(blob)
      downloadUrls.current.add(url)
      const link = document.createElement('a')
      link.href = url
      link.download = photo.path.split('/').pop()?.replace(/[^\p{L}\p{N}._ -]/gu, '_') || 'danz-foto'
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.current.delete(url) }, 1000)
      setDownload({ owner, eventId, busy: false, error: false })
    } catch {
      if (!abort.signal.aborted && current()) setDownload({ owner, eventId, busy: false, error: true })
    }
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
  const ownDownload = download?.owner === userId && download.eventId === eventId ? download : null
  return <div className="content private-gallery">
    <div className="private-gallery-events" aria-label="Eventos con acceso a fotos">
      {eventItems.map((event) => <button key={event.id} type="button" aria-pressed={event.id === eventId} onClick={() => { setViewer(null); setChoice({ owner: userId, id: event.id }) }}>
        <span>{eventDate(event.starts_at)}</span><strong>{event.title}</strong>
      </button>)}
    </div>
    <h2>{selectedEvent?.title}</h2>
    {photosLoading ? <p role="status">Cargando fotografías…</p> : photosError ? <div role="alert"><p>No hemos podido abrir las fotografías de este evento.</p><button className="outline-btn" onClick={reload}>VOLVER A INTENTAR</button></div> : !photoItems.length ? <p>Todavía no hay fotografías publicadas para este evento.</p> : <div className="private-gallery-grid">
      {photoItems.map((photo, index) => <button type="button" key={photo.id} onClick={() => setViewer({ owner: userId, eventId, photoId: photo.id })} aria-label={`Abrir foto privada ${index + 1}`}>
        <img src={photo.url} referrerPolicy="no-referrer" alt={`Fotografía ${index + 1} de ${selectedEvent?.title}`} loading="lazy" />
      </button>)}
    </div>}
    {shownPhoto && <div className="private-gallery-viewer" ref={viewerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Foto privada de ${selectedEvent?.title}`}>
      <div className="private-gallery-viewer-heading"><strong>{selectedEvent?.title}</strong><button className="outline-btn" onClick={() => setViewer(null)} aria-label="Cerrar foto privada">CERRAR ✕</button></div>
      <img src={shownPhoto.url} referrerPolicy="no-referrer" alt={`Fotografía de ${selectedEvent?.title}`} />
      <div className="private-gallery-viewer-actions">
        {photoItems.length > 1 && <button className="outline-btn" aria-label="Anterior foto privada" onClick={() => {
          const index = photoItems.findIndex((photo) => photo.id === shownPhoto.id)
          setViewer({ owner: userId, eventId, photoId: photoItems[(index + photoItems.length - 1) % photoItems.length].id })
        }}>←</button>}
        <button className="primary-btn" disabled={ownDownload?.busy} onClick={() => { void downloadPhoto(shownPhoto) }}>{ownDownload?.busy ? 'DESCARGANDO…' : 'DESCARGAR FOTO'}</button>
        {photoItems.length > 1 && <button className="outline-btn" aria-label="Siguiente foto privada" onClick={() => {
          const index = photoItems.findIndex((photo) => photo.id === shownPhoto.id)
          setViewer({ owner: userId, eventId, photoId: photoItems[(index + 1) % photoItems.length].id })
        }}>→</button>}
      </div>
      {ownDownload?.error && <p role="alert">No se ha podido descargar la foto. Vuelve a intentarlo.</p>}
    </div>}
  </div>
}
