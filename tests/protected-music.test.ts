import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { cachedMusic, forgetMusicGrants, requestMusicGrant, validMusicGrant } from '../src/music/protectedMusic.ts'
import { MUSIC_TTL_SECONDS, musicPlaybackHandler } from '../supabase/functions/danz-music-playback/handler.ts'

const origin = 'https://danz-test.supabase.co', now = 1_800_000_000_000
const grant = (track = 'funky', time = now) => ({ signedUrl: `${origin}/storage/v1/object/sign/danz-music-private/${track === 'funky' ? 'funky-fiesta-v1.mp3' : 'wthimh-v1.mp3'}?token=synthetic`, expiresAt: time + 120000 })
function request(body: object = { track: 'funky' }, headers: Record<string, string> = {}) {
  return new Request('https://example.invalid/play', { method: 'POST', headers: { Authorization: 'Bearer synthetic.valid.user.token', Origin: 'https://danzcollectiveapp.vercel.app', ...headers }, body: JSON.stringify(body) })
}
test('playback requires a validated non-anonymous user and never signs for missing, invalid or anonymous identity', async () => {
  let signed = 0
  for (const identity of [null, { id: 'guest', anonymous: true }]) {
    const handler = musicPlaybackHandler({ verify: async () => identity, sign: async () => { signed++; return grant().signedUrl } })
    assert.equal((await handler(request())).status, 401)
  }
  const handler = musicPlaybackHandler({ verify: async () => ({ id: 'real', anonymous: false }), sign: async () => { signed++; return grant().signedUrl } })
  assert.equal((await handler(request(undefined, { Authorization: '' }))).status, 401)
  assert.equal(signed, 0)
})
test('only the two fixed tracks can be signed; clients cannot change path, bucket or lifetime', async () => {
  const calls: unknown[] = []
  const handler = musicPlaybackHandler({ verify: async () => ({ id: 'user', anonymous: false }), sign: async (...args) => { calls.push(args); return grant().signedUrl }, now: () => now })
  for (const body of [{ track: '../secret.mp3' }, { track: 'funky', expiresIn: 999999 }, { track: 'wthimh', bucket: 'danz-event-photos' }, { track: 'toString' }]) assert.equal((await handler(request(body))).status, 400)
  for (const track of ['funky', 'wthimh']) {
    const response = await handler(request({ track }))
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store, private')
    assert.equal((await response.json()).expiresAt, now + MUSIC_TTL_SECONDS * 1000)
  }
  assert.deepEqual(calls, [['funky-fiesta-v1.mp3', 120], ['wthimh-v1.mp3', 120]])
})
test('origin, method, payload size and unexpected server failures are handled without exposing details', async () => {
  const handler = musicPlaybackHandler({ verify: async () => { throw Error('private token details') }, sign: async () => null })
  assert.equal((await handler(request(undefined, { Origin: 'https://other.example' }))).status, 403)
  assert.equal((await handler(new Request('https://example.invalid', { method: 'GET' }))).status, 405)
  assert.equal((await handler(request({ track: 'x'.repeat(300) }))).status, 413)
  const response = await handler(request())
  assert.equal(response.status, 503); assert.equal((await response.text()).includes('private token'), false)
  const preflight = await handler(new Request('https://example.invalid', { method: 'OPTIONS', headers: { Origin: 'https://danzcollectiveapp.vercel.app' } }))
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://danzcollectiveapp.vercel.app')
})
test('the client rejects public, cross-project, expired, long-lived and download-mode grants', () => {
  assert.ok(validMusicGrant(grant(), 'funky', origin, now))
  for (const candidate of [
    { ...grant(), signedUrl: grant().signedUrl.replace('danz-test', 'other-project') },
    { ...grant(), signedUrl: grant().signedUrl.replace('/object/sign/', '/object/public/') },
    { ...grant(), signedUrl: grant().signedUrl + '&download=true' },
    { ...grant(), expiresAt: now - 1 }, { ...grant(), expiresAt: now + 3600000 },
    { ...grant(), signedUrl: 'data:audio/mpeg,anything' }, grant('wthimh'),
  ]) assert.equal(validMusicGrant(candidate, 'funky', origin, now), null)
})
test('grants stay in memory, do not cross users and cancelled requests never populate the cache', async () => {
  forgetMusicGrants()
  const controller = new AbortController(), invoke = async () => ({ data: grant('funky', Date.now()), error: null })
  await requestMusicGrant(invoke, 'user-a', 'funky', origin, controller.signal)
  assert.ok(cachedMusic('user-a', 'funky')); assert.equal(cachedMusic('user-b', 'funky'), null)
  assert.equal(cachedMusic('user-a', 'funky', Date.now() + 50000), null)
  const cancelled = new AbortController()
  await assert.rejects(requestMusicGrant(async () => { cancelled.abort(); return invoke() }, 'user-b', 'funky', origin, cancelled.signal), { name: 'AbortError' })
  assert.equal(cachedMusic('user-b', 'funky'), null)
  forgetMusicGrants(); assert.equal(cachedMusic('user-a', 'funky'), null)
})
test('neither owner audio files nor static public song sources enter Git or the offline shell', () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
  assert.equal(tracked.some(path => /\.(?:mp3|wav|flac|m4a|aac)$/i.test(path)), false)
  const catalog = readFileSync('src/arcade/grooveMusic.ts', 'utf8')
  assert.equal(catalog.includes("src: '/music/"), false)
  const worker = readFileSync('scripts/build-service-worker.mjs', 'utf8')
  assert.equal(worker.includes('danz-music-private'), false)
})
