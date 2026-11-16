import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFavorites, toggleFavorite, type FavoriteStore } from '../src/feel/favorites.ts'
import { clampScale, decideSwipe } from '../src/feel/viewerGestures.ts'

function memoryStore(): FavoriteStore {
  const memory = new Map<string, string>()
  return {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => { memory.set(key, value) },
  }
}

test('photo favorites toggle inside the provided store and stay capped', () => {
  const store = memoryStore()
  assert.deepEqual(readFavorites(store), [])
  assert.equal(toggleFavorite('local:one', store), true)
  assert.equal(toggleFavorite('private:two', store), true)
  assert.equal(toggleFavorite('local:one', store), false)
  assert.deepEqual(readFavorites(store), ['private:two'])
})

test('viewer swipes pass photos, dismiss downward, and ignore a zoomed pan', () => {
  assert.equal(decideSwipe(-80, 10, false, true), 'next')
  assert.equal(decideSwipe(80, 4, false, true), 'previous')
  assert.equal(decideSwipe(10, 120, false, true), 'dismiss')
  assert.equal(decideSwipe(15, -120, false, true), 'ignore')
  assert.equal(decideSwipe(-80, 0, true, true), 'ignore')
  assert.equal(decideSwipe(4, 2, false, false), 'ignore')
  assert.equal(clampScale(8), 3)
  assert.equal(clampScale(0.2), 1)
})
