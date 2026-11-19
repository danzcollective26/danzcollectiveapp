import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { useAuth } from './AuthProvider'
import { configIssue, fetchSocialProviders } from './client'
import { authErrorMessage } from './config'
import { accountBrowserUrl, danzAuthOrigin, type SocialProvider } from './oauth'
import { readPendingPass } from '../events/pass'
import './Account.css'
import InstagramLink from './InstagramLink'
import YeppoToggle from '../yeppo/YeppoToggle'
import RadioUpload from '../music/RadioUpload'
import {notifyIdentity} from './useIdentity'

type Profile = Pick<Database['public']['Tables']['danz_profiles']['Row'], 'user_id' | 'display_name' | 'instagram_handle'>

function ProfileForm({ client, user }: { client: SupabaseClient<Database>; user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const saving = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const abort = new AbortController()
    setLoading(true)
    setLoadFailed(false)
    setError('')
    void (async () => {
      try {
        const result = await client.from('danz_profiles').select('user_id,display_name,instagram_handle').eq('user_id', user.id).abortSignal(abort.signal).maybeSingle()
        if (abort.signal.aborted) return
        if (result.error) { setLoadFailed(true); setError('No se pudo cargar tu perfil. Inténtalo de nuevo.'); return }
        setProfile(result.data)
        setName(result.data?.display_name ?? '')
        setInstagram(result.data?.instagram_handle ?? '')
      } catch {
        if (!abort.signal.aborted) { setLoadFailed(true); setError('No se pudo cargar tu perfil. Comprueba la conexión.') }
      } finally {
        if (!abort.signal.aborted) setLoading(false)
      }
    })()
    return () => { mounted.current = false; abort.abort() }
  }, [client, user.id, attempt])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving.current || loading) return
    const displayName = name.trim()
    const handle = instagram.trim().replace(/^@/, '')
    if (displayName.length > 80 || (handle && !/^[A-Za-z0-9_.]{1,30}$/.test(handle))) {
      setError('Revisa el nombre y el usuario de Instagram: usa letras, números, puntos o guiones bajos.'); return
    }
    saving.current = true
    setBusy(true)
    setError('')
    setMessage('')
    const fields = { display_name: displayName || null, instagram_handle: handle || null }
    try {
      // Column privileges deliberately exclude ownership and timestamps from UPDATE.
      const query = profile
        ? client.from('danz_profiles').update(fields).eq('user_id', user.id)
        : client.from('danz_profiles').insert({ user_id: user.id, ...fields })
      const result = await query.select('user_id,display_name,instagram_handle').maybeSingle()
      if (!mounted.current) return
      if (result.error || !result.data) {
        setError('No se pudo guardar tu perfil. Inténtalo de nuevo.'); return
      }
      setProfile(result.data)
      setName(result.data.display_name ?? '')
      setInstagram(result.data.instagram_handle ?? '')
      setMessage('Perfil guardado.');notifyIdentity()
    } catch {
      if (mounted.current) setError('No se pudo guardar tu perfil. Comprueba la conexión.')
    } finally {
      saving.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return <section className="account-card" aria-label="Tu perfil" aria-busy={loading || busy}>
    <h2>Tu perfil</h2>
    <p className="account-note">Tu perfil es privado en esta versión. El acceso a cada galería depende de tu asistencia al evento.</p>
    {loading ? <p role="status">Cargando tu perfil…</p> : <>
      {error && <p role="alert" className="account-error">{error}</p>}
      {loadFailed && <button className="outline-btn" onClick={() => setAttempt(value => value + 1)}>VOLVER A CARGAR PERFIL</button>}
      <form onSubmit={event => { void save(event) }} className="account-form">
        <label htmlFor="profile-name">Nombre visible</label>
        <input id="profile-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} autoComplete="nickname" disabled={busy} />
        <label htmlFor="profile-instagram">Instagram (opcional)</label>
        <input id="profile-instagram" value={instagram} onChange={event => setInstagram(event.target.value)} maxLength={31} autoComplete="off" placeholder="@tuusuario" disabled={busy} aria-describedby="instagram-help" />
        <p id="instagram-help" className="account-note">Este campo no verifica la titularidad. Para puntos y competición, completa la vinculación de Instagram de abajo.</p>
        <button className="primary-btn" type="submit" disabled={busy || loadFailed}>{busy ? 'GUARDANDO…' : 'GUARDAR PERFIL'}</button>
      </form>
      {message && <p role="status" className="account-success">{message}</p>}
    </>}
  </section>
}

