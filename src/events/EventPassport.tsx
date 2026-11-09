import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clearPendingPass, normalizeEventCode, savePendingPass } from './pass'
import './EventPassport.css'

type Stamp = Database['public']['Functions']['danz_my_passport']['Returns'][number]
type Props = {
  client: SupabaseClient<Database> | null
  userId: string | null
  authLoading: boolean
  pendingPass: string | null
  launchIssue: string | null
  onPendingPass: (code: string | null) => void
  onSignIn: () => void
  onGallery: (eventId: string) => void
}

function date(value: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? '' : parsed.toLocaleDateString('es-ES', { dateStyle: 'medium' })
}

export default function EventPassport({ client, userId, authLoading, pendingPass, launchIssue, onPendingPass, onSignIn, onGallery }: Props) {
  const [code, setCode] = useState(pendingPass ?? '')
  const [message, setMessage] = useState<string | null>(launchIssue)
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [passport, setPassport] = useState<{ owner: string | null; items: Stamp[]; loading: boolean; error: boolean }>({ owner: null, items: [], loading: true, error: false })
  const scope = useRef({ client, userId, authLoading })
  scope.current = { client, userId, authLoading }
  const operation = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; operation.current += 1 }
  }, [])
  useEffect(() => { if (pendingPass) setCode(pendingPass) }, [pendingPass])
  useEffect(() => { setMessage(launchIssue) }, [launchIssue])

  useEffect(() => {
    if (!client || !userId || authLoading) return
    const abort = new AbortController()
    let current = true
    setPassport({ owner: userId, items: [], loading: true, error: false })
    void (async () => {
      try {
        const { data, error } = await client.rpc('danz_my_passport').abortSignal(abort.signal)
        if (error) throw error
        if (current) setPassport({ owner: userId, items: data ?? [], loading: false, error: false })
      } catch {
        if (current) setPassport({ owner: userId, items: [], loading: false, error: true })
      }
    })()
    return () => { current = false; abort.abort() }
  }, [client, userId, authLoading, retry])

  const redeem = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || authLoading) return
    const normalized = normalizeEventCode(code)
    if (!normalized) { setMessage('Revisa el código: debe contener entre 12 y 64 letras o números.'); return }
    const saved = savePendingPass(normalized)
    onPendingPass(normalized)
    if (!userId) {
      setMessage(saved ? 'Pase guardado en este móvil. Inicia sesión para añadir el sello a tu cuenta.' : 'Este navegador no permite guardar el pase. Mantén esta página abierta e inicia sesión. Conserva también tu código.')
      return
    }
    if (!client) return
    const current = ++operation.current
    const owner = userId
    const requestClient = client
    const stillCurrent = () => mounted.current && operation.current === current && scope.current.userId === owner && scope.current.client === requestClient && !scope.current.authLoading
    setBusy(true)
    setMessage(null)
    try {
      const { data, error } = await client.rpc('danz_redeem_event_code', { p_code: normalized })
        .abortSignal(AbortSignal.timeout(15_000))
      if (!stillCurrent()) return
      if (error) throw error
      const result = data?.[0]
      if (result?.status === 'granted' || result?.status === 'already_attended') {
        clearPendingPass(normalized)
        onPendingPass(null)
        setCode('')
        setMessage(result.status === 'granted' ? '¡Sello guardado! Ya tienes acceso a la galería de este evento.' : 'Ya tienes este sello. Puedes abrir su galería desde tu pasaporte.')
        setRetry(value => value + 1)
      } else if (result?.status === 'rate_limited') {
        setMessage('Has hecho varios intentos seguidos. Espera diez minutos antes de volver a probar.')
      } else {
        setMessage('Este código no está disponible. Revisa que sea correcto y que siga vigente.')
      }
    } catch {
      if (stillCurrent()) setMessage('No hemos podido confirmar el canje. Comprueba la conexión y vuelve a intentarlo; el mismo sello no se duplica.')
    } finally { if (stillCurrent()) setBusy(false) }
  }

  const items = !authLoading && passport.owner === userId ? passport.items : []
  return <>
    <div className="eyebrow">DANZ COLLECTIVE / TU PASAPORTE</div>
    <h1 className="page-title passport-title">CADA NOCHE,<br /><em>UN SELLO.</em></h1>
    <p className="page-lead">Escanea el QR del evento con la cámara de tu móvil o introduce su código. Tu sello se guarda en tu cuenta y abre la galería de esa noche.</p>
    <div className="passport-layout">
      <section className="passport-redeem" aria-labelledby="redeem-title">
        <h2 id="redeem-title">Guarda tu noche.</h2>
        <p>{userId ? 'El sello se añadirá a la cuenta con la que has iniciado sesión.' : 'Puedes guardar el pase ahora y añadirlo a tu cuenta después.'}</p>
        <form onSubmit={event => void redeem(event)}>
          <label htmlFor="event-access-code">CÓDIGO DEL EVENTO</label>
          <input id="event-access-code" value={code} onChange={event => setCode(event.target.value)} maxLength={256} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="DANZ-XXXX-XXXX-XXXX" disabled={busy} />
          <button className="primary-btn" type="submit" disabled={busy || authLoading || !code.trim() || Boolean(userId && !client)}>{busy ? 'GUARDANDO…' : userId ? 'GUARDAR MI SELLO' : 'GUARDAR PASE EN ESTE MÓVIL'} <span aria-hidden="true">→</span></button>
        </form>
        {!client && <p role="status">El canje estará disponible cuando se configure la conexión de las cuentas.</p>}
        {authLoading && <p role="status">Comprobando tu sesión…</p>}
        {!userId && !authLoading && client && <button type="button" className="primary-btn" onClick={() => {
          if (code.trim()) {
            const normalized = normalizeEventCode(code)
            if (!normalized) { setMessage('Revisa el código antes de continuar o borra el campo para iniciar sesión.'); return }
            savePendingPass(normalized)
            onPendingPass(normalized)
          }
          onSignIn()
        }}>INICIAR SESIÓN</button>}
        {message && <p className="passport-message" role="status">{message}</p>}
        {pendingPass && !busy && <button type="button" className="outline-btn" onClick={() => { clearPendingPass(pendingPass); onPendingPass(null); setCode(''); setMessage('Pase pendiente descartado. Tus sellos guardados se conservan.') }}>DESCARTAR PASE PENDIENTE</button>}
      </section>
      <section aria-labelledby="passport-title">
        <div className="passport-heading"><h2 id="passport-title">Mis sellos {userId && !passport.loading && !passport.error ? `(${items.length})` : ''}</h2>
          {userId && <button type="button" className="outline-btn" onClick={() => setRetry(value => value + 1)} disabled={authLoading || passport.loading}>ACTUALIZAR SELLOS</button>}
        </div>
        {!userId && <p className="passport-empty">Inicia sesión para ver los sellos que ya has guardado.</p>}
        {userId && (authLoading || passport.loading) && <p role="status">Cargando tu pasaporte…</p>}
        {userId && !authLoading && passport.error && <p className="passport-empty" role="status">No hemos podido cargar tus sellos. Pulsa «Actualizar sellos» para volver a intentarlo.</p>}
        {userId && !authLoading && !passport.loading && !passport.error && items.length === 0 && <p className="passport-empty">Tu primera noche empieza aquí. Añade el código de un evento para estrenar tu pasaporte.</p>}
        <ul className="passport-stamps">{items.map(stamp => <li key={stamp.event_id} className="passport-stamp">
          <span className="passport-flower" aria-hidden="true">✳</span>
          <div><h3>{stamp.title}</h3><p>{date(stamp.starts_at) || 'Evento DANZ'} · Sello del {date(stamp.granted_at)}</p><p>ASISTENCIA GUARDADA</p>
            {stamp.event_status === 'published' ? <button type="button" className="outline-btn" onClick={() => onGallery(stamp.event_id)}>ABRIR GALERÍA ↗</button> : <p>El sello se conserva. La galería no está publicada ahora.</p>}
          </div>
        </li>)}</ul>
      </section>
    </div>
  </>
}
