import { createClient } from '@supabase/supabase-js'
import { Client } from '@gradio/client'
import { MAX_IMAGE_BYTES, reinforceQrArt, verifyQrPng } from './qrImage.ts'

export const DEFAULT_QR_SPACE = 'huggingface-projects/QR-code-AI-art-generator'
type Input = { content: string; prompt: string }
type Env = Record<string, string | undefined>
type Dependencies = {
  authorize: (token: string, signal: AbortSignal) => Promise<boolean>
  generate: (input: Input, signal: AbortSignal) => Promise<Buffer>
  verify: (bytes: Buffer, content: string) => boolean
}
class QrError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})

export function qrInput(value: unknown): Input | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  if (typeof input.content !== 'string' || typeof input.prompt !== 'string') return null
  const content = input.content.trim(), prompt = input.prompt.trim()
  if (!content || Buffer.byteLength(content) > 600 || prompt.length < 3 || prompt.length > 700) return null
  // These belong to the local pass generator, never an external art service.
  if (/(?:[#?&](?:pase|access_token|refresh_token|token_hash|code)=)|\bhf_[a-zA-Z0-9]{10,}|\bsb_secret_/i.test(content + ' ' + prompt)) return null
  return { content, prompt }
}

function dependencies(env: Env): Dependencies {
  return {
    async authorize(token, signal) {
      const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
      const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
      if (!url || !key) throw new QrError(503, 'No se ha configurado el acceso al generador. El QR clásico sigue disponible.')
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${token}` }, fetch: (input, init) => fetch(input, { ...init, signal }) },
      })
      const { data: identity, error } = await client.auth.getUser(token)
      if (error || !identity.user) return false
      // Decode only AFTER Auth has verified this exact signed access token.
      let aal: string | undefined
      try { aal = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).aal } catch { return false }
      if (aal !== 'aal2') return false
      const context = await client.rpc('danz_admin_context').abortSignal(signal)
      return !context.error && context.data?.[0]?.is_admin === true && context.data[0].permissions?.includes('codes.manage') === true
    },
    async generate(input, signal) {
      const space = env.HF_QR_SPACE || DEFAULT_QR_SPACE
      const endpoint = env.HF_QR_ENDPOINT || '/inference'
      if (!/^[\w.-]+\/[\w.-]+$/.test(space) || !/^\/[\w/-]+$/.test(endpoint)) throw new QrError(503, 'Revisa la configuración del generador de QR.')
      const token = env.HF_TOKEN?.trim()
      const app = await Client.connect(space, { ...(token ? { token: token as `hf_${string}` } : {}), events: ['data', 'status'] })
      const job = app.submit(endpoint, {
        qr_code_content: input.content, prompt: input.prompt,
        negative_prompt: 'blurry, low contrast, distorted, illegible, text, watermark, nsfw',
        guidance_scale: 7.5, controlnet_conditioning_scale: 2, strength: 0.8,
        seed: -1, init_image: null, qrcode_image: null, use_qr_code_as_init_image: true, sampler: 'DPM++ Karras SDE',
      })
      const cancel = () => { void job.cancel() }
      signal.addEventListener('abort', cancel, { once: true })
      try {
        signal.throwIfAborted()
        for await (const event of job) {
          signal.throwIfAborted()
          if (event.type === 'status' && event.stage === 'error') throw new QrError(503, 'Hugging Face no ha podido generar el diseño. Puede haber cola o haberse agotado la cuota gratuita.')
          if (event.type !== 'data') continue
          const file = (event.data as { url?: string }[])?.[0]
          if (!file?.url) throw new QrError(502, 'El generador no ha devuelto una imagen válida.')
          const url = new URL(file.url)
          const expected = `${space.replaceAll('/', '-').replaceAll('_', '-').toLowerCase()}.hf.space`
          if (url.protocol !== 'https:' || url.hostname !== expected || url.port || url.username || url.password) throw new QrError(502, 'El generador ha devuelto una imagen no válida.')
          const response = await fetch(url, { signal, redirect: 'error', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) })
          if (!response.ok || !response.body || Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new QrError(502, 'No se ha podido recuperar la imagen generada.')
          const reader = response.body.getReader(), chunks: Uint8Array[] = []
          let size = 0
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              size += value.byteLength
              if (size > MAX_IMAGE_BYTES) throw new QrError(502, 'La imagen generada es demasiado grande.')
              chunks.push(value)
            }
          } finally { await reader.cancel().catch(() => {}) }
          return reinforceQrArt(Buffer.concat(chunks), input.content)
        }
        throw new QrError(502, 'El generador terminó sin devolver una imagen.')
      } finally { signal.removeEventListener('abort', cancel); app.close() }
    },
    verify: verifyQrPng,
  }
}

/** Public transport; generation itself requires a verified codes admin with MFA. */
export function makeQrArtHandler(env: Env = process.env, overrides: Partial<Dependencies> = {}) {
  const deps = { ...dependencies(env), ...overrides }
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })
    const token = request.headers.get('authorization')?.match(/^Bearer ([\w.-]+)$/i)?.[1]
    if (!token) return json({ error: 'Inicia sesión con tu cuenta de administración.' }, 401)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Formato de solicitud no válido.' }, 415)
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(125_000)])
    try {
      if (Number(request.headers.get('content-length')) > 9000) return json({ error: 'La solicitud es demasiado larga.' }, 413)
      const body = await request.text()
      if (Buffer.byteLength(body) > 9000) return json({ error: 'La solicitud es demasiado larga.' }, 413)
      let input: Input | null
      try { input = qrInput(JSON.parse(body)) } catch { return json({ error: 'Revisa el contenido y el estilo del QR.' }, 400) }
      if (!input) return json({ error: 'Introduce un enlace público o texto de hasta 600 bytes y un estilo de 3 a 700 caracteres. Los pases privados se generan en Códigos y QR.' }, 400)
      if (!await deps.authorize(token, signal)) return json({ error: 'Necesitas permisos de códigos y verificación en dos pasos.' }, 403)
      // Race the full job so an upstream queue can never hold the request forever.
      let aborted: (() => void) | undefined
      const timeout = new Promise<never>((_, reject) => {
        aborted = () => reject(new QrError(504, 'Se ha agotado la espera gratuita. Puedes reintentar o usar el QR clásico.'))
        if (signal.aborted) aborted()
        else signal.addEventListener('abort', aborted, { once: true })
      })
      let image: Buffer
      try { image = await Promise.race([deps.generate(input, signal), timeout]) }
      finally { if (aborted) signal.removeEventListener('abort', aborted) }
      if (!deps.verify(image, input.content)) return json({ error: 'El diseño no se lee con suficiente fiabilidad. Prueba otro estilo o usa el QR clásico.' }, 422)
      return json({ image: `data:image/png;base64,${image.toString('base64')}`, content: input.content, verified: true })
    } catch (error) {
      if (signal.aborted) return json({ error: 'La generación se ha interrumpido o ha superado el tiempo de espera. Puedes usar el QR clásico.' }, 504)
      if (error instanceof QrError) return json({ error: error.message }, error.status)
      console.error('qr-art: upstream generation unavailable')
      return json({ error: 'Hugging Face no está disponible ahora. Prueba más tarde o crea el QR clásico.' }, 503)
    }
  }
}
