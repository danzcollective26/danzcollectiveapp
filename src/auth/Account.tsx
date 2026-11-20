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
import { useIdentity } from './useIdentity'
import YeppoToggle from '../yeppo/YeppoToggle'
import RadioUpload from '../music/RadioUpload'
import MemberPublicCard from './MemberPublicCard'
import {notifyIdentity} from './useIdentity'

type Profile = Pick<Database['public']['Tables']['danz_profiles']['Row'], 'user_id' | 'display_name' | 'instagram_handle' | 'instagram_public'>

// Client-side first line of defence; server-side validation is still required for full enforcement.
function validateDisplayName(value: string): string | null {
  const name = value.normalize('NFKC').trim()
  if (!name || name.length > 40) return 'Elige un nombre público de entre 1 y 40 caracteres.'
  if (!/^[\p{L}\p{M}\p{N} _.'-]+$/u.test(name)) return 'Usa letras, números normales, espacios y signos sencillos.'
  const normalized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (/(?:heilhitler|siegheil|whitepower|1488|hh88|nazi|nazismo|nsdap|swastika)/.test(normalized)) return 'Ese nombre no cumple las normas de la comunidad DANZ.'
  return null
}

function ProfileForm({ client, user, onOpenPassport, editing, onToggleEditing }: { client: SupabaseClient<Database>; user: User; onOpenPassport: () => void; editing: boolean; onToggleEditing: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [expandedDetails, setExpandedDetails] = useState(false)
  const identity = useIdentity()
  const [name, setName] = useState('')
  const [instagram, setInstagram] = useState('')
  const [instagramPublic, setInstagramPublic] = useState(false)
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
        const result = await client.from('danz_profiles').select('user_id,display_name,instagram_handle,instagram_public').eq('user_id', user.id).abortSignal(abort.signal).maybeSingle()
        if (abort.signal.aborted) return
        if (result.error) { setLoadFailed(true); setError('No se pudo cargar tu perfil. Inténtalo de nuevo.'); return }
        setProfile(result.data)
        setName(result.data?.display_name ?? '')
        setInstagram(result.data?.instagram_handle ?? '')
        setInstagramPublic(result.data?.instagram_public ?? false)
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
    const nameError = validateDisplayName(displayName)
    if (nameError) { setError(nameError); return }
    if (handle && !/^[A-Za-z0-9_.]{1,30}$/.test(handle)) {
      setError('El usuario de Instagram solo admite letras, números, puntos o guiones bajos.'); return
    }
    saving.current = true
    setBusy(true)
    setError('')
    setMessage('')
    const fields = { display_name: displayName || null, instagram_handle: handle || null, instagram_public: instagramPublic }
    try {
      // Column privileges deliberately exclude ownership and timestamps from UPDATE.
      const query = profile
        ? client.from('danz_profiles').update(fields).eq('user_id', user.id)
        : client.from('danz_profiles').insert({ user_id: user.id, ...fields })
      const result = await query.select('user_id,display_name,instagram_handle,instagram_public').maybeSingle()
      if (!mounted.current) return
      if (result.error || !result.data) {
        setError('No se pudo guardar tu perfil. Inténtalo de nuevo.'); return
      }
      setProfile(result.data)
      setName(result.data.display_name ?? '')
      setInstagram(result.data.instagram_handle ?? '')
      setInstagramPublic(result.data.instagram_public ?? false)
      setMessage('Perfil guardado.');notifyIdentity()
    } catch {
      if (mounted.current) setError('No se pudo guardar tu perfil. Comprueba la conexión.')
    } finally {
      saving.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const [publicCard, setPublicCard] = useState<{ name: string | null; handle: string } | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'hidden' | 'error'>('idle')
  useEffect(() => {
    if (!instagramPublic || !profile?.instagram_public || !identity.data?.verified || !client) {
      setPublicCard(null)
      setPreviewStatus('idle')
      return
    }
    let active = true
    setPreviewStatus('loading')
    void client.rpc('danz_public_instagram_card', { p_user: user.id }).then(({ data, error }) => {
      if (!active) return
      if (error) { setPublicCard(null); setPreviewStatus('error'); return }
      if (data && typeof data === 'object' && !Array.isArray(data) &&
          typeof data.handle === 'string' && /^[A-Za-z0-9_.]{1,30}$/.test(data.handle) &&
          (data.name === null || typeof data.name === 'string')) {
        setPublicCard({ name: data.name, handle: data.handle })
        setPreviewStatus('idle')
      } else {
        setPublicCard(null)
        setPreviewStatus('hidden')
      }
    }).then(undefined, () => { if (active) { setPublicCard(null); setPreviewStatus('error') } })
    return () => { active = false }
  }, [client, user.id, instagramPublic, profile?.instagram_public, identity.data?.verified, identity.data?.handle])

  const [membershipNumber, setMembershipNumber] = useState<number | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setMembershipNumber(null)
    void client.from('danz_membership_numbers').select('member_number')
      .eq('user_id', user.id).abortSignal(controller.signal).maybeSingle()
      .then(({ data, error }) => {
        if (!controller.signal.aborted && !error && Number.isSafeInteger(data?.member_number) && Number(data?.member_number) > 0) {
          setMembershipNumber(Number(data?.member_number))
        }
      }).then(undefined, () => {})
    return () => controller.abort()
  }, [client, user.id])

  const [memberStats, setMemberStats] = useState<{ code: string | null; stamps: number | null; available: number | null; pending: number | null }>({ code: null, stamps: null, available: null, pending: null })
  useEffect(() => {
    const controller = new AbortController()
    const points = client.rpc('danz_points_summary').abortSignal(controller.signal).then(({ data, error }) => {
      if (error || !data || typeof data !== 'object' || Array.isArray(data)) return
      const item = data as Record<string, unknown>
      if (controller.signal.aborted) return
      setMemberStats(prev => ({
        ...prev,
        code: typeof item.code === 'string' && /^DNZ-[A-F0-9]{12}$/.test(item.code) ? item.code : null,
        available: Number.isSafeInteger(item.available) && Number(item.available) >= 0 ? Number(item.available) : null,
        pending: Number.isSafeInteger(item.pending) && Number(item.pending) >= 0 ? Number(item.pending) : null,
      }))
    }).then(undefined, () => {})
    const stamps = client.rpc('danz_my_passport').abortSignal(controller.signal).then(({ data, error }) => {
      if (!controller.signal.aborted && !error && Array.isArray(data)) setMemberStats(prev => ({ ...prev, stamps: data.length }))
    }).then(undefined, () => {})
    void Promise.all([points, stamps])
    return () => controller.abort()
  }, [client, user.id])

  const verifiedHandle = identity.data?.verified ? identity.data.handle : null
  const safeHandle = verifiedHandle && /^[A-Za-z0-9_.]{1,30}$/.test(verifiedHandle) ? verifiedHandle : null
  return <><section className="account-card danz-profile-card" aria-label="Tu perfil" aria-busy={loading || busy}>
    <div className="danz-profile-kicker">DANZ COLLECTIVE / MEMBER PROFILE</div>
    <div className="danz-profile-header">
      <div className="danz-profile-avatar" aria-hidden="true">{(name.trim() || user.email || 'D').slice(0, 1).toUpperCase()}</div>
      <div><h2>{name.trim() || 'Mi identidad DANZ'}</h2><p className="account-note">{user.email ?? 'Miembro DANZ'}</p></div>
    </div>
    {loading ? <p role="status">Cargando identidad…</p> : <>
      {error && <p role="alert" className="account-error">{error}</p>}
      {loadFailed && <button className="outline-btn" onClick={() => setAttempt(value => value + 1)}>VOLVER A CARGAR PERFIL</button>}
      <div className="danz-member-quickstats" aria-label="Resumen de tu membresía DANZ">
        <div className="danz-member-stat"><span aria-hidden="true">◎</span><strong>{identity.loading ? '…' : safeHandle ? '@' + safeHandle : '—'}</strong><small>INSTAGRAM</small></div>
        <div className="danz-member-stat"><span aria-hidden="true">✦</span><strong>{memberStats.available === null ? '—' : memberStats.available.toLocaleString('es-ES')}</strong><small>DANZPOINTS</small></div>
        <div className="danz-member-stat"><span aria-hidden="true">✳</span><strong>{memberStats.stamps === null ? '—' : memberStats.stamps}</strong><small>SELLOS</small></div>
      </div>
      <div className="danz-member-number">Nº SOCIO <strong>{membershipNumber === null ? 'PENDIENTE' : String(membershipNumber).padStart(6, '0')}</strong></div>
      {safeHandle ? <a className="danz-instagram-profile" href={`https://www.instagram.com/${safeHandle}/`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir perfil de Instagram de @${safeHandle}`}>
        <span className="danz-instagram-mark" aria-hidden="true">◎</span><span><b>@{safeHandle}</b><small>PERFIL DE INSTAGRAM VERIFICADO</small></span><span aria-hidden="true">↗</span>
      </a> : <p className="account-note">El @usuario escrito no demuestra una vinculación. Complétala en «Vincular Instagram» y aparecerá aquí el acceso directo.</p>}
      <button className="danz-profile-disclosure" type="button" aria-expanded={expandedDetails} aria-controls="danz-member-full-details" onClick={() => setExpandedDetails(value => !value)}>
        {expandedDetails ? 'OCULTAR DATOS DE MI TARJETA' : 'VER TODOS MIS DATOS'} <span aria-hidden="true">{expandedDetails ? '−' : '+'}</span>
      </button>
      {expandedDetails && <div id="danz-member-full-details">
      <div className="danz-member-details" aria-label="Datos de tu tarjeta de socio DANZ">
        <div className="danz-profile-detail"><span>Número de socio</span><strong>{membershipNumber === null ? 'Por consultar' : String(membershipNumber).padStart(5, '0')}</strong></div>
        <div className="danz-profile-detail"><span>Código DANZPOINTS</span><strong>{memberStats.code ?? 'No disponible'}</strong></div>
        <div className="danz-profile-detail"><span>Miembro desde</span><strong>{user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no disponible'}</strong></div>
        <div className="danz-profile-detail"><span>Sellos del pasaporte</span><strong>{memberStats.stamps === null ? 'Por consultar' : memberStats.stamps}</strong></div>
        <div className="danz-profile-detail"><span>DANZPOINTS disponibles</span><strong>{memberStats.available === null ? 'Por consultar' : memberStats.available.toLocaleString('es-ES')}</strong></div>
        {memberStats.pending !== null && memberStats.pending > 0 && <div className="danz-profile-detail"><span>Puntos pendientes</span><strong>{memberStats.pending.toLocaleString('es-ES')}</strong></div>}
      </div>
      <div className="danz-profile-detail"><span>Nombre público</span><strong>{name.trim() || 'Pendiente de configurar'}</strong></div>
      <div className="danz-profile-detail"><span>Instagram</span><strong>{identity.loading ? 'Comprobando vinculación…' : safeHandle ? 'Verificado' : identity.data?.status === 'pending' ? 'Pendiente de validar' : 'Sin verificar'}</strong></div>
      </div>}
      {instagramPublic && profile?.instagram_public && previewStatus === 'loading' && <p role="status" className="account-note">Comprobando si tu tarjeta pública ya está disponible…</p>}
      {instagramPublic && profile?.instagram_public && previewStatus === 'hidden' && <p role="status" className="account-note">Todavía no se muestra públicamente: debe estar aprobada tu vinculación de Instagram.</p>}
      {instagramPublic && profile?.instagram_public && previewStatus === 'error' && <p role="alert" className="account-note">No se ha podido comprobar la tarjeta pública. Tu preferencia se ha guardado; inténtalo más tarde.</p>}
      {publicCard && <div className="danz-public-card-preview" aria-label="Vista previa de tu tarjeta pública de Instagram">
        <span className="danz-profile-kicker">ASÍ VERÁN TU INSTAGRAM LOS DEMÁS MIEMBROS</span>
        <a className="danz-instagram-profile" href={`https://www.instagram.com/${publicCard.handle}/`} target="_blank" rel="noopener noreferrer">
          <span className="danz-instagram-mark" aria-hidden="true">◎</span>
          <span><b>@{publicCard.handle}</b><small>{publicCard.name || 'Miembro DANZ'} · INSTAGRAM VERIFICADO</small></span>
          <span aria-hidden="true">↗</span>
        </a>
        <a className="outline-btn external-btn" href={`/?seccion=cuenta&miembro=${encodeURIComponent(user.id)}`}>VER MI TARJETA COMO OTRO MIEMBRO ↗</a>
      </div>}
      <div className="danz-member-actions"><button className="outline-btn" type="button" onClick={onOpenPassport}>ABRIR MI PASAPORTE ↗</button></div>
      {message && <p role="status" className="account-success">{message}</p>}
    </>}
  </section>
  <button className="outline-btn danz-account-manage-trigger" type="button" aria-expanded={editing} aria-controls="danz-account-management" onClick={onToggleEditing}>
    {editing ? 'VOLVER A MI TARJETA' : 'ADMINISTRAR MI PERFIL Y AJUSTES'} <span aria-hidden="true">{editing ? '−' : '+'}</span>
  </button>
  {editing && !loading && !loadFailed && <section className="account-card danz-editor-card" aria-label="Administrar mi perfil">
    <form onSubmit={event => { void save(event) }} className="account-form danz-profile-management-form">
        <h3>ADMINISTRAR MI PERFIL</h3>
        <p className="account-note">Los cambios son privados hasta que pulses guardar. La visibilidad de Instagram se controla por separado.</p>
        <label htmlFor="profile-name">Nombre público o alias (puede ser distinto al del correo)</label>
        <input id="profile-name" value={name} onChange={event => setName(event.target.value)} maxLength={40} autoComplete="nickname" disabled={busy} />
        <p className="account-note">Tu nombre puede ser tu alias de Instagram u otro apodo. Se revisan nombres ofensivos y símbolos no permitidos.</p>
        <label htmlFor="profile-instagram">Instagram (opcional)</label>
        <input id="profile-instagram" value={instagram} onChange={event => setInstagram(event.target.value)} maxLength={31} autoComplete="off" placeholder="@tuusuario" disabled={busy} aria-describedby="instagram-help" />
        <p id="instagram-help" className="account-note">Cambiar este campo no vincula Instagram ni verifica su titularidad.</p>
        <label className="danz-privacy-toggle" htmlFor="profile-instagram-public"><input id="profile-instagram-public" type="checkbox" checked={instagramPublic} onChange={event => setInstagramPublic(event.target.checked)} disabled={busy}/><span>Mostrar mi tarjeta de Instagram a otros miembros</span></label>
        <p className="account-note">Desactivado por defecto. Esta preferencia no afecta a tu vinculación ni a DANZPOINTS. La tarjeta pública solo debe mostrarse cuando Instagram esté verificado; tú siempre podrás consultar tu perfil.</p>
        <button className="primary-btn" type="submit" disabled={busy || loadFailed}>{busy ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}</button>
      </form>
  </section>}
</>
}

export default function Account({ focusInstagram = false, onOpenPassport }: { focusInstagram?: boolean; onOpenPassport: () => void }) {
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
  const [showManagement, setShowManagement] = useState(focusInstagram)
  const [showInstagramSettings, setShowInstagramSettings] = useState(focusInstagram)
  const requestedMember = new URLSearchParams(window.location.search).get('miembro')
  const publicMemberId = requestedMember && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedMember) ? requestedMember : null
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
    <h1 className="page-title">{publicMemberId ? <>TARJETA<br /><em>DANZ.</em></> : <>MI<br /><em>TARJETA.</em></>}</h1>
    {authError && <p role="alert" className="account-error">{authError}</p>}
    {!client ? <div className="account-card"><h2>Seguimos preparando las cuentas</h2><p>{configIssue}</p><p>Puedes explorar la app y jugar sin registrarte.</p></div>
      : loading ? <p role="status">Comprobando tu sesión…</p>
      : user && publicMemberId ? <MemberPublicCard client={client} memberId={publicMemberId} />
      : user ? <>
        {error && <p role="alert" className="account-error">{error}</p>}
        <ProfileForm key={user.id} client={client} user={user} onOpenPassport={onOpenPassport} editing={showManagement} onToggleEditing={() => setShowManagement(value => !value)} />
        {showManagement && <section id="danz-account-management" className="danz-account-management" aria-label="Administrar cuenta y ajustes">
          <div className="account-connected-actions">
            <button className="outline-btn" type="button" aria-expanded={showInstagramSettings} aria-controls="account-instagram-settings" onClick={() => setShowInstagramSettings(value => !value)}>{showInstagramSettings ? 'CERRAR VINCULACIÓN DE INSTAGRAM' : 'VINCULAR O REVISAR INSTAGRAM'}</button>
            {showInstagramSettings && <div id="account-instagram-settings"><InstagramLink key={`instagram-${user.id}`} focusOnMount={focusInstagram} /></div>}
          </div>
          <YeppoToggle />
          <RadioUpload />
          <div className="account-session">
            <p>Sesión iniciada como <strong>{user.email ?? 'miembro de DANZ'}</strong></p>
            <button className="outline-btn" type="button" disabled={busy} onClick={() => { void leave() }}>{busy ? 'CERRANDO…' : 'CERRAR SESIÓN'}</button>
          </div>
        </section>}
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
