import test from 'node:test'
import assert from 'node:assert/strict'
import {YEPPOLINE_COUNT,YEPPOLINES,yeppoMessage} from '../src/yeppo/messages.ts'
import {DAILY_MAX,MIN_GAP_MS,mayAppear,dismissed,nextPhrase} from '../src/yeppo/rules.ts'
import {yeppoGuide,YEPPO_SUGGESTIONS} from '../src/yeppo/guide.ts'

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
 assert.equal(mayAppear(ledger,now+MIN_GAP_MS+5*60_000,MIN_GAP_MS+5*60_000),true)
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

test('Yeppo gives grounded offline replies and safe navigation without external AI',()=>{
 assert.ok(YEPPO_SUGGESTIONS.length>=4)
 assert.equal(yeppoGuide('¿Dónde están mis FÓTOS?').destination,'fotos')
 assert.equal(yeppoGuide('Quiero jugar al snake').destination,'arcade')
 assert.equal(yeppoGuide('Cómo consigo sellos').destination,'pasaporte')
 assert.equal(yeppoGuide('¿Cómo me registro con Google?').destination,'cuenta')
 assert.equal(yeppoGuide('danzflor ropa').destination,'danzflor')
 assert.equal(yeppoGuide('¿Quién eres?').destination,undefined)
 assert.match(yeppoGuide('¿Quién eres?').text,/sin IA generativa/)
 assert.match(yeppoGuide('¿Cuándo es la siguiente fiesta?').text,/No te inventaré horarios/)
 assert.ok(yeppoGuide('x'.repeat(2000)).text.length<300)
})

test('Yeppo offers feedback intake rather than generic navigation on explicit errors and ideas',()=>{
 const broken=yeppoGuide('No me funciona Google al iniciar sesión')
 assert.equal(broken.feedbackCategory,'error')
 assert.equal(broken.feedbackDraft,'No me funciona Google al iniciar sesión')
 assert.equal(broken.destination,undefined)
 const idea=yeppoGuide('Me gustaría poder cambiar el color del Snake')
 assert.equal(idea.feedbackCategory,'sugerencia')
 assert.equal(idea.destination,undefined)
 assert.equal(yeppoGuide('¿Dónde están mis fotos?').destination,'fotos')
 assert.equal(yeppoGuide('Ponme un reto').destination,'arcade')
})

test('Yeppo one-liners are short, direct and safe without invented facts',()=>{
 assert.ok(YEPPOLINE_COUNT>=35)
 for(const [kind,lines] of Object.entries(YEPPOLINES)){
  assert.ok(lines.length>=4,kind)
  for(const line of lines){
   assert.ok(line.length<=66,`${kind}: ${line}`)
   assert.ok(!line.includes('horizontes'),`No over-written filler: ${line}`)
  }
 }
 assert.equal(yeppoMessage('fotos',0,{}),null)
 assert.match(yeppoMessage('regreso',0,{dias:3})??'',/3 días/)
})
