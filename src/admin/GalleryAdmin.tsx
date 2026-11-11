import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminPhoto, Database } from '../types/database'
import { BATCH_LIMIT, mb, PHOTO_BUCKET, photoBatchMustPause, photoError, photoFileError, uploadPhoto } from './photoBatch'
import { verifiedSignedUrl } from '../cloud/PrivateGallery'
import './GalleryAdmin.css'

type Item = { file: File; status: 'pending' | 'active' | 'done' | 'existing' | 'error'; error?: string }
type Photo = AdminPhoto & { url?: string }
type Usage = { used_bytes: number; limit_bytes: number; photo_count: number }
export default function GalleryAdmin({ client, eventId }: { client: SupabaseClient<Database>; eventId: string }) {
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
  const alive = useRef(true)
  const stopped = useRef(false)
  const running = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => { alive.current = true; return () => { alive.current = false; stopped.current = true } }, [])

  useEffect(() => {
    let current = true
    const abort = new AbortController()
    setLoading(true); setPhotos([]); setSelected([]); setConfirm(null)
    void (async () => {
      try {
        const [list, space] = await Promise.all([
          client.rpc('danz_admin_photos', { p_event_id: eventId, p_offset: offset }).abortSignal(abort.signal),
          client.rpc('danz_gallery_usage').abortSignal(abort.signal),
        ])
        if (list.error || space.error) throw list.error ?? space.error
        if (!current) return
        const rows = list.data ?? []
        setUsage(space.data?.[0] ?? null)
        const paths = rows.filter(p => p.upload_ready).map(p => p.preview_path ?? p.storage_path)
        const signed = paths.length ? await client.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60) : null
        if (!current) return
        const urls = new Map(signed?.data?.filter(p => !p.error).map(p => [p.path, p.signedUrl]))
        setPhotos(rows.map(p => ({ ...p, url: verifiedSignedUrl(client, urls.get(p.preview_path ?? p.storage_path) ?? null) ?? undefined })))
        if (signed?.error) setError('No se pudieron abrir las vistas previas. Actualiza la galería.')
      } catch (reason) { if (current) setError(photoError(reason)) }
      finally { if (current) setLoading(false) }
    })()
    return () => { current = false; abort.abort() }
  }, [client, eventId, offset, revision])

  // Signed previews disappear after their 60-second window. Reload on demand.
  useEffect(() => {
    const timeout = setTimeout(() => setPhotos(rows => rows.map(p => ({ ...p, url: undefined }))), 60_000)
    return () => clearTimeout(timeout)
  }, [revision, offset, loading])

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
    if (!confirm || running.current || !selected.length) return
    running.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const result = await client.rpc('danz_photo_state', { p_event_id: eventId, p_ids: selected, p_status: confirm })
      if (result.error) throw result.error
      if (alive.current) { setMessage(`${result.data} fotos ${confirm === 'published' ? 'publicadas' : 'guardadas en borrador'}.`); setRevision(n => n + 1) }
    } catch (reason) { if (alive.current) setError(photoError(reason)) }
    finally { running.current = false; if (alive.current) { setBusy(false); setConfirm(null) } }
  }
  const completed = items.filter(p => p.status === 'done' || p.status === 'existing').length
  const failed = items.filter(p => p.status === 'error')
  const bytes = items.reduce((sum, p) => sum + p.file.size, 0)
  const ready = photos.filter(p => p.upload_ready)
  return <section className="account-card gallery-admin" aria-labelledby="gallery-admin-title">
    <h2 id="gallery-admin-title">Fotos del evento</h2>
    <p>Sube una tanda, revisa sus borradores y publica las fotos seleccionadas. Las descargas conservan el archivo que subas.</p>
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
      <small>Hasta 600 fotos por tanda. Mantén esta pantalla abierta durante la carga. Si sales, vuelve a seleccionar los mismos archivos: las fotos completadas se reconocerán y los archivos originales se conservarán.</small>
      {!!failed.length && <ul className="gallery-errors">{items.filter(p => p.status === 'error').slice(0, 8).map((p, i) => <li key={i}>{p.file.name}: {p.error}</li>)}</ul>}
    </div>
    {error && <p className="account-error" role="alert">{error}</p>}
    {message && <p className="account-success" role="status">{message}</p>}
    <div className="admin-heading"><h3>Revisión de la galería</h3><button className="outline-btn" disabled={busy || loading} onClick={() => { setError(''); setRevision(n => n + 1) }}>ACTUALIZAR FOTOS</button></div>
    {loading ? <p role="status">Cargando fotos del evento…</p> : !photos.length ? <p>Todavía no hay fotos en esta página.</p> : <>
      <label className="gallery-check"><input type="checkbox" disabled={busy || !ready.length} checked={!!ready.length && selected.length === ready.length} onChange={e => setSelected(e.target.checked ? ready.map(p => p.id) : [])} />Seleccionar las fotos listas de esta página</label>
      <div className="gallery-review">{photos.map(photo => <article key={photo.id}>{photo.url ? <a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} loading="lazy" referrerPolicy="no-referrer" alt={`Vista previa de ${photo.original_name ?? 'foto'}`} /></a> : <div className="gallery-placeholder">{photo.upload_ready ? 'Actualiza para ver la foto' : 'Carga pendiente'}</div>}<label className="gallery-check"><input type="checkbox" disabled={busy || !photo.upload_ready} checked={selected.includes(photo.id)} onChange={e => setSelected(rows => e.target.checked ? [...rows, photo.id] : rows.filter(id => id !== photo.id))} /><span>{photo.original_name ?? 'Foto'}<small>{photo.status === 'published' ? 'Publicada' : photo.status === 'quarantined' ? 'Oculta para revisión' : 'Borrador'}</small></span></label></article>)}</div>
      <div className="admin-actions"><button className="primary-btn" disabled={busy || !selected.length} onClick={() => setConfirm('published')}>PUBLICAR SELECCIONADAS ({selected.length})</button><button className="outline-btn" disabled={busy || !selected.length} onClick={() => setConfirm('draft')}>VOLVER A BORRADOR</button></div>
    </>}
    {confirm && <div className="admin-confirm" role="dialog" aria-label="Confirmar fotos"><h3>{confirm === 'published' ? `¿Publicar ${selected.length} fotos?` : `¿Guardar ${selected.length} fotos en borrador?`}</h3><p>{confirm === 'published' ? 'Podrán verlas los asistentes con acceso cuando el evento esté publicado.' : 'Dejarán de aparecer en la galería de los asistentes.'}</p><div className="admin-actions"><button className="primary-btn" disabled={busy} onClick={() => { void changeState() }}>CONFIRMAR FOTOS</button><button className="outline-btn" disabled={busy} onClick={() => setConfirm(null)}>CANCELAR</button></div></div>}
    <div className="admin-actions gallery-pages"><button className="outline-btn" disabled={busy || loading || offset === 0} onClick={() => setOffset(n => Math.max(0, n - 60))}>PÁGINA ANTERIOR</button><span>Página {offset / 60 + 1}</span><button className="outline-btn" disabled={busy || loading || photos.length < 60} onClick={() => setOffset(n => n + 60)}>SIGUIENTE PÁGINA</button></div>
  </section>
}
