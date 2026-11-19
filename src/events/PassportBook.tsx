import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import DanzFlower from '../content/DanzFlower'
import { useIdentity } from '../auth/useIdentity'
import { verifiedSignedPhotoUrl } from '../cloud/verifiedSignedPhotoUrl'
import { readWithDeadline } from '../cloud/readWithDeadline'
import { haptic } from '../ui/haptics'
import { PASSPORT_COVER_CHANGED, readPassportCover, selectPassportCover } from './passportCover'
import './PassportBook.css'

type Stamp = Database['public']['Functions']['danz_my_passport']['Returns'][number]
type Profile = { owner: string; name: string | null }
type Props = {
  client: SupabaseClient<Database> | null
  userId: string | null
  registeredAt: string | null
  authLoading: boolean
  stamps: Stamp[]
  ready: boolean
  loading: boolean
  failed: boolean
  celebrating: string
  onSignIn: () => void
  onGallery: (id: string) => void
  onRefresh: () => void
  immersive?: boolean
}
const BUCKET = 'danz-event-photos'
const PHOTO_SECONDS = 60
const friendlyDate = (date: string | null) => {
  if (!date) return 'FECHA POR CONFIRMAR'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'FECHA POR CONFIRMAR' : parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}
const inks = ['ink-black', 'ink-violet', 'ink-orange', 'ink-blue', 'ink-olive']

