import assert from 'node:assert/strict'
import { test } from 'node:test'
import { kartHeadHandler, type HeadProvider } from '../supabase/functions/generate-kart-head/handler.ts'

const photo = btoa('face-photo-'.repeat(8))
const output = new Uint8Array(48).fill(7)
function request(body: object, headers: Record<string, string> = {}) {
  return new Request('https://example.invalid/head', {
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic.valid.user.token', Origin: 'https://danzcollectiveapp.vercel.app', ...headers },
    body: JSON.stringify(body),
  })
}

test('the studio stays off and does not forward photos when no provider is configured', async () => {
  let edits = 0
  const provider: HeadProvider = { edit: async () => { edits++; return output } }
  const off = kartHeadHandler({ provider: null, verify: async () => ({ id: 'owner', anonymous: false }) })
  const probe = await off(request({ probe: true }))
  assert.equal(probe.status, 200)
  assert.deepEqual(await probe.json(), { available: false })
  const generated = await off(request({ images: [photo] }))
  assert.equal(generated.status, 200)
  assert.equal((await generated.json()).available, false)
  assert.equal(edits, 0)
  const on = kartHeadHandler({ provider, verify: async () => ({ id: 'owner', anonymous: false }) })
  assert.equal((await on(request({ probe: true }))).status, 200)
  assert.equal((await (await on(request({ probe: true }))).json()).available, true)
})

test('a configured caricature returns only the new image and refuses guests', async () => {
  const seen: number[] = []
  const handler = kartHeadHandler({
    provider: { edit: async images => { seen.push(images.length); return output } },
    verify: async () => ({ id: 'owner', anonymous: false }),
  })
  const guest = kartHeadHandler({
    provider: { edit: async () => { seen.push(99); return output } },
    verify: async () => ({ id: 'guest', anonymous: true }),
  })
  assert.equal((await guest(request({ images: [photo] }))).status, 401)
  assert.equal((await handler(request({ images: [photo] }, { Authorization: '' }))).status, 401)
  const response = await handler(request({ images: [photo, photo] }))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store, private')
  const body = await response.text()
  assert.equal(body.includes(photo), false)
  assert.match(body, /"available":true/)
  assert.match(body, /data:image\/png;base64,/)
  assert.deepEqual(seen, [2])
  assert.equal((await handler(request({ images: [photo, photo, photo, photo] }))).status, 400)
})

test('bad origin, method and oversized bodies never reach the provider', async () => {
  let edits = 0
  const handler = kartHeadHandler({ provider: { edit: async () => { edits++; return output } }, verify: async () => { throw new Error('secret token') } })
  assert.equal((await handler(request({ images: [photo] }, { Origin: 'https://other.example' }))).status, 403)
  assert.equal((await handler(new Request('https://example.invalid/head', { method: 'GET' }))).status, 405)
  assert.equal((await handler(request({ images: [photo] }, { 'content-length': '99999999' }))).status, 413)
  const failed = await handler(request({ images: [photo] }))
  assert.equal(failed.status, 503)
  assert.equal((await failed.text()).includes('secret token'), false)
  assert.equal(edits, 0)
})
