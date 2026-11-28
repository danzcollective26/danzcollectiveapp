import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_RADIUS, CABEZON_SCALE, CHASSIS_TOP, FACE_RENDER_ORDER, HEAD_CENTER, HEAD_RADIUS, HEAD_RENDER_ORDER, SEAT_HALF_WIDTH, cabezonPose } from '../src/arcade/kart/bigHead.ts'

const rest = { time: 0, steer: 0, speed: 0, boosting: 0, impactAge: 9, bump: 0, reduced: false }

test('the cabezón is 1.6–2.2× the body and clears the cockpit', () => {
  assert.ok(CABEZON_SCALE >= 1.6 && CABEZON_SCALE <= 2.2)
  assert.equal(HEAD_RADIUS, BODY_RADIUS * CABEZON_SCALE)
  assert.ok(HEAD_RADIUS > SEAT_HALF_WIDTH)
  assert.ok(HEAD_CENTER.y - HEAD_RADIUS > CHASSIS_TOP)
  assert.ok(HEAD_CENTER.y + HEAD_RADIUS > CHASSIS_TOP + 20)
  assert.ok(FACE_RENDER_ORDER > HEAD_RENDER_ORDER && HEAD_RENDER_ORDER > 0)
})

test('steering leans the head, hits squash it and boosts stretch it', () => {
  const left = cabezonPose({ ...rest, steer: -1 })
  const right = cabezonPose({ ...rest, steer: 1 })
  assert.ok(left.lean < 0 && right.lean > 0 && right.lean > left.lean)
  const hit = cabezonPose({ ...rest, impactAge: 0 })
  assert.ok(hit.squashY < 1 && hit.squashX > 1)
  assert.ok(Math.abs(hit.squashX * hit.squashY * hit.squashZ - 1) < 0.02)
  const boost = cabezonPose({ ...rest, boosting: 1.2 })
  assert.ok(boost.squashY > 1 && boost.pitch < 0)
  const bump = cabezonPose({ ...rest, bump: 1 })
  assert.ok(bump.offsetY > cabezonPose(rest).offsetY)
})

test('reduced motion keeps the head still except a small steer lean', () => {
  const pose = cabezonPose({ ...rest, reduced: true, steer: 1, speed: 200, boosting: 1, bump: 1, impactAge: 0 })
  assert.equal(pose.offsetY, 0)
  assert.equal(pose.pitch, 0)
  assert.deepEqual([pose.squashX, pose.squashY, pose.squashZ], [1, 1, 1])
  assert.ok(pose.lean > 0 && pose.lean < 0.1)
  const junk = cabezonPose({ time: Number.NaN, steer: Number.NaN, speed: Number.NaN, boosting: Number.NaN, impactAge: Number.NaN, bump: Number.NaN, reduced: false })
  for (const value of Object.values(junk)) assert.ok(Number.isFinite(value))
})

test('both renderers animate the shared head pose instead of rebuilding geometry', () => {
  const premium = readFileSync(new URL('../src/arcade/kart/renderer3d.ts', import.meta.url), 'utf8')
  const flat = readFileSync(new URL('../src/arcade/kart/renderer.ts', import.meta.url), 'utf8')
  const model = readFileSync(new URL('../src/arcade/kart/models3d.ts', import.meta.url), 'utf8')
  assert.match(premium, /cabezonPose/)
  assert.match(flat, /cabezonPose/)
  assert.match(model, /HEAD_RADIUS/)
  assert.match(model, /head\.name='cabezon'/)
})
