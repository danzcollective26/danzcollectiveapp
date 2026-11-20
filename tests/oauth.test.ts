import assert from 'node:assert/strict'
import { test } from 'node:test'
import { availableSocialProviders, accountBrowserUrl, danzAuthOrigin, DANZ_CANONICAL_ORIGIN, DANZ_PREVIEW_AUTH_ORIGIN, isDanzPreviewAuthAllowed } from '../src/auth/oauth.ts'

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


test('only the exact approved preview origin may enable OAuth after Supabase allowlisting', () => {
 assert.equal(isDanzPreviewAuthAllowed(DANZ_PREVIEW_AUTH_ORIGIN, true), true)
 assert.equal(isDanzPreviewAuthAllowed(DANZ_PREVIEW_AUTH_ORIGIN, false), false)
 assert.equal(isDanzPreviewAuthAllowed('https://danzcollectiveapp-preview-123.vercel.app', true), false)
 assert.equal(isDanzPreviewAuthAllowed('https://evil.example', true), false)
 assert.equal(isDanzPreviewAuthAllowed('https://danzcollectiveapp-preview.vercel.app.evil.example', true), false)
 assert.equal(isDanzPreviewAuthAllowed('http://danzcollectiveapp-preview.vercel.app', true), false)
})
