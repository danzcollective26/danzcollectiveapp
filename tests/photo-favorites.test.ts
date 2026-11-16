import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFavorites, writeFavorites } from '../src/ui/favorites.ts'

test('local favorites are scoped to account/event and only store bounded identifiers', () => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map<string,string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key,value) } })
  try {
    assert.equal(writeFavorites('private:alice:night1', ['photo1','photo1','photo2','https://signed.invalid/photo?token=private','../photo']),true)
    assert.deepEqual(readFavorites('private:alice:night1'), ['photo1','photo2'])
    assert.deepEqual(readFavorites('private:bob:night1'), [])
    assert.deepEqual(readFavorites('private:alice:night2'), [])
    assert.deepEqual(readFavorites('local:night1'), [])
    assert.ok([...values.values()].every(value => !value.includes('token') && !value.includes('http')))
    writeFavorites('local:many', Array.from({length:600},(_,i)=>`photo${i}`))
    assert.equal(readFavorites('local:many').length,500)
    values.set('danz-photo-favorites-v1:local:bad','not json')
    assert.deepEqual(readFavorites('local:bad'),[])
  } finally { if(old)Object.defineProperty(globalThis,'localStorage',old);else Reflect.deleteProperty(globalThis,'localStorage') }
})

test('unavailable browser storage never blocks opening a photograph', () => {
  const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('disabled')}})
  try { assert.deepEqual(readFavorites('local:event'),[]);assert.equal(writeFavorites('local:event',['photo']),false) }
  finally { if(old)Object.defineProperty(globalThis,'localStorage',old);else Reflect.deleteProperty(globalThis,'localStorage') }
})
