import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminPhoto, Database } from '../types/database'
import { BATCH_LIMIT, mb, PHOTO_BUCKET, photoBatchMustPause, photoError, photoFileError, photoRequestError, uploadPhoto } from './photoBatch'
import { verifiedSignedUrl } from '../cloud/PrivateGallery'
import AlbumPhotoViewer from './AlbumPhotoViewer'
import './GalleryAdmin.css'

type Item = { file: File; status: 'pending' | 'active' | 'done' | 'existing' | 'error'; error?: string }
type Photo = AdminPhoto & { url?: string }
type Usage = { used_bytes: number; limit_bytes: number; photo_count: number }
export default function GalleryAdmin({ client, userId, eventId, eventTitle }: { client: SupabaseClient<Database>; userId: string; eventId: string; eventTitle: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [watermarked, setWatermarked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [confirm, setConfirm] = useState<'published' | 'draft' | null>(null)
  const [managePublished, setManagePublished] = useState(false)
  const publishedAlbum = useRef<HTMLElement>(null)
  const draftArea = useRef<HTMLElement>(null)
  const [viewer, setViewer] = useState<string | null>(null)
  const alive = useRef(true)
  const stopped = useRef(false)
  const running = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => { alive.current = true; return () => { alive.current = false; stopped.current = true } }, [])

  useEffect(() => {
    let current = true
    let refreshing = false
    let refreshTimer: ReturnType<typeof setTimeout>
    let expiryTimer: ReturnType<typeof setTimeout>
    const abort = new AbortController()
    setLoading(true); setPhotos([]); setSelected([]); setConfirm(null)
    async function refresh() {
      if (refreshing || !current) return
      refreshing = true
      try {
        const [list, space] = await Promise.all([
          client.rpc('danz_admin_photos', { p_event_id: eventId, p_offset: offset }).abortSignal(abort.signal),
          client.rpc('danz_gallery_usage').abortSignal(abort.signal),
        ])
        if (list.error || space.error) throw photoRequestError(list.error ?? space.error, list.error ? list.status : space.status)
        if (!current) return
        const rows = list.data ?? []
        setUsage(space.data?.[0] ?? null)
        const paths = rows.filter(p => p.upload_ready).map(p => p.preview_path ?? p.storage_path)
        const signedAt = Date.now()
        const signed = paths.length ? await client.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60) : null
        if (!current) return
        const urls = new Map(signed?.data?.filter(p => !p.error).map(p => [p.path, p.signedUrl]))
        setPhotos(rows.map(p => ({ ...p, url: verifiedSignedUrl(client, urls.get(p.preview_path ?? p.storage_path) ?? null) ?? undefined })))
        setSelected(ids => ids.filter(id => rows.some(row => row.id === id && row.upload_ready)))
        clearTimeout(expiryTimer)
        expiryTimer = setTimeout(() => { if (current) setPhotos(rows => rows.map(p => ({ ...p, url: undefined }))) }, Math.max(0, signedAt + 60_000 - Date.now()))
        if (signed?.error) setError('No se pudieron abrir las vistas previas. Actualiza la galería.')
      } catch (reason) { if (current) setError(photoError(reason)) }
      finally { refreshing = false; if (current) { setLoading(false); refreshTimer = setTimeout(() => { void refresh() }, 45_000) } }
    }
    const focus = () => { clearTimeout(refreshTimer); void refresh() }
    void refresh()
    window.addEventListener('focus', focus)
    return () => { current = false; abort.abort(); clearTimeout(refreshTimer); clearTimeout(expiryTimer); window.removeEventListener('focus', focus) }
  }, [client, eventId, offset, revision])

  const update = (index: number, value: Partial<Item>) => setItems(rows => rows.map((item, i) => i === index ? { ...item, ...value } : item))
  async function start() {
    if (running.current || !watermarked || !items.length || !usage) return
    running.current = true; stopped.current = false; setBusy(true); setPaused(false); setError(''); setMessage('')
    try {
      for (let i = 0; i < items.length; i++) {
        if (!alive.current || stopped.current) break
        if (items[i].status === 'done' || items[i].status === 'existing') continue
        update(i, { status: 'active', error: undefined })
        try {
          const result = await uploadPhoto(client, eventId, items[i].file, () => alive.current && !stopped.current)
          if (alive.current) update(i, { status: result === 'existing' ? 'existing' : 'done' })
        } catch (reason) {
          if (!alive.current) break
          update(i, { status: stopped.current ? 'pending' : 'error', error: stopped.current ? undefined : photoError(reason) })
          if (photoBatchMustPause(reason)) { stopped.current = true; setError(photoError(reason)); break }
        }
      }
    } finally {
      running.current = false
      if (alive.current) { setBusy(false); setPaused(stopped.current); setRevision(n => n + 1); setMessage('Las fotos completadas están guardadas como borradores. Revisa la galería antes de publicarlas.') }
    }
  }

  async function changeState() {
    const ids = selected.filter(id => photos.some(photo => photo.id === id && photo.upload_ready && photo.status === (confirm === 'published' ? 'draft' : 'published')))
    if (!confirm || running.current || !ids.length) return
    running.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const result = await client.rpc('danz_photo_state', { p_event_id: eventId, p_ids: ids, p_status: confirm })
      if (result.error) throw photoRequestError(result.error, result.status)
      if (alive.current) { setMessage(`${result.data} fotos ${confirm === 'published' ? 'publicadas' : 'guardadas en borrador'}.`); setRevision(n => n + 1) }
    } catch (reason) { if (alive.current) setError(photoError(reason)) }
    finally { running.current = false; if (alive.current) { setBusy(false); setConfirm(null) } }
  }
  const completed = items.filter(p => p.status === 'done' || p.status === 'existing').length
  const failed = items.filter(p => p.status === 'error')
  const bytes = items.reduce((sum, p) => sum + p.file.size, 0)
  const ready = photos.filter(p => p.upload_ready)
  const published = ready.filter(p => p.status === 'published')
  const drafts = photos.filter(p => p.status === 'draft')
  const draftReady = drafts.filter(p => p.upload_ready)
  const draftSelection = draftReady.filter(p => selected.includes(p.id)).map(p => p.id)
  const publishedSelection = published.filter(p => selected.includes(p.id)).map(p => p.id)
  const confirmCount = confirm === 'published' ? draftSelection.length : publishedSelection.length
  const viewerPhotos = ready.filter(p => p.status === ready.find(photo => photo.id === viewer)?.status)
  return <section className="account-card gallery-admin" aria-labelledby="gallery-admin-title">
    <h2 id="gallery-admin-title">Fotos del evento</h2>
    <p className="gallery-saved-note">Tus fotos quedan guardadas en este álbum, aunque vuelvas atrás, cambies de página o añadas otra tanda.</p>
    {error && <p className="account-error" role="alert">{error}</p>}
    {message && <p className="account-success" role="status">{message}</p>}
    <div className="admin-actions gallery-album-tools"><button className="outline-btn" disabled={busy || loading} onClick={() => { setError(''); setRevision(n => n + 1) }}>ACTUALIZAR FOTOS</button><button className="primary-btn" disabled={busy} onClick={() => fileInput.current?.click()}>AÑADIR MÁS FOTOS</button></div>
    {loading && <p role="status">Cargando fotos del evento…</p>}
    <section ref={publishedAlbum} className="gallery-published-album" aria-label="Álbum publicado">
      <div className="gallery-published-heading"><div><span className="gallery-published-label">ÁLBUM PUBLICADO</span><h3>{eventTitle}</h3><p>{published.length ? `${published.length} fotos publicadas en esta página. Toca una foto para ampliarla o descargar el original.` : loading ? 'Preparando el álbum…' : 'Todavía no hay fotos publicadas en esta página. Revisa los borradores para publicar tu primera tanda.'}</p></div><span className="gallery-published-count" aria-hidden="true">{published.length.toString().padStart(2, '0')}</span></div>
      {!!published.length && <>
        <div className="gallery-published-grid">{published.map(photo => <article key={photo.id}>
          <button className="gallery-photo-open" aria-label={`Abrir foto ${photo.original_name ?? 'del álbum'}`} onClick={() => setViewer(photo.id)}>{photo.url ? <img src={photo.url} loading="lazy" referrerPolicy="no-referrer" alt={`Vista previa de ${photo.original_name ?? 'foto'}`} /> : <span className="gallery-placeholder">ABRIR FOTO</span>}<span>VER FOTO Y DESCARGAR ↗</span></button>
          {managePublished && <label className="gallery-check"><input type="checkbox" disabled={busy} checked={selected.includes(photo.id)} onChange={e => setSelected(rows => e.target.checked ? [...rows, photo.id] : rows.filter(id => id !== photo.id))} /><span>{photo.original_name ?? 'Foto publicada'}</span></label>}
        </article>)}</div>
        <button className="original-file-help" aria-expanded={managePublished} onClick={() => { setManagePublished(value => !value); setSelected([]); setConfirm(null) }}>{managePublished ? 'CERRAR GESTIÓN DE PUBLICADAS' : 'GESTIONAR PUBLICADAS'}</button>
        {managePublished && <div className="admin-actions"><button className="outline-btn" disabled={busy || !publishedSelection.length} onClick={() => setConfirm('draft')}>VOLVER A BORRADOR ({publishedSelection.length})</button></div>}
      </>}
    </section>
    <div className="gallery-section-shortcuts" role="group" aria-label="Secciones del álbum"><button className="outline-btn" onClick={() => publishedAlbum.current?.scrollIntoView({ block: 'start' })}>PUBLICADAS</button><button className="outline-btn" onClick={() => draftArea.current?.scrollIntoView({ block: 'start' })}>BORRADORES</button></div>
    <section ref={draftArea} className="gallery-draft-section" aria-label="Borradores del álbum">
      <div className="admin-heading"><h3>Borradores <span>({drafts.length})</span></h3><span className="gallery-draft-label">SOLO ADMINISTRACIÓN</span></div>
      <p className="gallery-saved-note">Estas fotos están guardadas. Selecciona las que quieras añadir al álbum publicado.</p>
      {!loading && !drafts.length && <p className="gallery-page-summary">No hay borradores en esta página.</p>}
      {!!drafts.length && <>
        <label className="gallery-check"><input type="checkbox" disabled={busy || !draftReady.length} checked={!!draftReady.length && draftReady.every(p => selected.includes(p.id))} onChange={e => setSelected(rows => e.target.checked ? [...new Set([...rows, ...draftReady.map(p => p.id)])] : rows.filter(id => !draftReady.some(p => p.id === id)))} />Seleccionar las fotos listas de esta página</label>
        <div className="gallery-review">{drafts.map(photo => <article key={photo.id}>
          <button className="gallery-photo-open" disabled={!photo.upload_ready} aria-label={`Abrir foto ${photo.original_name ?? 'del álbum'}`} onClick={() => setViewer(photo.id)}>{photo.url ? <img src={photo.url} loading="lazy" referrerPolicy="no-referrer" alt={`Vista previa de ${photo.original_name ?? 'foto'}`} /> : <span className="gallery-placeholder">{photo.upload_ready ? 'ABRIR FOTO' : 'Carga pendiente'}</span>}<span>REVISAR FOTO ↗</span></button>
          <label className="gallery-check"><input type="checkbox" disabled={busy || !photo.upload_ready} checked={selected.includes(photo.id)} onChange={e => setSelected(rows => e.target.checked ? [...rows, photo.id] : rows.filter(id => id !== photo.id))} /><span>{photo.original_name ?? 'Foto'}<small>{photo.upload_ready ? 'Borrador guardado' : 'Carga pendiente'}</small></span></label>
        </article>)}</div>
        <div className="admin-actions"><button className="primary-btn" disabled={busy || !draftSelection.length} onClick={() => setConfirm('published')}>PUBLICAR SELECCIONADAS ({draftSelection.length})</button></div>
      </>}
      {!!photos.filter(photo => photo.status === 'quarantined').length && <p className="account-note">Hay {photos.filter(photo => photo.status === 'quarantined').length} fotos ocultas para revisión en esta página.</p>}
    </section>
    {confirm && <div className="admin-confirm" role="dialog" aria-label="Confirmar fotos"><h3>{confirm === 'published' ? `¿Publicar ${confirmCount} fotos?` : `¿Guardar ${confirmCount} fotos en borrador?`}</h3><p>{confirm === 'published' ? 'Podrán verlas los asistentes con acceso cuando el evento esté publicado.' : 'Dejarán de aparecer en la galería de los asistentes.'}</p><div className="admin-actions"><button className="primary-btn" disabled={busy} onClick={() => { void changeState() }}>CONFIRMAR FOTOS</button><button className="outline-btn" disabled={busy} onClick={() => setConfirm(null)}>CANCELAR</button></div></div>}
    <div className="admin-actions gallery-pages"><button className="outline-btn" disabled={busy || loading || offset === 0} onClick={() => { setViewer(null); setOffset(n => Math.max(0, n - 60)) }}>PÁGINA ANTERIOR</button><span>Página {offset / 60 + 1}</span><button className="outline-btn" disabled={busy || loading || photos.length < 60} onClick={() => { setViewer(null); setOffset(n => n + 60) }}>SIGUIENTE PÁGINA</button></div>
    {viewer && ready.some(p => p.id === viewer) && <AlbumPhotoViewer client={client} userId={userId} eventId={eventId} title={eventTitle} photos={viewerPhotos} photoId={viewer} onPhoto={setViewer} onClose={() => setViewer(null)} />}
    <h3 className="gallery-upload-heading">Añadir fotos al álbum</h3>
    <p>Sube otra tanda y revísala antes de publicar. El archivo original se conserva para la descarga.</p>
    {usage && <div className="gallery-space"><strong>{mb(usage.used_bytes)} de {mb(usage.limit_bytes)}</strong><meter min={0} max={usage.limit_bytes} value={usage.used_bytes} aria-label="Espacio de fotos utilizado" /><small>Incluye archivos y reservas de cargas pendientes. Presupuesto inicial de la aplicación.</small></div>}
    <div className="account-form">
      <label htmlFor={`photos-${eventId}`}>Seleccionar fotos para subir</label>
      <input ref={fileInput} id={`photos-${eventId}`} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => {
        setError(''); setMessage(''); const files = Array.from(e.target.files ?? [])
        if (files.length > BATCH_LIMIT) { setError(`Selecciona hasta ${BATCH_LIMIT} fotos por tanda.`); e.target.value = ''; return }
        const invalid = files.map(file => ({ file, error: photoFileError(file) })).find(item => item.error)
        if (invalid) { setError(`${invalid.file.name}: ${invalid.error}`); e.target.value = ''; return }
        setItems(files.map(file => ({ file, status: 'pending' }))); setWatermarked(false)
      }} />
      <label className="gallery-check"><input type="checkbox" checked={watermarked} disabled={busy} onChange={e => setWatermarked(e.target.checked)} />Confirmo que las fotos ya incluyen su marca de agua.</label>
      {!!items.length && <><p>{items.length} fotos · {mb(bytes)} de archivos, más vistas previas.</p>{usage && bytes > usage.limit_bytes - usage.used_bytes && <p className="account-note">El conjunto puede superar el espacio disponible. El servidor comprueba cada foto y conserva las que ya estén guardadas.</p>}<progress max={items.length} value={completed} aria-label="Fotos completadas" /><p role="status">{completed} de {items.length} completadas{busy ? ' · Subiendo…' : paused ? ' · Carga pausada' : ''}{failed.length ? ` · ${failed.length} pendientes de reintento` : ''}</p></>}
      <div className="admin-actions"><button className="primary-btn" disabled={busy || !watermarked || !items.length || !usage || completed === items.length} onClick={() => { void start() }}>{completed || failed.length || paused ? 'CONTINUAR CARGA' : 'SUBIR COMO BORRADORES'}</button>{busy && <button className="outline-btn" onClick={() => { stopped.current = true; setPaused(true) }}>PAUSAR CARGA</button>}</div>
      <small>Hasta 600 fotos por tanda. Mantén esta pantalla abierta mientras se están subiendo. Después puedes salir: los borradores completados permanecen en el álbum. Si interrumpes una carga, vuelve a seleccionar esos archivos para continuar sin duplicarlos.</small>
      {!!failed.length && <ul className="gallery-errors">{items.filter(p => p.status === 'error').slice(0, 8).map((p, i) => <li key={i}>{p.file.name}: {p.error}</li>)}</ul>}
    </div>
  </section>
}
