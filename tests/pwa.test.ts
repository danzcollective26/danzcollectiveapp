import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const origin = 'https://danz.example'
const prefix = 'danz-shell-v1-'
const paths = ['/index.html', '/assets/app-123.js', '/assets/app-123.css', '/manifest.webmanifest', '/icons/danz-192.png', '/arcade/faces/synthetic.jpg', '/arcade/faces/synthetic.webp']
const source = await readFile(new URL('../scripts/service-worker.js', import.meta.url), 'utf8')

function worker() {
  const handlers = new Map<string, (event: any) => void>()
  const buckets = new Map<string, Map<string, Response>>()
  const state = { offline: false, gate: false, canonicalIndex: false, skipped: 0, claimed: 0, fetched: [] as string[] }
  const key = (value: any) => new URL(typeof value === 'string' || value instanceof URL ? value : value.url, origin).pathname
  const caches = {
    keys: async () => [...buckets.keys()],
    delete: async (name: string) => buckets.delete(name),
    open: async (name: string) => {
      if (!buckets.has(name)) buckets.set(name, new Map())
      const store = buckets.get(name)!
      return { put: async (path: any, response: Response) => { store.set(key(path), response.clone()) }, match: async (path: any) => store.get(key(path))?.clone() }
    },
  }
  const fetch = async (value: any) => {
    const url = new URL(typeof value === 'string' || value instanceof URL ? value : value.url, origin)
    state.fetched.push(url.href)
    if (state.offline) throw new Error('Offline')
    const path = url.pathname
    if (state.canonicalIndex && path === '/index.html') throw new TypeError('Redirect rejected by redirect: error')
    const html = path === '/' || path === '/index.html'
    const body = state.gate ? '<html>Sign in with ChatGPT</html>' : html ? '<meta name="danz-shell" content="1"><div>DANZ</div>' : 'static asset'
    const mime = state.gate || html ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.png') ? 'image/png' : path.endsWith('.jpg') ? 'image/jpeg' : path.endsWith('.webp') ? 'image/webp' : 'application/manifest+json'
    const response = new Response(body, { headers: { 'content-type': mime } })
    Object.defineProperty(response, 'url', { value: url.href })
    return response
  }
  runInNewContext(source, {
    BUILD: { version: 'current', paths }, caches, fetch, URL, Response,
    self: { location: { origin }, addEventListener: (name: string, fn: any) => handlers.set(name, fn), skipWaiting: async () => { state.skipped++ }, clients: { claim: async () => { state.claimed++ } } },
  })
  const lifetime = async (type: string, data?: any) => {
    const work: Promise<unknown>[] = []
    handlers.get(type)!({ data, waitUntil: (p: Promise<unknown>) => work.push(p) })
    await Promise.all(work)
  }
  const request = (url: string, mode = 'cors', method = 'GET') => {
    let response: Promise<Response> | null = null
    handlers.get('fetch')!({ request: { url: new URL(url, origin).href, mode, method }, respondWith: (r: Promise<Response>) => { response = r } })
    return response
  }
  return { state, buckets, lifetime, request }
}

test('install saves only the explicit application shell and does not activate updates automatically', async () => {
  const w = worker(); await w.lifetime('install')
  assert.deepEqual([...w.buckets.get(prefix + 'current')!.keys()].sort(), [...paths].sort())
  assert.equal(w.state.skipped, 0)
  await w.lifetime('message', { type: 'unrelated' }); assert.equal(w.state.skipped, 0)
  await w.lifetime('message', { type: 'DANZ_ACTIVATE_UPDATE' }); assert.equal(w.state.skipped, 1)
})

test('hosting sign-in pages cannot be installed as an offline app shell', async () => {
  const w = worker(); w.state.gate = true
  await assert.rejects(() => w.lifetime('install'))
  assert.equal(w.buckets.size, 0)
})

test('a host redirecting index.html to the canonical home still installs the complete offline shell', async () => {
  const w = worker(); w.state.canonicalIndex = true
  await w.lifetime('install')
  assert.ok(w.state.fetched.includes(`${origin}/`))
  assert.ok(!w.state.fetched.includes(`${origin}/index.html`))
  assert.match(await w.buckets.get(prefix + 'current')!.get('/index.html')!.clone().text(), /danz-shell/)
  w.state.offline = true
  assert.match(await (await w.request('/', 'navigate')!).text(), /danz-shell/)
})

