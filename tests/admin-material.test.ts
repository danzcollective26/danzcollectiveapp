import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { createCodeMaterial, newId, localDateTime } from '../src/admin/access.ts'
test('issued materials use independent random tokens, valid UUIDs and normalized SHA-256 hashes',async()=>{
  const a=await createCodeMaterial(),b=await createCodeMaterial()
  assert.match(a.code,/^[A-F0-9]{32}$/);assert.notEqual(a.code,b.code);assert.notEqual(a.id,b.id)
  assert.match(newId(),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.equal(a.hash,createHash('sha256').update(a.code).digest('hex'))
})
test('editing an event preserves the local calendar time and handles absent dates',()=>{
  assert.equal(localDateTime(null),'');assert.equal(localDateTime('invalid'),'')
  const input='2027-01-02T22:30';assert.equal(localDateTime(new Date(input).toISOString()),input)
})
