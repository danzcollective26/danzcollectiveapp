import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('dist')
const runtime = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8')
const assets = (await readdir(resolve(root, 'assets'))).filter(name => /\.(?:js|css)$/.test(name)).map(name => `/assets/${name}`)
const paths = ['/index.html', '/manifest.webmanifest', '/icons/danz-180.png', '/icons/danz-192.png', '/icons/danz-512.png', '/icons/danz-maskable-512.png', ...assets].sort()
const digest = createHash('sha256').update(runtime)
for (const path of paths) {
  const bytes = await readFile(resolve(root, `.${path}`))
  if (path === '/index.html' && !bytes.toString().includes('name="danz-shell"')) throw new Error('Missing DANZ application shell marker')
  digest.update(path).update(bytes)
}
const version = digest.digest('hex').slice(0, 16)
await writeFile(resolve(root, 'sw.js'), `const BUILD = ${JSON.stringify({ version, paths })};\n${runtime}`)
console.log(`DANZ offline shell: ${paths.length} static files, version ${version}`)