test('auth callbacks, signed photos, APIs, backups and non-GET requests bypass offline handling', () => {
  const w = worker()
  for (const path of ['/?code=synthetic', '/?token_hash=synthetic&type=email', '/?pase=synthetic', '/assets/app-123.js?token=synthetic', '/signin-with-chatgpt', '/backup-galerias.html', '/private-photo.jpg', '/storage/v1/object/sign/private.jpg?token=synthetic', 'https://danz-test.supabase.co/auth/v1/user', 'https://danz-test.supabase.co/rest/v1/danz_photos', 'https://danz-test.supabase.co/storage/v1/object/sign/private.jpg?token=synthetic']) {
    assert.equal(w.request(path, 'navigate'), null, path)
  }
  assert.equal(w.request('/assets/app-123.js', 'cors', 'POST'), null)
  assert.equal(w.buckets.size, 0)
})

test('offline reloads can open the static app; online navigations still enforce the hosting gate', async () => {
  const w = worker(); await w.lifetime('install')
  w.state.gate = true
  assert.match(await (await w.request('/', 'navigate')!).text(), /Sign in with ChatGPT/)
  w.state.offline = true
  assert.match(await (await w.request('/', 'navigate')!).text(), /danz-shell/)
  assert.match(await (await w.request('/assets/app-123.js')!).text(), /static asset/)
  assert.match(await (await w.request('/arcade/faces/synthetic.jpg')!).text(), /static asset/)
  assert.match(await (await w.request('/arcade/faces/synthetic.webp')!).text(), /static asset/)
  assert.equal(w.request('/?code=synthetic', 'navigate'), null)
})
test('exact public arcade links reopen the shell offline without caching query URLs', async () => {
  const w = worker(); await w.lifetime('install'); w.state.offline = true
  for (const path of ['/?seccion=arcade', '/?seccion=arcade&juego=groove-ninja', '/?juego=groove-ninja&seccion=arcade', '/test', '/test/', '/test?seccion=arcade&juego=arena', '/?seccion=arcade&juego=arena', '/test?seccion=arcade&juego=pilla-pilla', '/?seccion=arcade&juego=pilla-pilla', '/test?seccion=arcade&juego=collecta', '/?seccion=arcade&juego=collecta', '/test?seccion=arcade&juego=manager-heist', '/?seccion=arcade&juego=manager-heist']) {
    assert.match(await (await w.request(path, 'navigate')!).text(), /danz-shell/)
  }
  assert.deepEqual([...w.buckets.get(prefix + 'current')!.keys()].sort(), [...paths].sort())
  w.state.offline = false; w.state.gate = true
  assert.match(await (await w.request('/?seccion=arcade&juego=groove-ninja', 'navigate')!).text(), /Sign in with ChatGPT/)
})
test('game links with credentials, unknown/duplicate parameters or a non-navigation request still bypass', () => {
  const w = worker()
  for (const path of ['/?seccion=arcade&code=secret', '/?seccion=arcade&juego=groove-ninja&token_hash=secret', '/?seccion=arcade&pase=secret', '/?seccion=arcade&seccion=arcade', '/?seccion=arcade&juego=groove-ninja&juego=groove-ninja', '/?seccion=cuenta', '/?seccion=arcade&juego=unknown', '/assets/app-123.js?seccion=arcade']) assert.equal(w.request(path, 'navigate'), null, path)
  assert.equal(w.request('/?seccion=arcade&juego=groove-ninja', 'cors'), null)
})

test('activation preserves another app cache and one earlier DANZ build', async () => {
  const w = worker()
  w.buckets.set('other-app', new Map())
  w.buckets.set(prefix + 'oldest', new Map())
  w.buckets.set(prefix + 'previous', new Map([['/assets/old.js', new Response('old bundle')]]))
  await w.lifetime('install'); await w.lifetime('activate')
  assert.deepEqual([...w.buckets.keys()], ['other-app', prefix + 'previous', prefix + 'current'])
  w.state.offline = true
  assert.equal(await (await w.request('/assets/old.js')!).text(), 'old bundle')
  assert.equal(w.state.claimed, 1)
})

test('the installation identity is stable and every declared icon has its real PNG dimensions', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))
  assert.equal(manifest.id, '/'); assert.equal(manifest.start_url, '/'); assert.equal(manifest.display, 'standalone')
  for (const icon of manifest.icons) {
    const file = await readFile(new URL(`../public${icon.src}`, import.meta.url))
    assert.equal(`${file.readUInt32BE(16)}x${file.readUInt32BE(20)}`, icon.sizes)
  }
})
