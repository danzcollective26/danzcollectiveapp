import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arcadeIntroMedia, arcadeIntroSeenKey, readArcadeIntroSeen, rememberArcadeIntro, shouldPlayArcadeIntro } from '../src/arcade/arcadeIntros.ts'

test('only Groove has an intro film; the other arcade games start straight away', () => {
  assert.equal(arcadeIntroMedia('groove')?.src, '/arcade/intros/intro-grooveninja.mp4')
  assert.equal(arcadeIntroMedia('groove')?.poster, '/arcade/intros/intro-grooveninja-poster.webp')
  assert.equal(arcadeIntroMedia('snake'), null)
  assert.equal(arcadeIntroMedia('collecta'), null)
  assert.equal(arcadeIntroMedia('danzporter'), null)
  for (const id of ['snake', 'collecta', 'danzporter'] as const) assert.equal(shouldPlayArcadeIntro(id, false, false), false)
})

test('a film plays once per session and never when motion is reduced', () => {
  assert.equal(shouldPlayArcadeIntro('groove', false, false), true)
  assert.equal(shouldPlayArcadeIntro('groove', true, false), false)
  assert.equal(shouldPlayArcadeIntro('groove', false, true), false)
  const memory = new Map<string, string>()
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) } }
  assert.equal(readArcadeIntroSeen('groove', storage), false)
  rememberArcadeIntro('groove', storage)
  assert.equal(memory.get(arcadeIntroSeenKey('groove')), '1')
  assert.equal(readArcadeIntroSeen('groove', storage), true)
  assert.equal(readArcadeIntroSeen('snake', storage), false)
  assert.equal(readArcadeIntroSeen('groove', { getItem: () => { throw new Error('blocked') } }), false)
  assert.doesNotThrow(() => rememberArcadeIntro('groove', { setItem: () => { throw new Error('blocked') } }))
})

test('intro films stay out of the offline shell and the component does not bundle the bytes', () => {
  const worker = readFileSync(new URL('../scripts/build-service-worker.mjs', import.meta.url), 'utf8')
  const list = worker.slice(worker.indexOf('const paths = ['), worker.indexOf('].sort()'))
  assert.equal(list.includes('.mp4'), false)
  assert.equal(list.includes('/arcade/intros/'), false)
  const component = readFileSync(new URL('../src/arcade/ArcadeIntro.tsx', import.meta.url), 'utf8')
  assert.match(component, /playsInline/)
  assert.doesNotMatch(component, /import\.meta\.glob|from ['"].*\.mp4['"]/)
  assert.match(readFileSync(new URL('../src/arcade/GrooveNinja.tsx', import.meta.url), 'utf8'), /ArcadeIntro gameId="groove"/)
})
