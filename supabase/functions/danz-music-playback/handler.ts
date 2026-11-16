export const MUSIC_BUCKET = 'danz-music-private'
export const MUSIC_TTL_SECONDS = 120
const FILES = { funky: 'funky-fiesta-v1.mp3', wthimh: 'wthimh-v1.mp3' } as const
const ORIGINS = new Set(['https://danzcollectiveapp.vercel.app', 'http://127.0.0.1:4173', 'http://127.0.0.1:4175', 'http://localhost:5173'])
type MusicServices = {
  verify: (token: string) => Promise<{ id: string; anonymous: boolean } | null>
  sign: (path: string, seconds: number) => Promise<string | null>
  now?: () => number
}

/** Only the server chooses a file and lifetime; clients cannot read the bucket. */
export function musicPlaybackHandler(services: MusicServices) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store, private', 'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
    if (origin && ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers })
    if (origin && !ORIGINS.has(origin)) return reply(403, { code: 'origin_denied' })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return reply(405, { code: 'method_denied' })
    const token = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token) return reply(401, { code: 'signin_required' })
    if (Number(request.headers.get('content-length')) > 256) return reply(413, { code: 'invalid_request' })
    let track: keyof typeof FILES
    try {
      const text = await request.text()
      if (text.length > 256) return reply(413, { code: 'invalid_request' })
      const body = JSON.parse(text)
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(FILES, body.track)) return reply(400, { code: 'invalid_track' })
      track = body.track
    } catch { return reply(400, { code: 'invalid_request' }) }
    try {
      const user = await services.verify(token)
      if (!user?.id || user.anonymous) return reply(401, { code: 'signin_required' })
      const signedUrl = await services.sign(FILES[track], MUSIC_TTL_SECONDS)
      if (!signedUrl) return reply(503, { code: 'music_unavailable' })
      return reply(200, { signedUrl, expiresAt: (services.now?.() ?? Date.now()) + MUSIC_TTL_SECONDS * 1000 })
    } catch { return reply(503, { code: 'music_unavailable' }) }
  }
}
