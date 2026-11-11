import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminCode, AdminEvent, Database } from '../types/database'
import type { AdminAccess } from './access'
import { createCodeMaterial, localDateTime, newId } from './access'
import AdminMfa from './AdminMfa'
import type { AdminMfaSetupCache } from './AdminMfa'
import GalleryAdmin from './GalleryAdmin'
import { suggestedPassExpiry } from '../events/pass'
import './AdminPanel.css'

type Client = SupabaseClient<Database>
type EventForm = { id: string; title: string; start: string; end: string; status: string }
type Candidate = { id: string; code: string; hash: string; eventId: string; expiry: string; maxUses: number | null }
const date = (value: string | null) => value ? new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha'
const statusLabel = (status: string) => ({ draft: 'BORRADOR', published: 'PUBLICADO', archived: 'ARCHIVADO' })[status] ?? status

function savedAlbum(userId: string) {
  const requested = new URLSearchParams(window.location.search).get('album')
  if (requested) return requested
  try { return sessionStorage.getItem(`danz-admin-album-${userId}`) ?? '' } catch { return '' }
}

function Workspace({ client, userId, permissions, albumsOnly }: { client: Client; userId: string; permissions: string[]; albumsOnly: boolean }) {
  const canEvents = permissions.includes('events.manage')
  const canCodes = permissions.includes('codes.manage')
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState(() => savedAlbum(userId))
  const [form, setForm] = useState<EventForm | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [denied, setDenied] = useState(false)
  const [codes, setCodes] = useState<{ event: string; rows: AdminCode[]; loading: boolean; error: boolean }>({ event: '', rows: [], loading: true, error: false })
  const [codeReload, setCodeReload] = useState(0)
  const [expiry, setExpiry] = useState(() => localDateTime(suggestedPassExpiry(null)))
  const [maxUses, setMaxUses] = useState('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [issued, setIssued] = useState<{ eventId: string; code: string; link: string; image: string | null } | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const action = useRef(false)
  const mounted = useRef(true)
  const abortActions = useRef(new Set<AbortController>())
  const event = events.find(item => item.id === selected) ?? events[0]
  const eventId = event?.id ?? ''

  useEffect(() => {
    const back = () => setSelected(savedAlbum(userId))
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, [userId])
  useEffect(() => {
    if (!eventId) return
    try { sessionStorage.setItem(`danz-admin-album-${userId}`, eventId) } catch { /* The server still saves photos. */ }
    const url = new URL(window.location.href)
    url.searchParams.set('album', eventId)
    try { window.history.replaceState(window.history.state, '', url) } catch { /* Restricted browser. */ }
  }, [eventId, userId])
  const selectAlbum = (id: string) => {
    if (id !== eventId) {
      const url = new URL(window.location.href); url.searchParams.set('album', id)
      try { window.history.pushState(window.history.state, '', url) } catch { /* Selection still works. */ }
    }
    setSelected(id); setForm(null); setIssued(null); setCandidate(null); setConfirm(null); setError(''); setMessage('')
  }

  useEffect(() => {
    setExpiry(localDateTime(suggestedPassExpiry(event?.ends_at ?? event?.starts_at ?? null)))
    setCandidate(null)
  }, [eventId])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; abortActions.current.forEach(controller => controller.abort()); abortActions.current.clear() }
  }, [])
  const fail = (reason: unknown, text: string) => {
    if (!mounted.current) return
    const error = reason as { code?: string; status?: number }
    if (error?.code === '42501' || error?.status === 401 || error?.status === 403) setDenied(true)
    setError(text)
  }
  useEffect(() => {
    const abort = new AbortController()
    let current = true
    setLoading(true); setError('')
    void (async () => {
      try {
        const { data, error } = await client.rpc('danz_admin_events').abortSignal(abort.signal)
        if (error) throw error
        if (current) setEvents(data ?? [])
      } catch (reason) { if (current) fail(reason, 'No hemos podido cargar los eventos. Vuelve a intentarlo.') }
      finally { if (current) setLoading(false) }
    })()
    return () => { current = false; abort.abort() }
  }, [client, reload])
  useEffect(() => {
    if (!eventId || !canCodes) return
    const abort = new AbortController()
    let current = true
    setCodes({ event: eventId, rows: [], loading: true, error: false })
    void (async () => {
      try {
        const { data, error } = await client.rpc('danz_admin_codes', { p_event_id: eventId }).abortSignal(abort.signal)
        if (error) throw error
        if (current) setCodes({ event: eventId, rows: data ?? [], loading: false, error: false })
      } catch (reason) { if (current) { fail(reason, 'No se pudieron cargar los códigos de este evento.'); setCodes({ event: eventId, rows: [], loading: false, error: true }) } }
    })()
    return () => { current = false; abort.abort() }
  }, [client, eventId, canCodes, codeReload])

  const run = async (operation: (signal: AbortSignal) => Promise<void>) => {
    if (action.current) return
    action.current = true; setBusy(true); setError(''); setMessage('')
    const abort = new AbortController()
    abortActions.current.add(abort)
    const timer = window.setTimeout(() => abort.abort(), 20_000)
    try { await operation(abort.signal) }
    finally { clearTimeout(timer); abortActions.current.delete(abort); action.current = false; if (mounted.current) setBusy(false) }
  }
  const saveEvent = (submit: FormEvent) => {
    submit.preventDefault()
    if (!form || !canEvents) return
    const draft = form
    void run(async signal => {
      try {
        const { data, error } = await client.rpc('danz_admin_save_event', { p_id: draft.id, p_title: draft.title.trim(), p_starts_at: draft.start ? new Date(draft.start).toISOString() : null, p_ends_at: draft.end ? new Date(draft.end).toISOString() : null, p_status: draft.status }).abortSignal(signal)
        if (error || !data?.[0]) throw error
        if (!mounted.current) return
        setSelected(data[0].id); setForm(null); setMessage('Evento guardado.'); setReload(n => n + 1)
      } catch (reason) { fail(reason, 'No se pudo guardar el evento. Revisa los campos y vuelve a intentarlo.') }
    })
  }
  const issue = (submit: FormEvent) => {
    submit.preventDefault()
    if (!event || !canCodes) return
    const target = event.id
    void run(async signal => {
      try {
        const expires = new Date(expiry).toISOString()
        const limit = maxUses.trim() ? Number(maxUses) : null
        if (new Date(expires).valueOf() <= Date.now() || (limit !== null && (!Number.isSafeInteger(limit) || limit < 1))) throw new Error('fields')
        const material = candidate?.eventId === target && candidate.expiry === expires && candidate.maxUses === limit ? candidate : { ...await createCodeMaterial(), eventId: target, expiry: expires, maxUses: limit }
        if (!mounted.current) return
        setCandidate(material)
        const { data, error } = await client.rpc('danz_admin_issue_code', { p_event_id: target, p_id: material.id, p_code_hash: material.hash, p_expires_at: expires, p_max_uses: limit }).abortSignal(signal)
        if (error || !data?.[0] || data[0].revoked_at) throw error
        if (!mounted.current) return
        const link = new URL('/', window.location.origin)
        link.hash = new URLSearchParams({ pase: material.code }).toString()
        // Generate locally: access tokens never go to an external QR service.
        let image: string | null = null
        try { image = await QRCode.toDataURL(link.href, { errorCorrectionLevel: 'M', width: 420, margin: 4 }) } catch { /* The code and link remain usable. */ }
        if (!mounted.current) return
        setIssued({ eventId: target, code: material.code, link: link.href, image }); setCandidate(null); setCodeReload(n => n + 1); setMessage('Código emitido. Guarda ahora su QR o su enlace.')
      } catch (reason) { fail(reason, 'No se pudo confirmar la emisión. Puedes reintentar sin duplicarla. Revisa la lista y la conexión.'); if (mounted.current) setCodeReload(n => n + 1) }
    })
  }
  const revoke = () => {
    if (!confirm) return
    const target = confirm
    void run(async signal => {
      try {
        const { data, error } = await client.rpc('danz_admin_revoke_code', { p_id: target }).abortSignal(signal)
        if (error || !data?.length) throw error
        if (mounted.current) { setConfirm(null); setIssued(null); setCodeReload(n => n + 1); setMessage('Código revocado. Los sellos ya guardados se conservan.') }
      } catch (reason) { fail(reason, 'No se pudo confirmar la revocación. Vuelve a intentarlo.') }
    })
  }

  if (denied) return <div className="admin-state"><h2>Hay que comprobar el acceso.</h2><p>La sesión o tus permisos han cambiado. Recarga para volver a comprobarlos.</p><button className="outline-btn" onClick={() => window.location.reload()}>COMPROBAR ACCESO</button></div>
  return <>
    {error && <p className="account-error" role="alert">{error}</p>}
    {message && <p className="account-success" role="status">{message}</p>}
    <div className="admin-layout">
      <section aria-labelledby="admin-events-title">
        <div className="admin-heading"><h2 id="admin-events-title">{albumsOnly ? 'Álbumes' : 'Eventos y álbumes'}</h2>{canEvents && !albumsOnly && <button className="primary-btn" disabled={busy} onClick={() => { setForm({ id: newId(), title: '', start: '', end: '', status: 'draft' }); setError(''); setMessage('') }}>NUEVO EVENTO</button>}</div>
        <button className="outline-btn" disabled={busy || loading} onClick={() => setReload(n => n + 1)}>ACTUALIZAR EVENTOS</button>
        {loading && <p role="status">Cargando eventos…</p>}
        {!loading && !events.length && <p>No hay eventos creados todavía.</p>}
        <ul className="admin-events">{events.map(item => <li key={item.id}><button disabled={busy} aria-pressed={item.id === eventId} onClick={() => selectAlbum(item.id)}><strong>{item.title}</strong><small>{statusLabel(item.status)} · {date(item.starts_at)}</small><small>ABRIR ÁLBUM · BORRADORES Y PUBLICADAS ↗</small></button></li>)}</ul>
        {events.length === 200 && <p>Se muestran los 200 eventos más recientes.</p>}
      </section>
      <div>
        {form && canEvents ? <section className="account-card"><h2>Datos del evento</h2><form className="account-form admin-form" onSubmit={saveEvent}>
          <label htmlFor="admin-title">Nombre del evento</label><input id="admin-title" required maxLength={120} value={form.title} disabled={busy} onChange={e => setForm({ ...form, title: e.target.value })} />
          <label htmlFor="admin-start">Inicio del evento</label><input id="admin-start" type="datetime-local" required={form.status === 'published'} value={form.start} disabled={busy} onChange={e => setForm({ ...form, start: e.target.value })} />
          <label htmlFor="admin-end">Final (opcional)</label><input id="admin-end" type="datetime-local" min={form.start || undefined} value={form.end} disabled={busy} onChange={e => setForm({ ...form, end: e.target.value })} />
          <p className="account-note">Horas de tu zona: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
          <label htmlFor="admin-status">Visibilidad del evento</label><select id="admin-status" value={form.status} disabled={busy} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select>
          <p className="account-note">Un borrador no admite canjes. Archivar conserva los sellos y las fotos publicadas para sus asistentes, y detiene nuevos canjes.</p>
          <div className="admin-actions"><button className="primary-btn" disabled={busy}>{busy ? 'GUARDANDO…' : 'GUARDAR EVENTO'}</button><button className="outline-btn" type="button" disabled={busy} onClick={() => setForm(null)}>CANCELAR EDICIÓN</button></div>
        </form></section> : event ? <section className="account-card"><h2>{event.title}</h2><p>Evento {statusLabel(event.status).toLowerCase()} · {date(event.starts_at)}</p>{canEvents && !albumsOnly && <button className="outline-btn" disabled={busy} onClick={() => setForm({ id: event.id, title: event.title, start: localDateTime(event.starts_at), end: localDateTime(event.ends_at), status: event.status })}>EDITAR EVENTO</button>}</section> : <div className="admin-state"><h2>Prepara la próxima noche.</h2><p>Crea el evento, publícalo y emite el pase que compartirás mediante QR.</p></div>}
        {event && canEvents && <GalleryAdmin key={event.id} client={client} userId={userId} eventId={event.id} eventTitle={event.title} />}
        {event && canCodes && !albumsOnly && <section className="account-card"><h2>Códigos y QR</h2>
          {event.status === 'archived' ? <p>Este evento está archivado. Puedes revisar o revocar sus códigos.</p> : <form className="account-form admin-form" onSubmit={issue}>
            <label htmlFor="admin-expiry">El código caduca el</label><input id="admin-expiry" type="datetime-local" required value={expiry} disabled={busy} onChange={e => { setExpiry(e.target.value); setCandidate(null) }} />
            <p className="account-note">Es la fecha límite para añadir el sello a una cuenta. Dejamos 14 días después de la fiesta como propuesta; puedes cambiarla. Mantén el evento publicado durante ese plazo.</p>
            <label htmlFor="admin-uses">Máximo de asistentes (opcional)</label><input id="admin-uses" type="number" min={1} max={2147483647} step={1} placeholder="Sin límite" value={maxUses} disabled={busy} onChange={e => { setMaxUses(e.target.value); setCandidate(null) }} />
            <p className="account-note">El pase no podrá canjearse hasta que publiques el evento.</p>
            <button className="primary-btn" disabled={busy}>{busy ? 'EMITIENDO…' : candidate ? 'REINTENTAR EMISIÓN' : 'EMITIR CÓDIGO Y QR'}</button>
          </form>}
          {issued?.eventId === eventId && <div className="admin-issued"><h3>Tu pase de acceso</h3><code className="admin-secret">{issued.code}</code><label htmlFor="admin-pass-link">Enlace del pase</label><input id="admin-pass-link" readOnly value={issued.link} onFocus={e => e.currentTarget.select()} />
            {issued.image && <><img src={issued.image} width={280} height={280} alt={`QR de acceso a ${event.title}`} /><a className="primary-btn external-btn" download={`danz-pase-${event.id}.png`} href={issued.image}>DESCARGAR QR</a></>}
            <p>Guarda el QR o copia el enlace ahora. Esta pantalla no conserva el código después de salir. Si lo pierdes, revócalo y emite otro.</p>
          </div>}
          <div className="admin-heading"><h3>Códigos emitidos</h3><button className="outline-btn" disabled={busy} onClick={() => setCodeReload(n => n + 1)}>ACTUALIZAR CÓDIGOS</button></div>
          {codes.event === eventId && codes.loading && <p role="status">Cargando códigos…</p>}
          {codes.event === eventId && codes.error && <p>No se pudo cargar la lista. Usa «Actualizar códigos».</p>}
          {codes.event === eventId && !codes.loading && !codes.error && !codes.rows.length && <p>Este evento todavía no tiene códigos.</p>}
          <ul className="admin-codes">{(codes.event === eventId ? codes.rows : []).map(item => <li className="admin-code" key={item.id}><p><strong>{item.revoked_at ? 'REVOCADO' : item.expires_at && Date.parse(item.expires_at) <= Date.now() ? 'CADUCADO' : item.max_uses !== null && item.used_count >= item.max_uses ? 'AGOTADO' : 'ACTIVO'}</strong> · Creado {date(item.created_at)}</p><p>{item.used_count} usos{item.max_uses === null ? ' · Sin límite' : ` de ${item.max_uses}`} · Caduca {date(item.expires_at)}</p>{!item.revoked_at && <button className="outline-btn" disabled={busy} onClick={() => setConfirm(item.id)}>REVOCAR CÓDIGO</button>}</li>)}</ul>
          {codes.rows.length === 100 && <p>Se muestran los 100 códigos más recientes de este evento.</p>}
          {confirm && <div className="admin-confirm" role="dialog" aria-label="Confirmar revocación"><h3>¿Revocar este código?</h3><p>Dejará de admitir nuevos canjes. Los sellos ya guardados se conservan.</p><div className="admin-actions"><button className="primary-btn" disabled={busy} onClick={revoke}>CONFIRMAR REVOCACIÓN</button><button className="outline-btn" disabled={busy} onClick={() => setConfirm(null)}>CANCELAR</button></div></div>}
        </section>}
      </div>
    </div>
  </>
}

