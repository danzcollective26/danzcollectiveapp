import assert from 'node:assert/strict'
import { test } from 'node:test'
import { playAchievementTone } from '../src/ui/achievementFeedback.ts'

test('achievement sound is silent by default and does not create an audio context', async () => {
  const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null}})
  try { await playAchievementTone() }
  finally {if(old)Object.defineProperty(globalThis,'localStorage',old);else Reflect.deleteProperty(globalThis,'localStorage')}
})

test('a sound awaiting permission closes without playing when the tab is hidden', async () => {
  const keys=['localStorage','window','document','navigator']
  const old=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]))
  let resume!:()=>void, closes=0, oscillators=0
  const doc={hidden:false}
  class Audio {
    state='suspended'
    resume(){return new Promise<void>(resolve=>{resume=()=>{this.state='running';resolve()}})}
    close(){closes++;this.state='closed';return Promise.resolve()}
    createOscillator(){oscillators++;throw new Error('Must not play')}
  }
  const values={localStorage:{getItem:()=>'{"sounds":true}'},window:{AudioContext:Audio},document:doc,navigator:{userActivation:{hasBeenActive:true}}}
  for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{configurable:true,value})
  try {const pending=playAchievementTone();doc.hidden=true;resume();await pending;assert.equal(closes,1);assert.equal(oscillators,0)}
  finally {for(const [key,value] of old){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key)}}
})
