import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nativePhotoIntent } from '../src/cloud/nativePhoto.ts'
const input = { url: 'https://ttgehdknhnrxtddxpknc.supabase.co/storage/v1/object/sign/danz-event-photos/event/photo/original.jpg?token=synthetic&download=DANZ.jpg', name: 'DANZ.jpg', mime: 'image/jpeg', bytes: 542633, sha256: 'a'.repeat(64) }
test('the native photo handoff binds the package, complete file, private source and safe fallback', () => {
  const link = nativePhotoIntent(input)
  assert.ok(link.includes('package=com.danzcollective.photos;'))
  assert.ok(link.includes('scheme=danzphotos;'))
  const uri = new URL(link.replace('intent:', 'danzphotos:').split('#')[0])
  assert.equal(uri.searchParams.get('url'), input.url)
  assert.equal(uri.searchParams.get('name'), input.name)
  assert.equal(uri.searchParams.get('bytes'), input.bytes.toString())
  assert.equal(uri.searchParams.get('sha256'), input.sha256)
  const fallback = decodeURIComponent(link.split('S.browser_fallback_url=')[1].split(';')[0])
  assert.equal(new URL(fallback).origin, 'https://danz-collective-demo.right-vine-9666.chatgpt.site')
  assert.equal(new URL(fallback).searchParams.has('token'), false)
})
test('native handoff rejects other hosts, malformed images and intent injection', () => {
  for (const patch of [{url:input.url.replace('ttgehdknhnrxtddxpknc.supabase.co','example.invalid')},{url:input.url.replace('https:','http:')},{url:input.url.replace('/photo/','/../')},{url:input.url.replace('https://','https://user@')},{name:'photo.jpg;package=other;'},{bytes:0},{bytes:26*1024*1024},{mime:'text/html'},{sha256:'invalid'}]) assert.throws(() => nativePhotoIntent({...input,...patch}))
})