export default function Account({ focusInstagram = false }: { focusInstagram?: boolean }) {
  const { client, user, loading, error: authError, signOut, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeEmail, setCodeEmail] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [nextSendAt, setNextSendAt] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [providers, setProviders] = useState<SocialProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(false)
  const [providersUnavailable, setProvidersUnavailable] = useState(false)
  const [providerAttempt, setProviderAttempt] = useState(0)
  const [openingProvider, setOpeningProvider] = useState<SocialProvider | null>(null)
  const embedded = window.self !== window.top
  const action = useRef(false)
  const mounted = useRef(true)

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    setProviders([])
    setProvidersUnavailable(false)
    if (!client || user || loading) { setProvidersLoading(false); return }
    let current = true
    setProvidersLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    void fetchSocialProviders(controller.signal).then(options => {
      if (controller.signal.aborted) throw new Error('Auth options timed out')
      if (current) setProviders(options)
    }).catch(() => { if (current) setProvidersUnavailable(true) }).finally(() => {
      clearTimeout(timeout)
      if (current) setProvidersLoading(false)
    })
    return () => { current = false; controller.abort(); clearTimeout(timeout) }
  }, [client, user?.id, loading, providerAttempt])
  useEffect(() => {
    if (!nextSendAt) return
    const update = () => setCooldown(Math.max(0, Math.ceil((nextSendAt - Date.now()) / 1000)))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [nextSendAt])
  useEffect(() => {
    if (user) { setEmail(''); setSentEmail(''); setCode(''); setCodeEmail(''); setMessage(''); setError('') }
  }, [user])

  const requestLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client || action.current || cooldown) return
    const address = email.trim()
    action.current = true
    setBusy(true)
    clearError()
    setError('')
    setMessage('')
    try {
      const result = await client.auth.signInWithOtp({
        email: address,
        options: { shouldCreateUser: true, emailRedirectTo: new URL('/', danzAuthOrigin(window.location.origin)).href },
      })
      if (!mounted.current) return
      if (result.error) { setError(authErrorMessage(result.error)); return }
      setSentEmail(address)
      setCodeEmail(address)
      setCode('')
      setNextSendAt(Date.now() + 60000)
      setCooldown(60)
      setMessage('Solicitud enviada. Revisa tu correo. Si incluye un código, puedes escribirlo abajo. Los enlaces nuevos deben llevar a danzcollectiveapp.vercel.app; abre el correo en el mismo navegador.')
    } catch (reason) {
      if (mounted.current) setError(authErrorMessage(reason))
    } finally {
      action.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client || !codeEmail.trim() || action.current) return
    action.current = true
    setBusy(true)
    setError('')
    clearError()
    try {
      const result = await client.auth.verifyOtp({ email: codeEmail.trim(), token: code.trim(), type: 'email' })
      if (mounted.current && result.error) setError(authErrorMessage(result.error))
    } catch (reason) {
      if (mounted.current) setError(authErrorMessage(reason))
    } finally {
      action.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const enterWithProvider = async (provider: SocialProvider) => {
    if (!client || action.current || embedded || !providers.includes(provider)) return
    // A PKCE verifier cannot cross origins. First move from an old QR demo or
    // preview to production, *then* create the OAuth verifier in that browser.
    const canonical = danzAuthOrigin(window.location.origin)
    if (window.location.origin !== canonical) {
      window.location.assign(accountBrowserUrl(canonical, readPendingPass()))
      return
    }
    action.current = true
    setBusy(true)
    setOpeningProvider(provider)
    setError('')
    setMessage('')
    clearError()
    try {
      const result = await client.auth.signInWithOAuth({ provider, options: { redirectTo: new URL('/', danzAuthOrigin(window.location.origin)).href } })
      if (mounted.current && result.error) setError(authErrorMessage(result.error))
    } catch (reason) {
      if (mounted.current) setError(authErrorMessage(reason))
    } finally {
      action.current = false
      if (mounted.current) { setBusy(false); setOpeningProvider(null) }
    }
  }

  const leave = async () => {
    if (action.current) return
    action.current = true
    setBusy(true)
    setError('')
    try { await signOut() } catch { if (mounted.current) setError('No se pudo cerrar la sesión. Comprueba la conexión y vuelve a intentarlo.') }
    finally { action.current = false; if (mounted.current) setBusy(false) }
  }

  return <section className="account-page">
    <div className="eyebrow">DANZ COLLECTIVE / TU CUENTA</div>
    <h1 className="page-title">TU<br /><em>CUENTA.</em></h1>
    {authError && <p role="alert" className="account-error">{authError}</p>}
    {!client ? <div className="account-card"><h2>Seguimos preparando las cuentas</h2><p>{configIssue}</p><p>Puedes explorar la app y jugar sin registrarte.</p></div>
      : loading ? <p role="status">Comprobando tu sesión…</p>
      : user ? <>
        <div className="account-session">
          <p>Sesión iniciada como <strong>{user.email ?? 'miembro de DANZ'}</strong></p>
          <button className="outline-btn" type="button" disabled={busy} onClick={() => { void leave() }}>{busy ? 'CERRANDO…' : 'CERRAR SESIÓN'}</button>
        </div>
        {error && <p role="alert" className="account-error">{error}</p>}
        <InstagramLink key={`instagram-${user.id}`} focusOnMount={focusInstagram} />
        <ProfileForm key={user.id} client={client} user={user} />
        <YeppoToggle />
        <RadioUpload />
      </> : <div className="account-card">
        <h2>{providers.length || providersLoading ? 'Entra en DANZ' : 'Entra con tu correo'}</h2>
        {providersLoading && <p className="account-note" role="status">Comprobando las formas de acceso…</p>}
        {providersUnavailable && <div className="account-browser-login" role="alert"><p>No hemos podido cargar las opciones de acceso. Vuelve a intentarlo o utiliza tu correo.</p><button className="outline-btn" type="button" disabled={busy} onClick={() => setProviderAttempt(value => value + 1)}>RECARGAR ACCESOS</button></div>}
        {providers.length > 0 && (embedded ? <div className="account-browser-login">
          <p>Para usar este acceso, abre DANZ en tu navegador.</p>
          <a className="primary-btn external-btn" href={accountBrowserUrl(danzAuthOrigin(window.location.origin), readPendingPass())} target="_blank" rel="noopener noreferrer">ABRIR DANZ PARA ENTRAR</a>
        </div> : <div className="account-social" role="group" aria-label="Acceso con tu cuenta">
          {providers.map(provider => <button className={`account-social-button account-social-${provider}`} key={provider} type="button" disabled={busy} aria-busy={openingProvider === provider} onClick={() => { void enterWithProvider(provider) }}>{openingProvider === provider ? 'Abriendo ' : 'Continuar con '}{provider === 'google' ? 'Google' : 'Apple'}{openingProvider === provider ? '…' : ''}</button>)}
          <p className="account-note">¿Has abierto el QR desde la Cámara de un iPhone o desde Instagram? Si Google muestra un error, abre DANZ directamente en Safari o Chrome antes de pulsar «Continuar con Google». No continúes desde un navegador integrado.</p>
          <a className="account-browser-direct" href={accountBrowserUrl(danzAuthOrigin(window.location.origin), readPendingPass())} target="_blank" rel="noopener noreferrer">ABRIR DANZ EN EL NAVEGADOR ↗</a>
          <p className="account-note">O utiliza tu correo electrónico.</p>
        </div>)}
        <p>También puedes entrar con cualquier correo: iCloud, Gmail, Outlook u otro. Sin crear contraseña.</p>
        {readPendingPass() && <p className="account-note">Tu pase ya está guardado. Al entrar, lo añadiremos a tu pasaporte automáticamente si el código sigue vigente.</p>}
        <form className="account-form" onSubmit={event => { void requestLink(event) }}>
          <label htmlFor="account-email">Correo electrónico</label>
          <input id="account-email" type="email" required maxLength={254} autoComplete="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
          <button className="primary-btn" type="submit" disabled={busy || cooldown > 0}>{busy ? 'ENVIANDO…' : cooldown ? `ESPERA ${cooldown} S` : 'ENVIAR ENLACE'}</button>
        </form>
        <p className="account-note">Este correo se usa para acceder a tu cuenta. No te suscribe a publicidad.</p>
        {message && <p role="status" className="account-success">{message}</p>}
        {error && <p role="alert" className="account-error">{error}</p>}
        <>
          <button className="account-text-button" type="button" onClick={() => { setCodeEmail(codeEmail || sentEmail || email.trim()); setShowCode(value => !value) }} aria-expanded={showCode}>MI CORREO INCLUYE UN CÓDIGO</button>
          {showCode && <form className="account-form account-code" onSubmit={event => { void verifyCode(event) }}>
            <p className="account-note">Úsalo si tu correo muestra un código numérico. Puedes introducirlo aquí aunque hayas abierto el correo en otra ventana.</p>
            <label htmlFor="account-code-email">Correo asociado al código</label>
            <input id="account-code-email" type="email" required maxLength={254} autoComplete="email" value={codeEmail} onChange={event => setCodeEmail(event.target.value)} disabled={busy} />
            <label htmlFor="account-code">Código de acceso</label>
            <input id="account-code" type="text" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={code} onChange={event => setCode(event.target.value)} disabled={busy} />
            <button className="primary-btn" type="submit" disabled={busy}>COMPROBAR CÓDIGO</button>
          </form>}
        </>
        <div className="account-link-help"><h3>¿El enlace del correo no te deja entrar?</h3><p>Abre danzcollectiveapp.vercel.app directamente en Chrome o Safari, solicita allí un correo nuevo y ábrelo desde el mismo navegador. No uses la antigua demo chatgpt.site. Si tu correo incluye un código numérico, también puedes introducirlo arriba.</p><a className="outline-btn external-btn" href={accountBrowserUrl(danzAuthOrigin(window.location.origin), readPendingPass())} target="_blank" rel="noopener noreferrer">ABRIR CUENTA EN EL NAVEGADOR</a></div>
      </div>}
  </section>
}
