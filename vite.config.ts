import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { makeQrArtHandler } from './server/qrArt.ts'

// Same API handler in local development and Vercel. Secrets stay in this
// server-side plugin; loadEnv's values are never assigned to Vite's define.
function qrArtApi(env: Record<string, string | undefined>): Plugin {
  const handle = makeQrArtHandler(env)
  return { name: 'danz-qr-art-api', configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.split('?')[0] !== '/api/qr-art') return next()
      const abort = new AbortController()
      res.on('close', () => { if (!res.writableEnded) abort.abort() })
      try {
        const chunks: Buffer[] = []
        let size = 0
        for await (const chunk of req) {
          const bytes = Buffer.from(chunk)
          size += bytes.length
          if (size > 9000) { res.statusCode = 413; res.end(); return }
          chunks.push(bytes)
        }
        const method = req.method || 'GET'
        const headers = new Headers()
        for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
        const request = new Request('http://localhost/api/qr-art', { method, headers, signal: abort.signal,
          ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) }),
        })
        const response = await handle(request)
        res.statusCode = response.status
        response.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch { if (!res.writableEnded) { res.statusCode = 500; res.end() } }
    })
  } }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), qrArtApi({ ...process.env, ...loadEnv(mode, process.cwd(), '') })],
  server: { allowedHosts: ['terminal.local'] },
}))
