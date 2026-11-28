import assert from 'node:assert/strict'
import { test } from 'node:test'
import { availableSocialProviders, accountBrowserUrl, danzAuthOrigin, isDanzPreviewHost, DANZ_CANONICAL_ORIGIN } from '../src/auth/oauth.ts'

test('social login only uses explicit enabled Google and Apple flags from public Auth settings', () => {
  assert.deepEqual(availableSocialProviders({ external: { google: true, apple: true, github: true } }), ['google', 'apple'])
  assert.deepEqual(availableSocialProviders({ external: { google: false, apple: true } }), ['apple'])
  for (const value of [null, undefined, {}, { external: null }, { external: [] }, { google: true }, { external: { google: 'true', apple: 1 } }]) assert.deepEqual(availableSocialProviders(value), [])
})

test('browser login carries a valid pending pass only in the fragment and drops other credentials', () => {
  const url = new URL(accountBrowserUrl('https://app.example/?token_hash=secret#access_token=secret', 'ABCD-1234-EFGH-5678'))
  assert.equal(url.origin, 'https://app.example')
  assert.equal(url.pathname, '/')
  assert.equal(url.search, '?seccion=cuenta')
  assert.equal(url.hash, '#pase=ABCD1234EFGH5678')
  assert.equal(url.href.includes('secret'), false)
  assert.equal(new URL(accountBrowserUrl('https://app.example', '../invalid')).hash, '')
  assert.equal(new URL(accountBrowserUrl('https://app.example', null)).hash, '')
})

test('production auth always targets the stable DANZ origin, not shared demos or previews',()=>{
 assert.equal(danzAuthOrigin('https://danz-collective-demo.right-vine-9666.chatgpt.site'),DANZ_CANONICAL_ORIGIN)
 assert.equal(danzAuthOrigin('https://danzcollectiveapp-preview-123.vercel.app'),DANZ_CANONICAL_ORIGIN)
 assert.equal(danzAuthOrigin('https://danzcollectiveapp.vercel.app'),DANZ_CANONICAL_ORIGIN)
 assert.equal(danzAuthOrigin('http://127.0.0.1:4173'),'http://127.0.0.1:4173')
})

test('own DANZ Vercel previews keep login on the same origin; foreign hosts do not', () => {
  const deployment = 'https://danzcollectiveapp-nd2llmi91-danzcollectiveapp-5608.vercel.app'
  const branch = 'https://danzcollectiveapp-git-feature-x-danzcollectiveapp-5608.vercel.app'
  assert.equal(danzAuthOrigin(deployment), deployment)
  assert.equal(danzAuthOrigin(branch), branch)
  assert.equal(danzAuthOrigin('https://danzcollectiveapp-preview.vercel.app'), 'https://danzcollectiveapp-preview.vercel.app')
  for (const foreign of [
    'https://danzcollectiveapp-evil-otherteam.vercel.app',
    'https://danzcollectiveapp-x-danzcollectiveapp-5608.vercel.app.evil.example',
    'https://evil-danzcollectiveapp-x-danzcollectiveapp-5608.vercel.app',
    'http://danzcollectiveapp-nd2llmi91-danzcollectiveapp-5608.vercel.app',
  ]) assert.equal(danzAuthOrigin(foreign), DANZ_CANONICAL_ORIGIN, foreign)
  assert.equal(isDanzPreviewHost('danzcollectiveapp.vercel.app'), false)
})

test('preview label names the commit only on preview builds or own preview hosts', async () => {
  const { previewLabel } = await import('../src/pwa/build.ts')
  assert.equal(previewLabel({ env: 'production', sha: 'abc1234', ref: 'main' }, 'danzcollectiveapp.vercel.app'), null)
  assert.equal(previewLabel({ env: 'local', sha: '', ref: '' }, 'localhost'), null)
  assert.equal(previewLabel({ env: 'preview', sha: 'abc1234', ref: 'integration/x' }, 'danzcollectiveapp-a1-danzcollectiveapp-5608.vercel.app'), 'PRUEBA · abc1234 · integration/x')
  assert.equal(previewLabel({ env: 'local', sha: '', ref: '' }, 'danzcollectiveapp-preview.vercel.app'), 'PRUEBA')
})
