import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardinalDirection, joystickVector, STICK_REACH } from '../src/arcade/joystick.ts'
import { worldVector } from '../src/arcade/versusView.ts'
import { parseCollectaControls, readCollectaControls, saveCollectaControls } from '../src/arcade/collectaControls.ts'
import { createChase, startChase, stepChase } from '../src/arcade/chase/engine.ts'

test('a centered stick and tiny or invalid contacts never cause drift', () => {
  for (const [x,y] of [[0,0],[1,1],[6,0],[NaN,1],[Infinity,0]]) assert.deepEqual(joystickVector(x,y),{x:0,y:0})
})
test('analog movement increases smoothly and remains bounded in every direction', () => {
  const half=joystickVector(STICK_REACH/2,0), full=joystickVector(STICK_REACH,0), far=joystickVector(1e6,1e6)
  assert.ok(half.x>0 && half.x<full.x); assert.equal(full.x,1); assert.equal(full.y,0)
  assert.ok(Math.abs(Math.hypot(far.x,far.y)-1)<1e-8)
  assert.ok(Math.abs(joystickVector(-30,-30).x-joystickVector(-30,-30).y)<1e-8)
})
test('Arena keeps a stable cardinal direction near diagonals and centers cleanly', () => {
  assert.equal(cardinalDirection({x:.71,y:-.7},'up'),'up')
  assert.equal(cardinalDirection({x:1,y:-.2},'up'),'right')
  assert.equal(cardinalDirection({x:-1,y:0}),'left')
  assert.equal(cardinalDirection({x:0,y:0},'left'),null)
  assert.equal(cardinalDirection({x:NaN,y:1}),null)
})
test('both opposing controllers map forward from the physical player viewpoint', () => {
  assert.deepEqual(worldVector({x:0,y:-1},0,true),{x:1,y:0})
  assert.deepEqual(worldVector({x:0,y:-1},1,true),{x:-1,y:0})
  assert.deepEqual(worldVector({x:0,y:-1},1,false),{x:0,y:1})
  const input:[{x:number;y:number},{x:number;y:number}]=[worldVector({x:0,y:-1},0,true),worldVector({x:0,y:-1},1,true)]
  const next=stepChase(startChase(createChase()),input,100)
  assert.ok(next.players[0].x>110);assert.ok(next.players[1].x<770)
})
test('partial stick deflection moves more slowly without changing duration or score', () => {
  const s=startChase(createChase()), half=stepChase(s,[{x:0,y:-.5},{x:0,y:0}],100), full=stepChase(s,[{x:0,y:-1},{x:0,y:0}],100)
  assert.ok(Math.abs((300-half.players[0].y)*2-(300-full.players[0].y))<1e-7)
  assert.equal(half.elapsed,full.elapsed);assert.deepEqual(half.players.map(p=>p.score),[0,0])
})
test('each player preference survives validation independently and unavailable storage is optional', () => {
  assert.deepEqual(parseCollectaControls('["joystick","arrows"]'),['joystick','arrows'])
  assert.deepEqual(parseCollectaControls('["unknown","joystick"]'),['arrows','joystick'])
  for (const raw of [null,'broken','{}','["joystick"]','["joystick","arrows",true]']) assert.deepEqual(parseCollectaControls(raw),['arrows','arrows'])
  assert.deepEqual(readCollectaControls(),['arrows','arrows'])
  assert.doesNotThrow(()=>saveCollectaControls(['joystick','joystick']))
})