export default function PassportBook({ client, userId, registeredAt, authLoading, stamps, ready, loading, failed, celebrating, onSignIn, onGallery, onRefresh, immersive = false }: Props) {
  // Closed cover, member identity, confirmed trips, and exactly one empty future leaf.
  const pages = 3 + stamps.length // One final blank leaf reserved for the next event; never precreate future events.
  const [page, setPage] = useState(0)
  const identity = useIdentity()
  const [hasOpened, setHasOpened] = useState(() => { try { return sessionStorage.getItem('danz-passport-opened') === '1' } catch { return false } })
  const [turn, setTurn] = useState<'next'|'previous'>('next')
  const [profile, setProfile] = useState<Profile>({ owner: '', name: null })
  const [membership, setMembership] = useState<{ owner: string; number: number | null }>({ owner: '', number: null })
  const [coverChoice, setCoverChoice] = useState(() => userId ? readPassportCover(userId) : null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverError, setCoverError] = useState(false)
  const [localPortrait, setLocalPortrait] = useState<string | null>(null)
  const portraitObject = useRef<string | null>(null)
  const [portraitError, setPortraitError] = useState('')
  useEffect(() => () => { if (portraitObject.current) URL.revokeObjectURL(portraitObject.current) }, [])
  const choosePortrait = (file: File | undefined) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setPortraitError('Elige un JPG, PNG o WebP de hasta 8 MB.')
      return
    }
    if (portraitObject.current) URL.revokeObjectURL(portraitObject.current)
    portraitObject.current = URL.createObjectURL(file)
    setLocalPortrait(portraitObject.current)
    setPortraitError('')
  }
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
    setProfile({ owner: userId, name: null })
    setMembership({ owner: userId, number: null })
    void (async () => {
      try {
        const { data, error } = await readWithDeadline(signal => client.from('danz_membership_numbers')
          .select('member_number').eq('user_id', userId).abortSignal(signal).maybeSingle(), controller.signal)
        if (!error && !controller.signal.aborted) setMembership({ owner: userId, number: data?.member_number ?? null })
      } catch { /* Membership display fails closed; never invent a number. */ }
    })()
    void (async () => {
      try {
        const { data, error } = await readWithDeadline(signal => client.from('danz_profiles')
          .select('display_name').eq('user_id', userId).abortSignal(signal).maybeSingle(), controller.signal)
        if (!error && !controller.signal.aborted) setProfile({ owner: userId, name: data?.display_name ?? null })
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
          const verified = verifiedSignedPhotoUrl(client, data?.signedUrl ?? null)
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
    if (bounded > 0 && !hasOpened) { setHasOpened(true); try { sessionStorage.setItem('danz-passport-opened', '1') } catch { /* optional tutorial state */ } }
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
  return <section className={`danz-travel${immersive ? ' danz-travel-immersive' : ''}`} aria-label="Pasaporte DANZ, un viaje por página">
    <div className="danz-travel-top"><span>DANZ / TRAVEL DOCUMENT</span><span>{page === 0 ? 'CUBIERTA' : String(page).padStart(2, '0') + ' / ' + String(pages - 1).padStart(2, '0')}</span></div>
    <div className="danz-travel-window" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { gesture.current = null }} onKeyDown={onKeys} tabIndex={0} aria-label="Desliza horizontalmente o usa las flechas para pasar las páginas">
      <div key={page} className={`danz-travel-leaf ${page === 0 ? 'danz-travel-cover' : 'danz-travel-paper'} danz-turn-${turn}`}>
        {page === 0 && <>
          {coverUrl && <img className="danz-travel-cover-photo" src={coverUrl} alt="Fotografía elegida de tu galería DANZ" referrerPolicy="no-referrer" onError={() => setCoverUrl(null)} />}
          <div className="danz-travel-cover-top"><span>DANZ<br/><small>COLLECTIVE</small></span><span>ED. 001</span></div>
          <DanzFlower className="danz-travel-logo" />
          <h2>PASAPORTE</h2><p className="danz-travel-cover-caption">DOCUMENTO DE IDENTIDAD · DANZ COLLECTIVE</p>
          {!hasOpened && <div className="danz-swipe-tutorial" aria-label="Desliza hacia la izquierda para abrir el pasaporte"><span aria-hidden="true">⟵</span> DESLIZA PARA ABRIR</div>}
          <div className="danz-travel-cover-bottom"><span>MÚSICA / ROPA / EVENTOS / COMUNIDAD</span><span>✳ DANZ MEMBER</span></div>
        </>}
        {page === 1 && <>
          <div className="danz-paper-head"><DanzFlower/><strong>DANZ <small>COLLECTIVE</small></strong><span>DOCUMENTO PERSONAL</span></div>
          <div className="danz-paper-rule"/><div className="danz-paper-kicker">01 / IDENTIDAD</div>
          <h2 className="danz-paper-title">TU VIAJE<br/>EMPIEZA AQUÍ.</h2>
          <div className="danz-member-photo" aria-label="Retrato editorial en blanco y negro">
            {localPortrait ? <img src={localPortrait} alt="Vista previa de tu selfie con tratamiento editorial DANZ" /> : coverUrl ? <img src={coverUrl} referrerPolicy="no-referrer" alt="Imagen de galería elegida para tu Pasaporte" /> : <DanzFlower/>}
          </div>
          <div className="danz-portrait-demo">
            <label htmlFor="danz-passport-selfie">PROBAR MI RETRATO EDITORIAL</label>
            <input id="danz-passport-selfie" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { choosePortrait(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} />
            <p>Filtro editorial sin IA. Tu foto se procesa únicamente en este dispositivo y no se sube ni se guarda.</p>
            {portraitError && <p role="alert">{portraitError}</p>}
            {localPortrait && <button type="button" onClick={() => {
              if (portraitObject.current) URL.revokeObjectURL(portraitObject.current)
              portraitObject.current = null
              setLocalPortrait(null)
            }}>QUITAR PRUEBA</button>}
          </div>
          <dl className="danz-member-fields"><dt>NOMBRE</dt><dd>{name}</dd><dt>Nº DE SOCIO</dt><dd>{userId && membership.owner === userId && membership.number !== null ? String(membership.number).padStart(6, '0') : userId ? 'CONSULTANDO REGISTRO' : 'AL REGISTRARTE'}</dd><dt>ALTA</dt><dd>{userId && profile.owner === userId ? friendlyDate(registeredAt) : 'AL REGISTRARTE'}</dd><dt>VIAJES</dt><dd>{ready ? String(stamps.length).padStart(2, '0') : '—'}</dd></dl>
          {identity.data?.verified && identity.data.handle && /^[A-Za-z0-9_.]{1,30}$/.test(identity.data.handle) && <a className="danz-passport-instagram" href={`https://www.instagram.com/${identity.data.handle}/`} target="_blank" rel="noopener noreferrer">◎ @{identity.data.handle} <span>INSTAGRAM VERIFICADO ↗</span></a>}
          {!userId && <button type="button" className="danz-paper-action" onClick={onSignIn}>INICIAR SESIÓN ↗</button>}
          <div className="danz-paper-foot">DOCUMENTO PERSONAL · DANZ COLLECTIVE</div>
        </>}
        {page === pages - 1 && <><div className="danz-paper-kicker">PRÓXIMO VIAJE / DANZ</div><h2 className="danz-paper-title">LA PRÓXIMA<br/>NOCHE.</h2><div className="danz-paper-empty"><DanzFlower/><p>Esta página está esperando tu próxima fiesta. Cuando consigas un sello, su recuerdo ocupará una nueva hoja.</p></div><div className="danz-paper-foot">TO BE CONTINUED · DANZ COLLECTIVE</div></>}
        {page >= 2 && page < pages - 1 && (() => {
          const stamp = stamps[page - 2]
          if (!stamp) return null
          const galleryPublished = ['published','archived'].includes(stamp.event_status)
          return <>
            <div className="danz-paper-kicker">VIAJE / {String(page - 1).padStart(2, '0')}</div>
            <h2 className="danz-paper-title danz-trip-title">{stamp.title}</h2>
            <div className="danz-trip-photo">{coverUrl && coverChoice?.eventId === stamp.event_id ? <img src={coverUrl} alt="Tu fotografía elegida para este viaje" referrerPolicy="no-referrer" /> : <div className="danz-trip-photo-placeholder"><DanzFlower/><span>TU NOCHE. TU RECUERDO.</span></div>}</div>
            <div className={`danz-trip-ink ${inks[(page - 2) % inks.length]}`}><DanzFlower/><span>ASISTENCIA<br/>CONFIRMADA</span></div>
            <dl className="danz-trip-fields"><dt>EVENTO</dt><dd>{stamp.title}</dd><dt>FECHA</dt><dd>{friendlyDate(stamp.starts_at)}</dd><dt>SELLO GUARDADO</dt><dd>{friendlyDate(stamp.granted_at)}</dd></dl>
            {galleryPublished ? <button type="button" className="danz-paper-action" onClick={() => onGallery(stamp.event_id)}>ABRIR GALERÍA DEL VIAJE ↗</button> : <p className="danz-paper-empty">La galería de este viaje todavía no está publicada.</p>}
            {celebrating === stamp.event_id && <p className="danz-new-stamp" role="status">¡NUEVO SELLO EN TU PASAPORTE!</p>}
            <div className="danz-paper-foot">DANZ COLLECTIVE / {String(page - 2).padStart(2, '0')}</div>
          </>
        })()}
      </div>
    </div>
    {page === 2 + stamps.length && <span className="danz-travel-blank-reader" aria-hidden="true" />}
    {!immersive && <nav className="danz-travel-navigation" aria-label="Pasar páginas del pasaporte">
      <button type="button" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Página anterior">←</button>
      <span>HOJA {page + 1} DE {pages}</span>
      <button type="button" onClick={() => go(page + 1)} disabled={page === pages - 1} aria-label="Página siguiente">→</button>
    </nav>}
    <div className="danz-travel-feedback">{page === 0 ? 'DESLIZA PARA ABRIR TU PASAPORTE' : 'DESLIZA PARA CAMBIAR DE PÁGINA'}</div>
    {userId && coverChoice && <div className="danz-photo-choice-status"><span>{coverError ? 'Tu foto no está disponible ahora; conservamos tu selección.' : coverUrl ? 'Fotografía de tu galería aplicada al Pasaporte.' : 'Foto elegida. Se mostrará cuando esté disponible.'}</span><button type="button" onClick={clearPhoto}>QUITAR FOTO</button></div>}
  </section>
}
