import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_KART_PREFERENCES, KART_PREFERENCES_KEY, readKartPreferences, saveKartPreferences } from '../src/arcade/kart/preferences.ts'

test('Kart can open with corrupt, unsupported or unavailable saved preferences',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
  let saved='invalid'
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value}}})
  try{
    assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES)
    saved=JSON.stringify({quality:'ultra',camera:'orbit',sound:'yes',livery:300})
    assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES)
    saveKartPreferences({quality:'flat',camera:'track',sound:false,livery:3})
    assert.deepEqual(readKartPreferences(),{quality:'flat',camera:'track',sound:false,livery:3})
    assert.ok(KART_PREFERENCES_KEY.endsWith('v2'))
    Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Storage unavailable')}})
    assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES)
    assert.doesNotThrow(()=>saveKartPreferences(DEFAULT_KART_PREFERENCES))
  }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage')}
})
