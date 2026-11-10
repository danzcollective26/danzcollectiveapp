import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Factor = { id: string; friendly_name?: string; status: 'verified' | 'unverified'; created_at?: string }
export type AdminMfaEnrollment = { owner: string; client: SupabaseClient<Database>; id: string; qr: string; secret: string }
export type AdminMfaSetupCache = { current: AdminMfaEnrollment | null }
export default function AdminMfa({ client, userId, setup, onVerified }: { client: SupabaseClient<Database>; userId: string; setup: AdminMfaSetupCache; onVerified: () => void }) {
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<Factor[]>([])
  const [selected, setSelected] = useState('')
  const [enrollment, setEnrollment] = useState<AdminMfaEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const mounted = useRef(true)
  const action = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    let current = true
    setLoading(true); setError('')
    void (async () => {
      try {
        const result = await client.auth.mfa.getAuthenticatorAssuranceLevel()
        if (result.error) throw result.error
        if (!current) return
        if (result.data.currentLevel === 'aal2') {
          if (setup.current?.owner === userId && setup.current.client === client) setup.current = null
          onVerified(); return
        }
        const listed = await client.auth.mfa.listFactors()
        if (listed.error) throw listed.error
        if (current) {
          const pending = listed.data.all.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified').sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
          const candidates = listed.data.totp.length ? listed.data.totp : pending
          setFactors(candidates)
          const cached = setup.current
          if (cached?.owner === userId && cached.client === client && pending.some(factor => factor.id === cached.id)) {
            setEnrollment(cached); setSelected(cached.id)
          } else {
            if (cached?.owner === userId && cached.client === client) setup.current = null
            setEnrollment(null); setSelected(candidates[0]?.id ?? '')
          }
        }
      } catch { if (current) setError('No hemos podido comprobar la verificación en dos pasos. Vuelve a intentarlo.') }
      finally { if (current) setLoading(false) }
    })()
    return () => { current = false }
  }, [client, userId, setup, retry, onVerified])

  const enroll = async () => {
    if (action.current) return
    action.current = true; setBusy(true); setError(''); setCode('')
    try {
      // An explicit restart retires abandoned, unverified setups through the
      // current user's Auth API. It never removes a verified authenticator.
      const listed = await client.auth.mfa.listFactors()
      if (listed.error) throw listed.error
      for (const factor of listed.data.all) {
        if (factor.factor_type !== 'totp' || factor.status !== 'unverified') continue
        const removed = await client.auth.mfa.unenroll({ factorId: factor.id })
        if (removed.error) throw removed.error
      }
      const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: `DANZ ${new Date().toISOString()}` })
      if (error) throw error
      const svg = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, '')
      if (mounted.current) {
        const next = { owner: userId, client, id: data.id, qr: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, secret: data.totp.secret }
        setup.current = next
        setFactors([]); setEnrollment(next)
      }
    } catch { if (mounted.current) setError('No se pudo iniciar la configuración. Comprueba la conexión y vuelve a intentarlo.') }
    finally { action.current = false; if (mounted.current) setBusy(false) }
  }
  const verify = async (event: FormEvent) => {
    event.preventDefault()
    if (action.current || !/^\d{6}$/.test(code)) return
    const factorId = enrollment?.id ?? selected
    if (!factorId) return
    action.current = true; setBusy(true); setError('')
    try {
      const result = await client.auth.mfa.challengeAndVerify({ factorId, code })
      if (result.error) throw result.error
      if (mounted.current) {
        if (setup.current?.owner === userId && setup.current.client === client) setup.current = null
        setEnrollment(null); setCode(''); onVerified()
      }
    } catch { if (mounted.current) setError('No se pudo verificar el código. Usa el código actual de tu aplicación y vuelve a intentarlo.') }
    finally { action.current = false; if (mounted.current) setBusy(false) }
  }
  const cancel = async () => {
    if (!enrollment || action.current) return
    action.current = true; setBusy(true); setError('')
    try {
      const result = await client.auth.mfa.unenroll({ factorId: enrollment.id })
      if (result.error) throw result.error
      if (mounted.current) {
        if (setup.current?.id === enrollment.id && setup.current.owner === userId && setup.current.client === client) setup.current = null
        setFactors(items => items.filter(factor => factor.id !== enrollment.id)); setEnrollment(null); setCode('')
      }
    } catch { if (mounted.current) setError('No se pudo cancelar la configuración. Vuelve a intentarlo.') }
    finally { action.current = false; if (mounted.current) setBusy(false) }
  }

  return <section className="account-card" aria-label="Verificación de administración">
    <h2>Protege la administración.</h2>
    <p>Para crear eventos y gestionar accesos necesitas verificar tu sesión con una aplicación de autenticación.</p>
    {loading ? <p role="status">Comprobando la protección de tu cuenta…</p> : <>
      {error && !enrollment && !factors.length && <p className="account-error" role="alert">{error}</p>}
      {error && !enrollment && <button className="outline-btn" onClick={() => setRetry(n => n + 1)}>VOLVER A COMPROBAR</button>}
      {!error && !factors.length && !enrollment && <button className="primary-btn" disabled={busy} onClick={() => void enroll()}>CONFIGURAR DOS PASOS</button>}
      {enrollment && <div className="admin-enrollment">
        <p>Escanea este QR desde tu aplicación de autenticación. Si estás usando el mismo móvil, añade manualmente la clave que aparece debajo.</p>
        <img src={enrollment.qr} alt="QR para configurar tu aplicación de autenticación" width={220} height={220} />
        <p>Clave de configuración: <code className="admin-secret">{enrollment.secret}</code></p>
        <p>La verificación inicial cerrará las demás sesiones de esta cuenta. La clave solo se muestra durante esta configuración.</p>
      </div>}
      {!enrollment && factors.some(factor => factor.status === 'unverified') && <p role="status">Hay una configuración pendiente. Si ya añadiste DANZ a Authenticator, introduce su código actual. Si aún no la añadiste o usaste otra clave, pulsa «Configurar otra clave».</p>}
      {(factors.length > 0 || enrollment) && <form className="account-form" onSubmit={event => void verify(event)}>
        {factors.length > 1 && !enrollment && <><label htmlFor="admin-factor">Dispositivo de verificación</label><select id="admin-factor" value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}>{factors.map(factor => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Aplicación de autenticación'}</option>)}</select></>}
        <label htmlFor="admin-totp">Código de tu aplicación de autenticación</label>
        <input id="admin-totp" required pattern="[0-9]{6}" maxLength={64} inputMode="numeric" autoComplete="one-time-code" aria-describedby="admin-totp-help" aria-invalid={Boolean(code) && !/^\d{6}$/.test(code)} value={code} onChange={event => setCode(event.target.value.replace(/[\s\u200b-\u200d\ufeff-]/g, ''))} disabled={busy} />
        <p id="admin-totp-help">Introduce las seis cifras que muestra Authenticator y pulsa «Verificar y entrar».</p>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="primary-btn" disabled={busy || !/^\d{6}$/.test(code)}>{busy ? 'VERIFICANDO…' : 'VERIFICAR Y ENTRAR'}</button>
        {enrollment && <button className="outline-btn" type="button" disabled={busy} onClick={() => void cancel()}>CANCELAR CONFIGURACIÓN</button>}
        {!enrollment && factors.length > 0 && factors.every(factor => factor.status === 'unverified') && <button className="outline-btn" type="button" disabled={busy} onClick={() => void enroll()}>CONFIGURAR OTRA CLAVE</button>}
      </form>}
    </>}
  </section>
}
