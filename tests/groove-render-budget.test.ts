import assert from 'node:assert/strict'
import {test} from 'node:test'
import {grooveStagePixelRatio} from '../src/arcade/grooveRenderBudget.ts'

test('Groove scene keeps mobile textures sharp without exceeding 1.2 megapixels on large screens',()=>{
  assert.equal(grooveStagePixelRatio(3,390,844),1.5)
  assert.equal(grooveStagePixelRatio(1,390,844),1)
  const large=grooveStagePixelRatio(3,1440,3200)
  assert.ok(large<1)
  assert.ok(1440*3200*large*large<=1_200_001)
})
test('scene pixel ratio rejects pathological inputs',()=>{
  for(const value of [0,Number.NaN,Number.POSITIVE_INFINITY,2]){
    const ratio=grooveStagePixelRatio(value,844,390)
    assert.ok(Number.isFinite(ratio)&&ratio>=.5&&ratio<=1.5)
  }
})
