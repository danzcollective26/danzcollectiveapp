export const PENDING_PASS_KEY = 'danz-pending-event-pass'
export const PENDING_PASSES_KEY = 'danz-pending-event-passes-v2'
export const PASS_CHANGE_EVENT = 'danz-pending-passes-change'
const MAX_PENDING_PASSES = 100

/** Leave time to claim photos after the event, rather than expire at the door. */
export function suggestedPassExpiry(eventDate: string | null, now = Date.now()): string {
  const eventTime = eventDate ? Date.parse(eventDate) : NaN
  return new Date(Math.max(now, Number.isFinite(eventTime) ? eventTime : now) + 14 * 86_400_000).toISOString()
}

export function normalizeEventCode(value: string): string | null {
  if (value.length > 256) return null
  const normalized = value.replace(/[\s-]/g, '').toUpperCase()
  return /^[A-Z0-9]{12,64}$/.test(normalized) ? normalized : null
}

export function readPendingPass(): string | null {
  return readPendingPasses().at(-1) ?? null
}

/** The legacy single-pass value is migrated on the first successful write. */
export function readPendingPasses(): string[] {
  try {
    const stored = localStorage.getItem(PENDING_PASSES_KEY)
    if (stored !== null) {
      const values: unknown = JSON.parse(stored)
      if (!Array.isArray(values)) return []
      return [...new Set(values.flatMap(value => typeof value === 'string' && normalizeEventCode(value) ? [normalizeEventCode(value)!] : []))].slice(0, MAX_PENDING_PASSES)
    }
    const legacy = normalizeEventCode(localStorage.getItem(PENDING_PASS_KEY) ?? '')
    return legacy ? [legacy] : []
  } catch { return [] }
}

function writePendingPasses(codes: string[]): boolean {
  try {
    const value = JSON.stringify(codes)
    localStorage.setItem(PENDING_PASSES_KEY, value)
    if (localStorage.getItem(PENDING_PASSES_KEY) !== value) return false
    // Keep older open tabs compatible. The queue remains authoritative.
    try {
      if (codes.length) localStorage.setItem(PENDING_PASS_KEY, codes.at(-1)!)
      else localStorage.removeItem(PENDING_PASS_KEY)
    } catch { /* The verified queue is enough to retain the passes. */ }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(PASS_CHANGE_EVENT))
    return true
  } catch { return false }
}

export function savePendingPass(code: string): boolean {
  const normalized = normalizeEventCode(code)
  if (!normalized) return false
  const previous = readPendingPasses()
  if (!previous.includes(normalized) && previous.length >= MAX_PENDING_PASSES) return false
  return writePendingPasses([...previous.filter(value => value !== normalized), normalized])
}

export function clearPendingPass(code: string): boolean {
  // Re-read before writing: a late redemption cannot delete a newer QR.
  return writePendingPasses(readPendingPasses().filter(value => value !== code))
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
  if (incoming.url !== window.location.href && (!incoming.code || saved)) {
    try { window.history.replaceState(window.history.state, '', incoming.url) } catch { /* Saving the pass must still work in a restricted browser view. */ }
  }
  return { code: incoming.code ?? readPendingPass(), invalid: incoming.invalid, saved }
}
