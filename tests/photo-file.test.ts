import { test } from 'node:test'
import assert from 'node:assert/strict'
import { photoFileName, photoFileType } from '../src/cloud/photoFile.ts'

test('JPG originals retain a usable filename and extension', () => {
  assert.equal(photoFileName('1000273117.jpg', 'image/jpeg'), '1000273117.jpg')
  assert.equal(photoFileName('Foto.jpeg', 'image/jpeg'), 'Foto.jpeg')
  assert.equal(photoFileName('foto sin extension', 'image/jpeg'), 'foto sin extension.jpg')
  assert.equal(photoFileType('foto.jpeg'), 'JPG')
})
test('the real image type determines a missing or conflicting extension without converting bytes', () => {
  assert.equal(photoFileName('foto.jpg', 'image/png'), 'foto.png')
  assert.equal(photoFileName('foto', 'image/webp'), 'foto.webp')
  assert.equal(photoFileName(null, null, 'private/event/original.png'), 'original.png')
  assert.equal(photoFileType('foto.webp'), 'WEBP')
})
test('download names cannot contain paths, hidden-file prefixes or control characters', () => {
  assert.equal(photoFileName('../../canción\n.jpg', 'image/jpeg'), '_.._cancion_.jpg')
  assert.equal(photoFileName('', 'image/jpeg'), 'DANZ-foto.jpg')
  assert.equal(photoFileName('file.html', 'image/jpeg'), 'file.jpg')
  assert.ok(photoFileName('a'.repeat(300), 'image/jpeg').length <= 154)
})
