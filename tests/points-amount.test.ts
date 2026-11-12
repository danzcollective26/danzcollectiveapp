import assert from 'node:assert/strict'
import { test } from 'node:test'
import { euroAmount } from '../src/points/amount.ts'

test('verified purchase amounts accept cents exactly and reject ambiguous or out-of-range input', () => {
  for (const [value, cents] of [['38,10',3810],['0.01',1],['12',1200],['100000,00',10000000]] as const) assert.equal(euroAmount(value),cents)
  for (const value of ['0','-1','1e3','12,001','1.234,56','NaN','100000.01','']) assert.equal(euroAmount(value),null)
})