export default function AdminPanel({ client, userId, authLoading, access, setup, onSignIn, albumsOnly = false }: { client: Client | null; userId: string | null; authLoading: boolean; access: AdminAccess; setup: AdminMfaSetupCache; onSignIn: () => void; albumsOnly?: boolean }) {
  const [verified, setVerified] = useState(false)
  const onVerified = useCallback(() => setVerified(true), [])
  return <div className="admin-page"><div className="eyebrow">DANZ COLLECTIVE / {albumsOnly ? 'TUS FOTOS' : 'ADMINISTRACIÓN'}</div>{albumsOnly ? <><h1 className="page-title">MIS<br /><em>ÁLBUMES.</em></h1><p>Borradores y fotos publicadas, guardados por evento. Abre un álbum para ver, descargar o añadir fotos.</p></> : <h1 className="page-title">DETRÁS<br /><em>DE LA NOCHE.</em></h1>}
    {!client ? <p>La conexión de las cuentas todavía no está disponible.</p> : authLoading || access.loading ? <p role="status">Comprobando acceso de administración…</p> : !userId ? <div className="admin-state"><p>Inicia sesión con tu cuenta de administración.</p><button className="primary-btn" onClick={onSignIn}>INICIAR SESIÓN</button></div> : access.error ? <p className="account-error" role="alert">No hemos podido comprobar los permisos. Recarga para volver a intentarlo.</p> : !access.member || !access.permissions.length ? <p>Esta cuenta no tiene permisos de administración.</p> : !verified ? <AdminMfa client={client} userId={userId} setup={setup} onVerified={onVerified} /> : <Workspace client={client} userId={userId} permissions={access.permissions} albumsOnly={albumsOnly} />}
  </div>
}
