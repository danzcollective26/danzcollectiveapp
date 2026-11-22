import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_BUILD, KART_COLORS, VENUES, buildKey, kartStats, normalizeBuild } from '../src/arcade/kart/garage.ts'

test('DANZPORTER livery collection offers twelve unique valid paints', () => {
  assert.equal(KART_COLORS.length, 12)
  assert.equal(new Set(KART_COLORS).size, KART_COLORS.length)
  for (const color of KART_COLORS) {
    assert.match(color, /^#[0-9a-f]{6}$/i)
    assert.equal(normalizeBuild({ ...DEFAULT_BUILD, color }).color, color)
  }
})

test('five venue moods have distinct colours but do not add race tracks or alter car physics', () => {
  assert.equal(VENUES.length, 5)
  assert.equal(new Set(VENUES.map(venue => venue.id)).size, VENUES.length)
  for (const venue of VENUES) {
    assert.ok(venue.name.length > 3)
    for (const key of ['ground', 'water', 'curb', 'sky', 'sun', 'road'] as const) {
      assert.match(venue[key], /^#[0-9a-f]{6}$/i)
    }
  }
  const start = { ...DEFAULT_BUILD }
  const initial = kartStats(start)
  const key = buildKey(start)
  for (const color of KART_COLORS) {
    for (const driver of ['crew', 'courier', 'mechanic'] as const) {
      const cosmetic = { ...start, color, driver }
      assert.deepEqual(kartStats(cosmetic), initial)
      assert.equal(buildKey(cosmetic), key)
    }
  }
})
