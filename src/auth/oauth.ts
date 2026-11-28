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

/** Production origin for links opened from email, old demos or unknown hosts. */
export const DANZ_CANONICAL_ORIGIN = 'https://danzcollectiveapp.vercel.app'

/** Vercel previews that belong to this DANZ project (deployment and branch URLs). */
const DANZ_PREVIEW_HOSTS = new Set(['danzcollectiveapp-preview.vercel.app'])
const DANZ_PREVIEW_PATTERN = /^danzcollectiveapp-[a-z0-9-]+-danzcollectiveapp-5608\.vercel\.app$/

export function isDanzPreviewHost(hostname: string): boolean {
  return DANZ_PREVIEW_HOSTS.has(hostname) || DANZ_PREVIEW_PATTERN.test(hostname)
}

/** Return login to the same DANZ preview so Android does not hand the link to the
 * installed production PWA (issue #67) and the PKCE verifier stays on this origin.
 * Supabase still enforces its Redirect URL allow-list; a preview that is not listed
 * falls back to the Site URL, which is the previous behaviour. */
export function danzAuthOrigin(origin: string): string {
  const url = new URL(origin)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return url.origin
  if (url.protocol === 'https:' && isDanzPreviewHost(url.hostname)) return url.origin
  return DANZ_CANONICAL_ORIGIN
}
