import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import DanzFlower from '../content/DanzFlower'
import { verifiedSignedUrl } from '../cloud/PrivateGallery'
import { readWithDeadline } from '../cloud/readWithDeadline'
import { haptic } from '../ui/haptics'
import { PASSPORT_COVER_CHANGED, readPassportCover, selectPassportCover } from './passportCover'
import './PassportBook.css'

type Stamp = Database['public']['Functions']['danz_my_passport']['Returns'][number]
type Profile = { owner: string; name: string | null; registeredAt: string | null }
type Props = {
  client: SupabaseClient<Database> | null
  userId: string | null
  authLoading: boolean
  stamps: Stamp[]
  ready: boolean
  loading: boolean
  failed: boolean
  celebrating: string
  onSignIn: () => void
  onGallery: (id: string) => void
  onRefresh: () => void
}
const BUCKET = 'danz-event-photos'
const PHOTO_SECONDS = 60
const friendlyDate = (date: string | null) => {
  if (!date) return 'FECHA POR CONFIRMAR'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'FECHA POR CONFIRMAR' : parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}
const inks = ['ink-black', 'ink-violet', 'ink-orange', 'ink-blue', 'ink-olive']

export default function PassportBook({ client, userId, authLoading, stamps, ready, loading, failed, celebrating, onSignIn, onGallery, onRefresh }: Props) {
  // Cover, identity, index, then one authentic trip per redeemed stamp.
  const pages = 3 + stamps.length
  const [page, setPage] = useState(0)
  const [turn, setTurn] = useState<'next'|'previous'>('next')
  const [profile, setProfile] = useState<Profile>({ owner: '', name: null, registeredAt: null })
  const [coverChoice, setCoverChoice] = useState(() => userId ? readPassportCover(userId) : null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverError, setCoverError] = useState(false)
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)

  useEffect(() => {
    setPage(0)
    setCoverChoice(userId ? readPassportCover(userId) : null)
  }, [userId])
  useEffect(() => {
    const update = () => setCoverChoice(userId ? readPassportCover(userId) : null)
    window.addEventListener(PASSPORT_COVER_CHANGED, update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener(PASSPORT_COVER_CHANGED, update); window.removeEventListener('storage', update) }
  }, [userId])
  useEffect(() => {
    if (!client || !userId || authLoading) return
    const controller = new AbortController()
    setProfile({ owner: userId, name: null, registeredAt: null })
    void (async () => {
      try {
        const { data, error } = await readWithDeadline(signal => client.from('danz_profiles')
          .select('display_name,created_at').eq('user_id', userId).abortSignal(signal).maybeSingle(), controller.signal)
        if (!error && !controller.signal.aborted) setProfile({ owner: userId, name: data?.display_name ?? null, registeredAt: data?.created_at ?? null })
      } catch { /* Profile is optional; do not fabricate a name. */ }
    })()
    return () => controller.abort()
  }, [client, userId, authLoading])

  // The choice must still belong to a stamped event and must still be published.
  // RLS plus short-lived signed URLs protect the image; the token is never persisted.
  const allowed = ready && stamps.some(item => item.event_id === coverChoice?.eventId)
  useEffect(() => {
    setCoverUrl(null); setCoverError(false)
    if (!client || !userId || !coverChoice || !allowed) return
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      try {
        const url = await readWithDeadline(async signal => {
          const { data: rows, error } = await client.from('danz_photos')
            .select('preview_path,storage_path').eq('id', coverChoice.photoId)
            .eq('event_id', coverChoice.eventId).eq('status', 'published')
            .abortSignal(signal).maybeSingle()
          if (error || !rows || signal.aborted) throw new Error('Photo is not available')
          const { data, error: signingError } = await client.storage.from(BUCKET).createSignedUrl(rows.preview_path || rows.storage_path, PHOTO_SECONDS)
          if (signingError || signal.aborted) throw new Error('Photo unavailable')
          const verified = verifiedSignedUrl(client, data?.signedUrl ?? null)
          if (!verified) throw new Error('Invalid signed URL')
          return verified
        }, controller.signal)
        if (!controller.signal.aborted) {
          setCoverUrl(url)
          timeout = setTimeout(() => { if (!controller.signal.aborted) { setCoverUrl(null); setCoverError(false) } }, PHOTO_SECONDS * 1000)
        }
      } catch { if (!controller.signal.aborted) setCoverError(true) }
    }
    void load()
    return () => { controller.abort(); clearTimeout(timeout); setCoverUrl(null) }
  }, [client, userId, coverChoice?.eventId, coverChoice?.photoId, allowed])

  const go = (next: number) => {
    const bounded = Math.max(0, Math.min(pages - 1, next))
    if (bounded === page) return
    setTurn(bounded > page ? 'next' : 'previous')
    setPage(bounded)
    haptic('selection')
  }
  useEffect(() => { setPage(value => Math.min(value, pages - 1)) }, [pages])
  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    if (event.target instanceof Element && event.target.closest('button,a,input')) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    gesture.current = null
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.3) go(page + (dx < 0 ? 1 : -1))
  }
  const onKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('button,a,input')) return
    if (event.key === 'ArrowRight') { event.preventDefault(); go(page + 1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(page - 1) }
  }
  const name = userId ? (profile.owner === userId && profile.name?.trim() ? profile.name : 'CONFIGURA TU NOMBRE EN MI CUENTA') : 'TU NOMBRE, TU HISTORIA'
  const clearPhoto = () => { if (userId) selectPassportCover(userId, null) }
  return <section className="danz-travel" aria-label="Pasaporte DANZ, un viaje por página">
    <div className="danz-travel-top"><span>DANZ / TRAVEL DOCUMENT</span><span>{page === 0 ? 'CUBIERTA' : String(page).padStart(2, '0') + ' / ' + String(pages - 1).padStart(2, '0')}</span></div>
    <div className="danz-travel-window" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { gesture.current = null }} onKeyDown={onKeys} tabIndex={0} aria-label="Desliza horizontalmente o usa las flechas para pasar las páginas">
      <div key={page} className={`danz-travel-leaf ${page === 0 ? 'danz-travel-cover' : 'danz-travel-paper'} danz-turn-${turn}`}>
        {page === 0 && <>
          {coverUrl && <img className="danz-travel-cover-photo" src={coverUrl} alt="Fotografía elegida de tu galería DANZ" referrerPolicy="no-referrer" onError={() => setCoverUrl(null)} />}
          <div className="danz-travel-cover-top"><span>DANZ<br/><small>COLLECTIVE</small></span><span>ED. 001</span></div>
          <DanzFlower className="danz-travel-logo" />
          <h2>PASAPORTE</h2><p className="danz-travel-cover-caption">NOCHES QUE SE QUEDAN CONTIGO</p>
          <div className="danz-travel-cover-bottom"><span>MÚSICA / ROPA / EVENTOS / COMUNIDAD</span><span>✳ DANZ MEMBER</span></div>
        </>}
        {page === 1 && <>
          <div className="danz-paper-head"><DanzFlower/><strong>DANZ <small>COLLECTIVE</small></strong><span>DOCUMENTO PERSONAL</span></div>
          <div className="danz-paper-rule"/><div className="danz-paper-kicker">01 / IDENTIDAD</div>
          <h2 className="danz-paper-title">TU VIAJE<br/>EMPIEZA AQUÍ.</h2>
          <div className="danz-member-photo" aria-hidden="true">{coverUrl ? <img src={coverUrl} referrerPolicy="no-referrer" alt="" /> : <DanzFlower/>}</div>
          <dl className="danz-member-fields"><dt>NOMBRE</dt><dd>{name}</dd><dt>Nº DE SOCIO</dt><dd>{userId ? 'PENDIENTE DE ASIGNACIÓN' : 'AL REGISTRARTE'}</dd><dt>ALTA</dt><dd>{userId && profile.owner === userId ? friendlyDate(profile.registeredAt) : 'AL REGISTRARTE'}</dd><dt>VIAJES</dt><dd>{ready ? String(stamps.length).padStart(2, '0') : '—'}</dd></dl>
          {!userId && <button type="button" className="danz-paper-action" onClick={onSignIn}>INICIAR SESIÓN ↗</button>}
          <div className="danz-paper-foot">DOCUMENTO PERSONAL · DANZ COLLECTIVE</div>
        </>}
        {page === 2 && <>
          <div className="danz-paper-kicker">02 / VISADOS</div><h2 className="danz-paper-title">MIS VIAJES.</h2>
          <p className="danz-paper-intro">Cada sello es una noche que forma parte de tu historia.</p>
          {!userId && <div className="danz-paper-empty">Regístrate para guardar tus primeros sellos.<button className="danz-paper-action" onClick={onSignIn}>INICIAR SESIÓN ↗</button></div>}
          {userId && (loading || authLoading) && <p role="status" className="danz-paper-empty">Comprobando tus sellos…</p>}
          {userId && failed && <div className="danz-paper-empty">No hemos podido cargar tus viajes.<button className="danz-paper-action" onClick={onRefresh}>REINTENTAR ↗</button></div>}
          {ready && stamps.length === 0 && <div className="danz-paper-empty"><DanzFlower/>Tu primer viaje todavía está por llegar. Cuando fiches en una fiesta, aparecerá aquí tu sello.</div>}
          <div className="danz-stamp-grid">{stamps.map((stamp, index) => <button type="button" key={stamp.event_id} className={`danz-book-stamp ${inks[index % inks.length]}`} onClick={() => go(index + 3)} aria-label={`Abrir viaje ${stamp.title}`}><DanzFlower/><strong>{stamp.title}</strong><span>{friendlyDate(stamp.starts_at)}</span></button>)}</div>
          <div className="danz-paper-foot">VIAJES GUARDADOS · {ready ? stamps.length : '—'}</div>
        </>}
        {page >= 3 && (() => {
          const stamp = stamps[page - 3]
          if (!stamp) return null
          const galleryPublished = ['published','archived'].includes(stamp.event_status)
          return <>
            <div className="danz-paper-kicker">VIAJE / {String(page - 2).padStart(2, '0')}</div>
            <h2 className="danz-paper-title danz-trip-title">{stamp.title}</h2>
            <div className="danz-trip-photo">{coverUrl && coverChoice?.eventId === stamp.event_id ? <img src={coverUrl} alt="Tu fotografía elegida para este viaje" referrerPolicy="no-referrer" /> : <div className="danz-trip-photo-placeholder"><DanzFlower/><span>TU NOCHE. TU RECUERDO.</span></div>}</div>
            <div className={`danz-trip-ink ${inks[(page - 3) % inks.length]}`}><DanzFlower/><span>ASISTENCIA<br/>CONFIRMADA</span></div>
            <dl className="danz-trip-fields"><dt>EVENTO</dt><dd>{stamp.title}</dd><dt>FECHA</dt><dd>{friendlyDate(stamp.starts_at)}</dd><dt>SELLO GUARDADO</dt><dd>{friendlyDate(stamp.granted_at)}</dd></dl>
            {galleryPublished ? <button type="button" className="danz-paper-action" onClick={() => onGallery(stamp.event_id)}>ABRIR GALERÍA DEL VIAJE ↗</button> : <p className="danz-paper-empty">La galería de este viaje todavía no está publicada.</p>}
            {celebrating === stamp.event_id && <p className="danz-new-stamp" role="status">¡NUEVO SELLO EN TU PASAPORTE!</p>}
            <div className="danz-paper-foot">DANZ COLLECTIVE / {String(page - 2).padStart(2, '0')}</div>
          </>
        })()}
      </div>
    </div>
    <nav className="danz-travel-navigation" aria-label="Pasar páginas del pasaporte">
      <button type="button" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Página anterior">←</button>
      <span>HOJA {page + 1} DE {pages}</span>
      <button type="button" onClick={() => go(page + 1)} disabled={page === pages - 1} aria-label="Página siguiente">→</button>
    </nav>
    <div className="danz-travel-feedback">{page === 0 ? 'DESLIZA PARA ABRIR TU PASAPORTE' : page === 2 ? 'PULSA UN SELLO PARA ABRIR ESE VIAJE' : 'DESLIZA PARA CAMBIAR DE PÁGINA'}</div>
    {userId && coverChoice && <div className="danz-photo-choice-status"><span>{coverError ? 'Tu foto no está disponible ahora; conservamos tu selección.' : coverUrl ? 'Fotografía de tu galería aplicada al Pasaporte.' : 'Foto elegida. Se mostrará cuando esté disponible.'}</span><button type="button" onClick={clearPhoto}>QUITAR FOTO</button></div>}
  </section>
}
