import test from 'node:test'
import assert from 'node:assert/strict'
import {YEPPOLINE_COUNT,yeppoMessage} from '../src/yeppo/messages.ts'
import {DAILY_MAX,MIN_GAP_MS,mayAppear,dismissed,nextPhrase} from '../src/yeppo/rules.ts'

test('Yeppo has many short curated lines with optional interpolation',()=>{
 assert.ok(YEPPOLINE_COUNT>=35)
 assert.match(yeppoMessage('fotos',0,{evento:'DANZ Night'})??'',/DANZ Night/)
 assert.equal(yeppoMessage('fotos',0,{}),null)
 assert.ok(nextPhrase('pasaporte',{},1))
})
test('Yeppo limits appearances across time and daily cap',()=>{
 const now=Date.parse('2026-11-13T12:00:00Z')
 const ledger={day:'2026-11-13',count:2,lastAt:now,dismissals:0,suppressedUntil:0}
 assert.equal(mayAppear(ledger,now+MIN_GAP_MS-1,90_000),false)
 assert.equal(mayAppear(ledger,now+MIN_GAP_MS+5*60_000,90_000),true)
 assert.equal(mayAppear({...ledger,count:DAILY_MAX},now+24*60*60_000,90_000),false)
 assert.equal(mayAppear(ledger,now+24*60*60_000,12_000),false)
})
test('Yeppo enters longer silence on repeated dismissals',()=>{
 const now=Date.parse('2026-11-13T12:00:00Z')
 const ledger={day:'2026-11-13',count:1,lastAt:now,dismissals:0,suppressedUntil:0}
 const first=dismissed(ledger,now)
 assert.equal(first.suppressedUntil,0)
 const second=dismissed(first,now+10_000)
 assert.ok(second.suppressedUntil>=now+60*60_000)
 assert.equal(mayAppear(second,now+5*60_000,90_000),false)
})
