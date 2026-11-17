import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import content from '../src/content/collective.json' with { type: 'json' }
import { collectiveAssets, parseCollective } from '../src/content/collective.ts'

const root = resolve('dist')
const runtime = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8')
const assets = (await readdir(resolve(root, 'assets'))).filter(name => /\.(?:js|css)$/.test(name)).map(name => `/assets/${name}`)
const artwork = collectiveAssets(parseCollective(content))
for (const path of artwork) {
  const bytes = await readFile(resolve(root, `.${path}`))
  const valid = /\.png$/.test(path) ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : /\.jpe?g$/.test(path) ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!valid || bytes.length > 512 * 1024) throw new Error(`Invalid or oversized public collective image: ${path}`)
}
const paths = ['/index.html', '/manifest.webmanifest', '/icons/danz-flower-black-180.png', '/icons/danz-flower-black-192.png', '/icons/danz-flower-black-512.png', '/icons/danz-flower-black-maskable-512.png', '/brand/danz-flower.svg', '/brand/danz-collective-wordmark.png', '/brand/arcadanz-wordmark-v2.webp', '/arcade/idle-studio-industrial.webp', '/arcade/arena-danz.svg', '/arcade/kart-mini.svg', '/arcade/danzporter-cover-v1.webp', '/arcade/kart/asphalt.webp', '/arcade/kart/asphalt-normal.webp', '/arcade/chase/yeppo-face.svg', '/arcade/collecta-mobile-v1.webp', '/arcade/jack-approved-mobile.webp', '/arcade/groove-ninja-approved-mobile.webp', '/arcade/afterdrop-cover.svg', ...assets, ...artwork].sort()
const digest = createHash('sha256').update(runtime)
for (const path of paths) {
  const bytes = await readFile(resolve(root, `.${path}`))
  if (path === '/index.html' && !bytes.toString().includes('name="danz-shell"')) throw new Error('Missing DANZ application shell marker')
  digest.update(path).update(bytes)
}
const version = digest.digest('hex').slice(0, 16)
await writeFile(resolve(root, 'sw.js'), `const BUILD = ${JSON.stringify({ version, paths })};\n${runtime}`)
console.log(`DANZ offline shell: ${paths.length} static files, version ${version}`)
