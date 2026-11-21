import assert from 'node:assert/strict'
import test from 'node:test'
import { isPreviewHostname, shouldRegisterOffline } from '../src/pwa/previewHost.ts'

test('Vercel previews cannot register the offline app shell', () => {
  assert.equal(isPreviewHostname('danzcollectiveapp-preview.vercel.app'), true)
  assert.equal(isPreviewHostname('danzcollectiveapp-2r2uq3rpb-danzcollectiveapp-5608.vercel.app'), true)
  assert.equal(shouldRegisterOffline(true, 'danzcollectiveapp-preview.vercel.app'), false)
  assert.equal(shouldRegisterOffline(true, 'danzcollectiveapp-2r2uq3rpb-danzcollectiveapp-5608.vercel.app'), false)
})

test('Production keeps offline support; development does not register it', () => {
  assert.equal(isPreviewHostname('danzcollectiveapp.vercel.app'), false)
  assert.equal(shouldRegisterOffline(true, 'danzcollectiveapp.vercel.app'), true)
  assert.equal(shouldRegisterOffline(true, 'danzcollective.com'), true)
  assert.equal(shouldRegisterOffline(false, 'localhost'), false)
})
