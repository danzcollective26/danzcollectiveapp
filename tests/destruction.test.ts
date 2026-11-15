import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

test('Groove Ninja destruction mode keeps eight selectable, visually distinct weapons',()=>{
 const source=readFileSync(join(process.cwd(),'src/arcade/GrooveDestruction.tsx'),'utf8')
 for(const name of ['blaster','scatter','laser','paint','cannon','boomerang','flower','yeppo']){
  assert.match(source,new RegExp('\\b'+name+':\\{name:'))
 }
 assert.match(source,/DESTRUCTION_DURATION=60_000/)
 assert.match(source,/sin afectar los récords competitivos ni DANZPOINTS/)
})
