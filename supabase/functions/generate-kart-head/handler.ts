const ORIGINS = new Set(['https://danzcollectiveapp.vercel.app', 'http://127.0.0.1:4173', 'http://127.0.0.1:4175', 'http://localhost:5173'])
const MAX_BODY = 6_000_000
const MAX_IMAGE = 1_400_000
export const CARICATURE_PROMPT = 'Caricatura cabezona reconocible, estilo arcade DANZPORTER: tinta gruesa, cel shading, paleta petróleo marfil oro lima y coral. Ojos un poco más grandes. Sin texto y sin fondo.'

export type HeadProvider = { edit: (images: Uint8Array[], prompt: string) => Promise<Uint8Array | null> }
type Services = { provider: HeadProvider | null; verify: (token: string) => Promise<{ id: string; anonymous: boolean } | null> }

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}
function decodeImage(value: string): Uint8Array | null {
  const payload = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
  if (!/^[A-Za-z0-9+/=\s]+$/.test(payload) || payload.length > MAX_IMAGE * 2) return null
  try {
    const binary = atob(payload.replace(/\s/g, ''))
    if (binary.length < 32 || binary.length > MAX_IMAGE) return null
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch { return null }
}

/** Provider-agnostic caricature. Unconfigured calls stop before any upstream request. */
export function kartHeadHandler(services: Services) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store, private', 'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
    if (origin && ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers })
    if (origin && !ORIGINS.has(origin)) return reply(403, { available: false, code: 'origin_denied' })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return reply(405, { available: false, code: 'method_denied' })
    if (Number(request.headers.get('content-length')) > MAX_BODY) return reply(413, { available: false, code: 'too_large' })
    let payload: unknown
    try {
      const text = await request.text()
      if (text.length > MAX_BODY) return reply(413, { available: false, code: 'too_large' })
      payload = JSON.parse(text)
    } catch { return reply(400, { available: false, code: 'invalid_request' }) }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return reply(400, { available: false, code: 'invalid_request' })
    const body = payload as { probe?: unknown; images?: unknown }
    if (body.probe === true && body.images === undefined) return reply(200, { available: services.provider !== null })
    const token = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token) return reply(401, { available: false, code: 'signin_required' })
    if (!Array.isArray(body.images) || body.images.length < 1 || body.images.length > 3 || body.images.some(image => typeof image !== 'string')) return reply(400, { available: false, code: 'invalid_images' })
    const images: Uint8Array[] = []
    for (const image of body.images) {
      const bytes = decodeImage(image)
      if (!bytes) return reply(400, { available: false, code: 'invalid_images' })
      images.push(bytes)
    }
    try {
      const user = await services.verify(token)
      if (!user?.id || user.anonymous) return reply(401, { available: false, code: 'signin_required' })
      if (!services.provider) return reply(200, { available: false, reason: 'unconfigured' })
      const edited = await services.provider.edit(images, CARICATURE_PROMPT)
      if (!edited || edited.length < 32 || edited.length > MAX_IMAGE) return reply(503, { available: false, code: 'studio_unavailable' })
      return reply(200, { available: true, image: `data:image/png;base64,${bytesToBase64(edited)}` })
    } catch { return reply(503, { available: false, code: 'studio_unavailable' }) }
  }
}
