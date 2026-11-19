import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clearPendingPass, normalizeEventCode, readPendingPass, savePendingPass } from './pass'
import type { PassRedemption } from './usePendingPassRedemption'
import PassportBook from './PassportBook'
import PassArrivalGuide from './PassArrivalGuide'
import { readWithDeadline } from '../cloud/readWithDeadline'
import { haptic } from '../ui/haptics'
import FeedbackSettings from '../ui/FeedbackSettings'
import './EventPassport.css'

type Stamp = Database['public']['Functions']['danz_my_passport']['Returns'][number]
type Props = {
  arrival: boolean
  client: SupabaseClient<Database> | null
  userId: string | null
  registeredAt: string | null
  authLoading: boolean
  pendingPass: string | null
  pendingCount: number
  redemption: PassRedemption
  launchIssue: string | null
  onPendingPass: (code: string | null) => void
  onSignIn: () => void
  onContinue: () => void
  onGallery: (eventId: string) => void
}

export default function EventPassport({ arrival, client, userId, registeredAt, authLoading, pendingPass, pendingCount, redemption, launchIssue, onPendingPass, onSignIn, onContinue, onGallery }: Props) {
  const [code, setCode] = useState(pendingPass ?? '')
  const [message, setMessage] = useState<string | null>(launchIssue)
  const busy = redemption.busy
  const [backup, setBackup] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [celebrating, setCelebrating] = useState('')
  useEffect(() => {
    const celebration = redemption.celebration
    if (!celebration || celebration.owner !== userId || celebration.until <= Date.now()) { setCelebrating(''); return }
    setCelebrating(celebration.eventId)
    const timer = setTimeout(() => setCelebrating(''), celebration.until - Date.now())
    return () => clearTimeout(timer)
  }, [redemption.celebration, userId])
  const [passport, setPassport] = useState<{ owner: string | null; items: Stamp[]; loading: boolean; error: boolean }>({ owner: null, items: [], loading: true, error: false })
  useEffect(() => { setCode(pendingPass ?? ''); setBackup(null) }, [pendingPass])
  useEffect(() => { setMessage(launchIssue) }, [launchIssue])

  useEffect(() => {
    if (!client || !userId || authLoading) return
    const abort = new AbortController()
    let current = true
    setPassport({ owner: userId, items: [], loading: true, error: false })
    void (async () => {
      try {
        const { data, error } = await readWithDeadline(signal => client.rpc('danz_my_passport').abortSignal(signal), abort.signal)
        if (error) throw error
        if (current) setPassport({ owner: userId, items: data ?? [], loading: false, error: false })
      } catch {
        if (current) setPassport({ owner: userId, items: [], loading: false, error: true })
      }
    })()
    return () => { current = false; abort.abort() }
  }, [client, userId, authLoading, retry, redemption.revision])

  const redeem = (event: FormEvent) => {
    event.preventDefault()
    if (busy || authLoading) return
    const normalized = normalizeEventCode(code)
    if (!normalized) { setMessage('Revisa el código: debe contener entre 12 y 64 letras o números.'); return }
    haptic()
    const saved = savePendingPass(normalized)
    onPendingPass(normalized)
    if (!userId) {
      setMessage(saved ? 'Pase guardado en este móvil. Inicia sesión para añadir el sello a tu cuenta.' : 'Este navegador no permite guardar el pase. Mantén esta página abierta e inicia sesión. Conserva también tu código.')
      return
    }
    setMessage(null)
    redemption.retry()
  }

  const requestSignIn = () => {
    if (code.trim()) {
      const normalized = normalizeEventCode(code)
      if (!normalized) { setMessage('Revisa el código antes de continuar o borra el campo para iniciar sesión.'); return }
      savePendingPass(normalized)
      onPendingPass(normalized)
    }
    onSignIn()
  }
  const discard = () => { if (pendingPass) clearPendingPass(pendingPass); onPendingPass(null); setCode(''); setMessage('Pase pendiente descartado. Tus sellos guardados se conservan.') }
  const copyPass = async () => {
    if (!pendingPass) return
    const link = new URL('/', window.location.origin)
    link.hash = new URLSearchParams({ pase: pendingPass }).toString()
    try { await navigator.clipboard.writeText(link.href); setBackup('Enlace copiado. Puedes guardarlo para abrir tu pase en otro navegador.') }
    catch { setBackup(link.href) }
  }
  const codeForm = <form onSubmit={event => void redeem(event)}>
    <label htmlFor="event-access-code">CÓDIGO DEL EVENTO</label>
    <input id="event-access-code" value={code} onChange={event => setCode(event.target.value)} maxLength={256} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="DANZ-XXXX-XXXX-XXXX" disabled={busy} />
    <button className="primary-btn" type="submit" disabled={busy || authLoading || !code.trim() || Boolean(userId && !client)}>{busy ? 'GUARDANDO…' : userId ? 'GUARDAR MI SELLO' : 'GUARDAR PASE EN ESTE MÓVIL'} <span aria-hidden="true">→</span></button>
  </form>

  // A QR is saved at launch. Guests can leave immediately without waiting for
  // Auth, installing the PWA, or submitting the same code a second time.
  const savedForLater = !userId && Boolean(pendingPass) && !launchIssue && readPendingPass() === pendingPass
  if (arrival && savedForLater) return <section className="passport-receipt" aria-labelledby="saved-pass-title">
    <div className="eyebrow">DANZ COLLECTIVE / TU NOCHE</div>
    <svg className="passport-receipt-mark" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m14 24 7 7 14-15" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
    <h1 id="saved-pass-title">PASE<br /><em>GUARDADO.</em></h1>
    <p className="passport-receipt-lead" role="status">Ya puedes seguir con tu noche.</p>
    <p>Vuelve mañana a este navegador para canjearlo.</p>
    {pendingCount > 1 && <p className="passport-queue-note">Tienes {pendingCount} pases guardados. Cada fiesta conserva el suyo.</p>}
    <div className="passport-receipt-actions">
      <button type="button" className="primary-btn" onClick={onContinue}>SEGUIR CON MI NOCHE</button>
    </div>
    <PassArrivalGuide code={pendingPass!} />
    {client && <button type="button" className="outline-btn pass-claim-now" onClick={requestSignIn}>CANJEAR MI PASE</button>}
    <p className="passport-receipt-note">No hace falta instalar DANZ. Si lo prefieres, puedes canjearlo ahora.</p>
    <details className="passport-receipt-details passport-redeem">
      <summary>VER MI CÓDIGO Y OPCIONES</summary>
      <p>El sello se confirma al comprobar el código y vincularlo a tu cuenta. El código debe seguir vigente.</p>
      <button type="button" className="outline-btn" onClick={() => void copyPass()}>COPIAR ENLACE DE MI PASE</button>
      {backup && <p className="passport-backup" role="status">{backup}</p>}
      {codeForm}
      {message && <p className="passport-message" role="status">{message}</p>}
      <button type="button" className="outline-btn" onClick={discard}>DESCARTAR PASE PENDIENTE</button>
    </details>
  </section>

  const items = !authLoading && passport.owner === userId ? passport.items : []
  const stampsReady = Boolean(userId && !authLoading && passport.owner === userId && !passport.loading && !passport.error)
  return <>
    <div className="eyebrow">DANZ COLLECTIVE / TU PASAPORTE</div>
    <h1 className="page-title passport-title">TU PASAPORTE <em>DANZ.</em></h1>
    <p className="page-lead">Cada noche es un viaje. Desliza las páginas para recorrer los sellos y recuerdos de tus fiestas.</p>
    {redemption.message && <p className="passport-message passport-link-status" role="status">{redemption.message}</p>}
    <div className="passport-layout">
      <PassportBook client={client} userId={userId} registeredAt={registeredAt} authLoading={authLoading} stamps={items} ready={stampsReady} loading={passport.loading} failed={passport.error} celebrating={celebrating} onSignIn={requestSignIn} onGallery={onGallery} onRefresh={() => setRetry(value => value + 1)}/>
      <section className="passport-redeem" aria-labelledby="redeem-title">
        <div className="passport-redeem-intro"><span className="passport-redeem-number" aria-hidden="true">+</span><div><h2 id="redeem-title">Guarda tu noche.</h2>
        <p>Escanea el QR del evento con la cámara de tu móvil o introduce su código. {userId ? 'El sello se añadirá a la cuenta con la que has iniciado sesión.' : 'Puedes guardar el pase ahora y añadirlo a tu cuenta después.'}</p></div></div>
        {codeForm}
        {!client && <p role="status">El canje estará disponible cuando se configure la conexión de las cuentas.</p>}
        {authLoading && <p role="status">Comprobando tu sesión…</p>}
        {!userId && !authLoading && client && <button type="button" className="primary-btn" onClick={requestSignIn}>INICIAR SESIÓN</button>}
        {message && <p className="passport-message" role="status">{message}</p>}
        {userId && pendingPass && !busy && <button type="button" className="outline-btn" onClick={redemption.retry}>REINTENTAR PASES</button>}
        {pendingPass && !busy && <button type="button" className="outline-btn" onClick={discard}>DESCARTAR PASE PENDIENTE</button>}
      </section>
    </div>
    <FeedbackSettings/>
  </>
}
