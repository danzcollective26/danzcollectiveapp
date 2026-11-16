import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DEFAULT_KART_PREFERENCES,KART_PREFERENCES_KEY,readKartPreferences,saveKartPreferences} from '../src/arcade/kart/preferences.ts'
import {DEFAULT_BUILD} from '../src/arcade/kart/garage.ts'

test('DANZPORTER handles corrupt preferences, invalid parts and unavailable storage',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),data=new Map<string,string>()
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}})
  try{
    data.set(KART_PREFERENCES_KEY,'invalid');assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES)
    data.set(KART_PREFERENCES_KEY,JSON.stringify({quality:'ultra',camera:'orbit',sound:'yes',livery:300,venue:'bad',builds:[{chassis:'unknown',wheels:null,color:'javascript:bad'}]}))
    assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES)
    const valid={...DEFAULT_KART_PREFERENCES,quality:'flat' as const,camera:'cockpit' as const,sound:false,livery:3,autoThrottle:true,venue:'night' as const,builds:[{...DEFAULT_BUILD,chassis:'sprint' as const,wheels:'slick' as const,driver:'courier' as const,color:'#123456'},{...DEFAULT_BUILD}] as typeof DEFAULT_KART_PREFERENCES.builds}
    saveKartPreferences(valid);assert.deepEqual(readKartPreferences(),valid)
    Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Storage unavailable')}})
    assert.deepEqual(readKartPreferences(),DEFAULT_KART_PREFERENCES);assert.doesNotThrow(()=>saveKartPreferences(DEFAULT_KART_PREFERENCES))
  }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage')}
})
test('Legacy graphics, sound and paired paint choices survive migration without deleting the old key',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),data=new Map<string,string>([['danz-kart-preferences-v2',JSON.stringify({quality:'lite',camera:'track',sound:false,livery:2})]])
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}})
  try{
    const value=readKartPreferences();assert.equal(value.quality,'lite');assert.equal(value.sound,false);assert.equal(value.builds[0].color,'#82dadd');assert.equal(value.builds[1].color,'#edb56f')
    saveKartPreferences(value);assert.ok(data.has(KART_PREFERENCES_KEY));assert.ok(data.has('danz-kart-preferences-v2'))
    assert.deepEqual(readKartPreferences(),value)
  }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage')}
})
