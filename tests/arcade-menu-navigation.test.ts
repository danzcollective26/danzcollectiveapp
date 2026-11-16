import assert from 'node:assert/strict'
import test from 'node:test'
import { menuIndex, swipeMenuStep } from '../src/arcade/menuNavigation.ts'

test('classic menu navigation wraps across first and last choices',()=>{
  assert.equal(menuIndex(0,-1,6),5)
  assert.equal(menuIndex(5,1,6),0)
  assert.equal(menuIndex(0,-13,6),5)
  assert.equal(menuIndex(0,1,1),0)
  assert.equal(menuIndex(0,1,0),0)
})
test('horizontal swipes select once while small or vertical movements keep the choice',()=>{
  assert.equal(swipeMenuStep(-70,8),1)
  assert.equal(swipeMenuStep(60,-12),-1)
  assert.equal(swipeMenuStep(25,2),0)
  assert.equal(swipeMenuStep(70,90),0)
  assert.equal(swipeMenuStep(38,0),-1)
})
