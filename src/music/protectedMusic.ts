export type ProtectedMusicId = 'funky' | 'wthimh'
export type MusicGrant = { signedUrl: string; expiresAt: number }
export class MusicAccessError extends Error {
  readonly code: 'signin' | 'unavailable'
  constructor(code: 'signin' | 'unavailable') { super(code); this.code = code }
}
const cache = new Map<string, MusicGrant>()
const paths = { funky: 'funky-fiesta-v1.mp3', wthimh: 'wthimh-v1.mp3' } as const
export function validMusicGrant(value: unknown, id: ProtectedMusicId, origin: string, now = Date.now()): MusicGrant | null {
  if (!value || typeof value !== 'object' || !Object.hasOwn(paths, id)) return null
  const candidate = value as Partial<MusicGrant>
  try {
    const url = new URL(candidate.signedUrl!)
    if (url.protocol !== 'https:' || url.origin !== new URL(origin).origin || url.username || url.password || url.hash ||
        url.pathname !== `/storage/v1/object/sign/danz-music-private/${paths[id]}` || !url.searchParams.get('token') ||
        [...url.searchParams.keys()].some(key => key !== 'token') ||
        !Number.isFinite(candidate.expiresAt) || candidate.expiresAt! <= now || candidate.expiresAt! > now + 130_000) return null
    return { signedUrl: url.href, expiresAt: candidate.expiresAt! }
  } catch { return null }
}
export function cachedMusic(userId: string, track: ProtectedMusicId, now = Date.now()) {
  const grant = cache.get(`${userId}/${track}`)
  // A complete 60-second game, plus time for the next range request.
  return grant && grant.expiresAt > now + 75_000 ? grant.signedUrl : null
}
export function forgetMusicGrants() { cache.clear() }
type Invoke = (name: string, options: { body: { track: ProtectedMusicId }; signal: AbortSignal; timeout: number }) => Promise<{ data: unknown; error: unknown }>
export async function requestMusicGrant(invoke: Invoke, userId: string, track: ProtectedMusicId, origin: string, signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
  const cached = cachedMusic(userId, track)
  if (cached) return cached
  const { data, error } = await invoke('danz-music-playback', { body: { track }, signal, timeout: 10_000 })
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
  if (error) throw new MusicAccessError('unavailable')
  const grant = validMusicGrant(data, track, origin)
  if (!grant) throw new MusicAccessError('unavailable')
  cache.set(`${userId}/${track}`, grant)
  return grant.signedUrl
}
