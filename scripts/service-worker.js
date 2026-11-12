/* BUILD is injected during compilation. Never add API routes or private data here. */
const PREFIX = 'danz-shell-v1-'
const CACHE = PREFIX + BUILD.version
const allowed = new Set(BUILD.paths)

async function staticResponse(path) {
  // Hosting canonicalizes /index.html to /. Fetch that final URL directly,
  // while retaining /index.html as the stable key used for offline reloads.
  const response = await fetch(new URL(path === '/index.html' ? '/' : path, self.location.origin), { cache: 'reload', credentials: 'same-origin', redirect: 'error' })
  if (!response.ok || response.redirected || new URL(response.url).origin !== self.location.origin) throw new Error('Application file unavailable')
  const mime = response.headers.get('content-type') || ''
  // A private hosting sign-in page may be returned with status 200. Never save it.
  if (path === '/index.html') {
    if (!mime.includes('text/html') || !(await response.clone().text()).includes('name="danz-shell"')) throw new Error('Not the DANZ application shell')
  } else if (path.endsWith('.js') ? !/javascript|ecmascript/.test(mime)
    : path.endsWith('.css') ? !mime.includes('text/css')
    : path.endsWith('.png') ? !mime.includes('image/png')
    : /\.jpe?g$/.test(path) ? !mime.includes('image/jpeg')
    : path.endsWith('.webp') ? !mime.includes('image/webp')
    : path.endsWith('.svg') ? !mime.includes('image/svg+xml')
    : !/json|manifest/.test(mime)) throw new Error('Unexpected application file type')
  return response
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    try {
      await Promise.all(BUILD.paths.map(async path => { await cache.put(path, await staticResponse(path)) }))
    } catch (error) {
      await caches.delete(CACHE)
      throw error
    }
  })())
  // Updates wait for an explicit choice in the app. No automatic page reload.
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Retain one previous shell for tabs still running the preceding build.
    const old = (await caches.keys()).filter(name => name.startsWith(PREFIX) && name !== CACHE)
    await Promise.all(old.slice(0, -1).map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', event => {
  if (event.data?.type === 'DANZ_ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting())
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return
  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith((async () => {
      // Online requests always reach hosting, including its private-access gate.
      try { return await fetch(request) }
      catch {
        return (await (await caches.open(CACHE)).match('/index.html'))
          || new Response('Conecta a Internet para abrir DANZ por primera vez.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } })
      }
    })())
  } else if (allowed.has(url.pathname) && url.pathname !== '/index.html') {
    event.respondWith((async () => (await (await caches.open(CACHE)).match(url.pathname)) || fetch(request))())
  } else if (url.pathname.startsWith('/assets/')) {
    // Earlier hashed bundles can only be read from existing app caches, never added.
    event.respondWith((async () => {
      for (const name of (await caches.keys()).filter(name => name.startsWith(PREFIX))) {
        const cached = await (await caches.open(name)).match(url.pathname)
        if (cached) return cached
      }
      return fetch(request)
    })())
  }
  // Supabase Auth/REST/Storage, signed URLs, callbacks, pass tokens, backups and
  // every other request bypass this worker. There is no runtime response caching.
})
