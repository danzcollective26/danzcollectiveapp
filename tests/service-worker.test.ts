import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

const source = readFileSync(new URL('../scripts/service-worker.js', import.meta.url), 'utf8')

function workerFile(mime: string, url = 'https://danz.example/brand/danz-flower.svg') {
  const response = { ok: true, redirected: false, url, headers: new Headers({ 'content-type': mime }) }
  const context = createContext({
    BUILD: { version: 'test', paths: ['/brand/danz-flower.svg'] },
    URL,
    self: { location: { origin: 'https://danz.example' }, addEventListener() {} },
    fetch: async () => response,
  })
  runInContext(source, context)
  return { response, load: () => runInContext("staticResponse('/brand/danz-flower.svg')", context) as Promise<unknown> }
}

test('the offline shell accepts the bundled SVG flower with its image MIME', async () => {
  const file = workerFile('image/svg+xml; charset=utf-8')
  assert.equal(await file.load(), file.response)
})

test('the SVG cache guard still rejects HTML, other MIME types and another origin', async () => {
  await assert.rejects(workerFile('text/html').load(), /Unexpected application file type/)
  await assert.rejects(workerFile('application/json').load(), /Unexpected application file type/)
  await assert.rejects(workerFile('image/svg+xml', 'https://another.example/brand/danz-flower.svg').load(), /Application file unavailable/)
})
