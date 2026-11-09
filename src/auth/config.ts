export type ClientConfiguration = { url: string; key: string }

export function clientConfiguration(url: unknown, key: unknown, allowLocalhost = false): { config: ClientConfiguration | null; issue: string | null } {
  if (typeof url !== 'string' || typeof key !== 'string' || !url.trim() || !key.trim()) {
    return { config: null, issue: 'La conexión de las cuentas todavía no está disponible en esta versión.' }
  }
  try {
    const parsed = new URL(url.trim())
    const localhost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    const validHost = /^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname)
    if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) throw new Error('url')
    if (!(parsed.protocol === 'https:' && validHost) && !(allowLocalhost && localhost && ['http:', 'https:'].includes(parsed.protocol))) throw new Error('url')
    const candidate = key.trim()
    let publicKey = /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(candidate)
    if (!publicKey && candidate.split('.').length === 3) {
      const payload = candidate.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))) as { role?: string }
      publicKey = claims.role === 'anon'
    }
    if (!publicKey) throw new Error('key')
    return { config: { url: parsed.origin, key: candidate }, issue: null }
  } catch {
    return { config: null, issue: 'La conexión de las cuentas necesita revisarse. Puedes seguir explorando y jugando.' }
  }
}

/** Auth errors are rendered from known codes, never from callback descriptions. */
export function authErrorMessage(error: unknown): string {
  const value = error as { code?: string; status?: number; name?: string } | null
  if (value?.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(value?.code ?? '')) {
    return 'Has hecho varios intentos seguidos. Espera antes de volver a intentarlo.'
  }
  if (['bad_code_verifier', 'pkce_verifier_not_found'].includes(value?.code ?? '') || value?.name === 'AuthPKCECodeVerifierMissingError') {
    return 'Este enlace necesita el navegador donde solicitaste el correo. Abre la app allí y solicita uno nuevo, o utiliza el código si tu correo lo incluye.'
  }
  if (['otp_expired', 'flow_state_expired', 'flow_state_not_found'].includes(value?.code ?? '')) {
    return 'El enlace o código ha caducado o ya se ha utilizado. Solicita un correo nuevo.'
  }
  if (value?.code === 'invalid_email_callback') return 'El enlace de acceso no es válido. Solicita un correo nuevo o utiliza su código de acceso.'
  if (value?.code === 'signup_disabled') return 'El registro de cuentas todavía no está habilitado.'
  if (['email_address_not_authorized', 'email_address_invalid'].includes(value?.code ?? '')) return 'No se puede utilizar ese correo ahora. Revisa la dirección o inténtalo más tarde.'
  if (value?.code === 'email_provider_disabled') return 'El acceso por correo todavía no está habilitado.'
  if (value?.status && value.status >= 500) return 'El servicio no está disponible ahora. Inténtalo de nuevo más tarde.'
  return 'No se ha podido completar la operación. Comprueba la conexión y vuelve a intentarlo.'
}

/** Capture a one-use email credential before Auth initialization.
 * The provider verifies it; the URL never grants a session by itself. */
export function consumeEmailCallback(currentUrl: string): { url: string; present: boolean; tokenHash: string | null; issue: string | null } {
  const url = new URL(currentUrl)
  const fragment = new URLSearchParams(url.hash.slice(1))
  if (!url.searchParams.has('token_hash') && !fragment.has('token_hash')) return { url: currentUrl, present: false, tokenHash: null, issue: null }
  const hashes = url.searchParams.getAll('token_hash')
  const types = url.searchParams.getAll('type')
  const mixed = fragment.has('token_hash') || url.searchParams.has('code') || fragment.has('access_token') || fragment.has('refresh_token')
  const valid = !mixed && hashes.length === 1 && /^[A-Za-z0-9_-]{20,512}$/.test(hashes[0]) && types.length === 1 && types[0] === 'email'
  for (const params of [url.searchParams, fragment]) {
    for (const key of ['token_hash', 'type', 'code', 'access_token', 'refresh_token', 'token_type', 'expires_at', 'expires_in', 'sb_flow_id', '__sb_flow_id']) params.delete(key)
  }
  url.hash = fragment.toString()
  return { url: url.href, present: true, tokenHash: valid ? hashes[0] : null, issue: valid ? null : 'El enlace de acceso no es válido. Solicita un correo nuevo o utiliza su código de acceso.' }
}

/** Remove untrusted Auth error parameters without retaining or displaying them. */
export function consumeCallbackError(currentUrl: string): { url: string; message: string | null } {
  const url = new URL(currentUrl)
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const query = url.searchParams
  const hasError = query.has('error') || query.has('error_code') || hash.has('error') || hash.has('error_code')
  if (!hasError) return { url: currentUrl, message: null }
  const code = query.get('error_code') || hash.get('error_code')
  for (const params of [query, hash]) {
    for (const key of ['error', 'error_code', 'error_description', 'code', 'token_hash', 'access_token', 'refresh_token', 'token_type', 'expires_in', 'expires_at']) params.delete(key)
  }
  url.hash = hash.toString()
  return { url: url.toString(), message: authErrorMessage({ code: code || 'callback_error' }) }
}

/** Run only after Supabase initialization finishes, never before exchanging PKCE. */
export function consumeCompletedCallback(currentUrl: string): { url: string; message: string | null } {
  const url = new URL(currentUrl)
  const residualCode = url.searchParams.has('code')
  if (!residualCode && !url.searchParams.has('sb_flow_id') && !url.searchParams.has('__sb_flow_id')) return { url: currentUrl, message: null }
  url.searchParams.delete('code')
  url.searchParams.delete('sb_flow_id')
  url.searchParams.delete('__sb_flow_id')
  return { url: url.toString(), message: residualCode ? authErrorMessage({ code: 'pkce_verifier_not_found' }) : null }
}
