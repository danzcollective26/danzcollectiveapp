import { normalizeEventCode } from '../events/pass.ts'

export type SocialProvider = 'google' | 'apple'

/** Only advertise providers the Auth server explicitly enables. */
export function availableSocialProviders(value: unknown): SocialProvider[] {
  if (!value || typeof value !== 'object') return []
  const external = (value as { external?: unknown }).external
  if (!external || typeof external !== 'object' || Array.isArray(external)) return []
  const flags = external as Record<string, unknown>
  return (['google', 'apple'] as const).filter(provider => flags[provider] === true)
}

/** Move login to the browser before creating its PKCE verifier. Keep a pending
 * event pass in the fragment, never in the Auth redirect or network query. */
export function accountBrowserUrl(origin: string, pendingPass: string | null): string {
  const url = new URL('/?seccion=cuenta', origin)
  const code = pendingPass ? normalizeEventCode(pendingPass) : null
  if (code) url.hash = new URLSearchParams({ pase: code }).toString()
  return url.href
}
