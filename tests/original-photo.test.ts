import { test } from 'node:test'
import assert from 'node:assert/strict'
import { photoDigest, verifiedPhotoFile } from '../src/cloud/originalPhoto.ts'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const metadata = { name: 'DANZ.jpg', path: 'private/original.png', mime: 'image/png', bytes: png.length }

test('an original file keeps every byte, its matching extension, MIME and checksum', async () => {
  const blob = new Blob([png], { type: 'application/octet-stream' })
  const sha256 = await photoDigest(blob)
  const result = await verifiedPhotoFile(blob, { ...metadata, sha256 })
  assert.equal(result.file.name, 'DANZ.png')
  assert.equal(result.file.type, 'image/png')
  assert.equal(result.file.size, png.length)
  assert.equal(result.digest, sha256)
  assert.deepEqual(Buffer.from(await result.file.arrayBuffer()), png)
})

test('empty responses, partial originals and responses disguised as images are rejected', async () => {
  await assert.rejects(verifiedPhotoFile(new Blob([], { type: 'image/png' }), metadata))
  await assert.rejects(verifiedPhotoFile(new Blob([png.subarray(0, -8)], { type: 'image/png' }), metadata))
  await assert.rejects(verifiedPhotoFile(new Blob(['<html>login</html>'], { type: 'image/jpeg' }), { name: 'x.jpg', path: 'x.jpg' }))
  await assert.rejects(verifiedPhotoFile(new Blob([png], { type: 'image/jpeg' }), metadata))
})

test('same-length altered originals cannot pass the stored checksum', async () => {
  const original = new Blob([png], { type: 'image/png' })
  const altered = Buffer.from(png); altered[30] ^= 1
  await assert.rejects(verifiedPhotoFile(new Blob([altered], { type: 'image/png' }), { ...metadata, sha256: await photoDigest(original) }))
})
