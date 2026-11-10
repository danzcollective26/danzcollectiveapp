import assert from 'node:assert/strict'
import { test } from 'node:test'
import { arcadeAssets, collectiveAssets, musicLink, parseCollective, snakeFace } from '../src/content/collective.ts'

const empty = () => ({ websiteUrl: null, artists: [], snake: { headImage: null, faces: [] } })

test('the independent configuration needs no website, artists or faces', () => {
  const config = parseCollective(empty())
  assert.equal(config.websiteUrl, null)
  assert.deepEqual(arcadeAssets(config), [])
  assert.equal(snakeFace(config.snake.faces, 0), null)
  assert.equal(snakeFace(config.snake.faces, 50, 2), null)
})

test('official profile links discard tracking and reject lookalike hosts or credentials', () => {
  assert.deepEqual(musicLink('https://open.spotify.com/intl-es/artist/1234567890123456789012?si=tracking'), { label: 'Spotify', href: 'https://open.spotify.com/artist/1234567890123456789012' })
  assert.equal(musicLink('https://www.soundcloud.com/test-dj/?utm_source=tracking#x').href, 'https://soundcloud.com/test-dj')
  assert.equal(musicLink('https://youtube.com/@test-dj').label, 'YouTube')
  assert.equal(musicLink('https://instagram.com/test.dj?utm_source=qr').href, 'https://www.instagram.com/test.dj/')
  assert.equal(musicLink('https://www.mavelpoint.com/artist/test-dj/overview?utm_source=x').label, 'MavelPoint')
  for (const value of ['javascript:alert(1)', 'http://soundcloud.com/test-dj', 'https://soundcloud.com.evil.example/test-dj', 'https://soundcloud.com@evil.example/test-dj', 'https://user:password@soundcloud.com/test-dj', 'https://open.spotify.com/track/1234567890123456789012', 'https://soundcloud.com/test-dj/a-track', 'https://soundcloud.com:444/test-dj', 'https://www.instagram.com/p/post-id/', 'https://www.mavelpoint.com/artist/test-dj/private', 'https://www.instagram.com.evil.example/test']) assert.throws(() => musicLink(value), value)
})

test('future website and artist data can be configured independently', () => {
  const config = parseCollective({ ...empty(), websiteUrl: 'https://collective.example/shop', artists: [{ id: 'test-dj', name: '  Test DJ  ', links: ['https://soundcloud.com/test-dj?si=1', 'https://soundcloud.com/test-dj?si=2'] }] })
  assert.equal(config.websiteUrl, 'https://collective.example/shop')
  assert.equal(config.artists[0].name, 'Test DJ')
  assert.equal(config.artists[0].links.length, 1)
  assert.throws(() => parseCollective({ ...empty(), websiteUrl: 'javascript:alert(1)' }))
  assert.throws(() => parseCollective({ ...empty(), artists: [{ id: 'test', name: 'Test', links: [] }] }))
})

test('only explicit public arcade raster files may be precached, with distinct identifiers', () => {
  const face = { id: 'test', name: 'Test', image: '/arcade/faces/test.webp' }
  const config = parseCollective({ ...empty(), snake: { headImage: '/arcade/brand/flower.png', faces: [face, { ...face, id: 'second' }] } })
  assert.deepEqual(arcadeAssets(config), ['/arcade/brand/flower.png', '/arcade/faces/test.webp'])
  for (const image of ['https://external.example/face.png', '/private-gallery/photo.jpg', '/arcade/faces/../../private.jpg', '/arcade/faces/face.svg', '/arcade/faces/test.png?token=secret', '/arcade/brand/flower.png']) assert.throws(() => parseCollective({ ...empty(), snake: { headImage: null, faces: [{ ...face, image }] } }), image)
  assert.throws(() => parseCollective({ ...empty(), snake: { headImage: null, faces: [face, face] } }))
})

test('Snake cycles faces for food, adds them to eaten segments and leaves the initial tail plain', () => {
  const faces = [{ id: 'one', name: 'One', image: '/arcade/faces/one.png' }, { id: 'two', name: 'Two', image: '/arcade/faces/two.jpg' }]
  assert.equal(snakeFace(faces, 0)?.id, 'one')
  assert.equal(snakeFace(faces, 0, 1), null)
  assert.equal(snakeFace(faces, 10)?.id, 'two')
  assert.equal(snakeFace(faces, 10, 1)?.id, 'one')
  assert.equal(snakeFace(faces, 10, 2), null)
  assert.equal(snakeFace(faces, 20)?.id, 'one')
  assert.equal(snakeFace(faces, 20, 1)?.id, 'two')
  assert.equal(snakeFace(faces, 20, 2)?.id, 'one')
})

test('artist portraits must be bundled public rasters and are distinct from private galleries and Snake faces', () => {
  const artist = { id: 'test', name: 'Test', image: '/artists/test.jpg', links: ['https://soundcloud.com/test'] }
  const config = parseCollective({ ...empty(), artists: [artist] })
  assert.deepEqual(collectiveAssets(config), ['/artists/test.jpg'])
  assert.deepEqual(arcadeAssets(config), [])
  for (const image of ['/private-gallery/test.jpg', '/artists/../private.jpg', '/artists/test.svg', '/artists/test.jpg?token=secret', 'https://external.example/test.jpg']) assert.throws(() => parseCollective({ ...empty(), artists: [{ ...artist, image }] }))
})
