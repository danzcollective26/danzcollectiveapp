import test from 'node:test'
import assert from 'node:assert/strict'
import QRCode from 'qrcode'
import { createRequire } from 'node:module'
import { makeQrArtHandler, qrInput } from '../server/qrArt.ts'
import { reinforceQrArt, verifyQrPng } from '../server/qrImage.ts'

const content = 'https://danzcollectiveapp.vercel.app/'
const input = { content, prompt: 'Black and white vinyl mosaic' }
const request = (body: unknown = input, token = 'synthetic-token', signal?: AbortSignal) => new Request('https://danz.invalid/api/qr-art', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body), signal,
})

test('QR input accepts public text and rejects private passes, secrets, malformed and oversized content', () => {
  assert.deepEqual(qrInput(input), input)
  assert.equal(qrInput({ ...input, content: content + '#pase=SECRET' }), null)
  assert.equal(qrInput({ ...input, prompt: 'use hf_abcdefghijklmnop secret' }), null)
  assert.equal(qrInput({ ...input, content: '🎵'.repeat(151) }), null)
  assert.equal(qrInput({ ...input, prompt: 'x' }), null)
  assert.equal(qrInput(null), null)
})

test('image verification decodes real QR pixels and checks the exact destination', async () => {
  const png = await QRCode.toBuffer(content, { width: 768, errorCorrectionLevel: 'H', margin: 4 })
  assert.equal(verifyQrPng(png, content), true)
  assert.equal(verifyQrPng(png, 'https://other.invalid'), false)
  assert.equal(verifyQrPng(Buffer.from('<svg/>'), content), false)
  const huge = Buffer.from(png); huge.writeUInt32BE(100000, 16)
  assert.equal(verifyQrPng(huge, content), false)
})

test('generated art can keep its texture while its exact QR grid is made readable', () => {
  const { PNG } = createRequire(import.meta.url)('pngjs')
  const image = { width: 768, height: 768, data: Buffer.alloc(768 * 768 * 4, 255) }
  for (let y = 0; y < 768; y++) for (let x = 0; x < 768; x++) {
    const offset = (y * 768 + x) * 4
    image.data[offset] = (x * 13 + y * 7) % 256
    image.data[offset + 1] = (x * 3 + y * 11) % 256
    image.data[offset + 2] = (x + y * 5) % 256
  }
  const art = PNG.sync.write(image)
  assert.equal(verifyQrPng(art, content), false)
  const repaired = reinforceQrArt(art, content)
  assert.equal(verifyQrPng(repaired, content), true)
  assert.notDeepEqual(repaired, PNG.sync.write({ ...image, data: Buffer.alloc(image.data.length, 255) }))
  const classic = PNG.sync.write(PNG.sync.read(repaired))
  assert.deepEqual(reinforceQrArt(classic, content), classic)
})

test('anonymous requests and admins without the right permission never invoke generation', async () => {
  let generated = false
  const handle = makeQrArtHandler({}, { authorize: async () => false, generate: async () => { generated = true; return Buffer.alloc(0) } })
  assert.equal((await handle(request(input, ''))).status, 401)
  assert.equal((await handle(request())).status, 403)
  assert.equal((await handle(request({ ...input, content: content + '#pase=SECRET' }))).status, 400)
  assert.equal(generated, false)
})

test('a generated image is downloadable only after decoding its requested payload', async () => {
  const bytes = await QRCode.toBuffer(content, { width: 512, margin: 4 })
  const handle = makeQrArtHandler({}, { authorize: async () => true, generate: async () => bytes })
  const response = await handle(request())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const result = await response.json()
  assert.equal(result.verified, true)
  assert.equal(result.content, content)
  assert.equal(result.image, `data:image/png;base64,${bytes.toString('base64')}`)
  const wrong = makeQrArtHandler({}, { authorize: async () => true, generate: async () => QRCode.toBuffer('wrong destination') })
  const failed = await wrong(request())
  assert.equal(failed.status, 422)
  assert.equal((await failed.json()).image, undefined)
})

test('provider errors are sanitized and canceled jobs stop waiting', async () => {
  const handle = makeQrArtHandler({}, { authorize: async () => true, generate: async () => { throw new Error('hf_private-key upstream detail') } })
  const failed = await handle(request())
  assert.equal(failed.status, 503)
  assert.doesNotMatch(await failed.text(), /hf_private|upstream detail/)
  const abort = new AbortController()
  const pending = makeQrArtHandler({}, { authorize: async () => true, generate: async () => { abort.abort(); return new Promise<Buffer>(() => {}) } })
  assert.equal((await pending(request(input, 'synthetic-token', abort.signal))).status, 504)
})

test('server Auth and current permissions enforce MFA before consuming the free Space', async () => {
  let aal = 'aal1', allowed = true, authCalls = 0
  const original = globalThis.fetch
  globalThis.fetch = async (url) => {
    authCalls++
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'synthetic-admin', aud: 'authenticated', email: 'admin@example.invalid' })
    return Response.json([{ is_admin: allowed, permissions: allowed ? ['codes.manage'] : [] }])
  }
  try {
    const env = { VITE_SUPABASE_URL: 'https://danz-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' }
    const bytes = await QRCode.toBuffer(content)
    const handle = makeQrArtHandler(env, { generate: async () => bytes })
    const token = () => `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.synthetic`
    assert.equal((await handle(request(input, token()))).status, 403)
    aal = 'aal2'
    assert.equal((await handle(request(input, token()))).status, 200)
    allowed = false
    assert.equal((await handle(request(input, token()))).status, 403)
    assert.equal(authCalls, 5)
  } finally { globalThis.fetch = original }
})
