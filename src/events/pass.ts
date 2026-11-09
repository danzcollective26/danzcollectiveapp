export const PENDING_PASS_KEY = 'danz-pending-event-pass'

export function normalizeEventCode(value: string): string | null {
  if (value.length > 256) return null
  const normalized = value.replace(/[\s-]/g, '').toUpperCase()
  return /^[A-Z0-9]{12,64}$/.test(normalized) ? normalized : null
}

export function readPendingPass(): string | null {
  try { return normalizeEventCode(localStorage.getItem(PENDING_PASS_KEY) ?? '') } catch { return null }
}

export function savePendingPass(code: string): boolean {
  const normalized = normalizeEventCode(code)
  if (!normalized) return false
  try {
    localStorage.setItem(PENDING_PASS_KEY, normalized)
    return localStorage.getItem(PENDING_PASS_KEY) === normalized
  } catch { return false }
}

export function clearPendingPass(code: string) {
  try {
    // A late redemption must not delete a newer pass scanned in another tab.
    if (localStorage.getItem(PENDING_PASS_KEY) === code) localStorage.removeItem(PENDING_PASS_KEY)
  } catch { /* A stored code never grants access by itself. */ }
}

/** Event QR links use #pase=..., distinct from Supabase's ?code=... callback. */
export function consumePassUrl(href: string): { url: string; code: string | null; invalid: boolean } {
  const url = new URL(href)
  const fragment = new URLSearchParams(url.hash.slice(1))
  if (!fragment.has('pase')) return { url: href, code: null, invalid: false }
  const values = fragment.getAll('pase')
  const code = values.length === 1 ? normalizeEventCode(values[0]) : null
  fragment.delete('pase')
  url.hash = fragment.toString()
  return { url: url.href, code, invalid: !code }
}

export function captureLaunchPass() {
  const incoming = consumePassUrl(window.location.href)
  let saved = true
  if (incoming.code) saved = savePendingPass(incoming.code)
  if (incoming.url !== window.location.href) window.history.replaceState(window.history.state, '', incoming.url)
  return { code: incoming.code ?? readPendingPass(), invalid: incoming.invalid, saved }
}
