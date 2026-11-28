import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BLOOM_DURATION_MS, arcadeIntroMedia, arcadeIntroSeenKey, readArcadeIntroSeen, rememberArcadeIntro, shouldPlayArcadeIntro } from '../src/arcade/arcadeIntros.ts'

test('Groove keeps its approved film; Jack, Collecta and DANZPORTER bloom into their approved covers', () => {
  const groove = arcadeIntroMedia('groove')
  assert.equal(groove?.kind, 'film')
  assert.equal(groove?.kind === 'film' && groove.src, '/arcade/intros/intro-grooveninja.mp4')
  assert.equal(groove?.kind === 'film' && groove.poster, '/arcade/intros/intro-grooveninja-poster.webp')
  const covers = { snake: '/arcade/jack-approved-mobile.webp', collecta: '/arcade/collecta-mobile-v1.webp', danzporter: '/arcade/danzporter-cover-v1.webp' } as const
  for (const [id, cover] of Object.entries(covers) as [keyof typeof covers, string][]) {
    const media = arcadeIntroMedia(id)
    assert.equal(media?.kind, 'bloom', id)
    assert.equal(media?.kind === 'bloom' && media.cover, cover, id)
    assert.ok(readFileSync(new URL(`../public${cover}`, import.meta.url)).length > 10_000, `${cover} exists`)
    assert.equal(shouldPlayArcadeIntro(id, false, false), true)
    assert.equal(shouldPlayArcadeIntro(id, true, false), false)
    assert.equal(shouldPlayArcadeIntro(id, false, true), false)
  }
  assert.ok(BLOOM_DURATION_MS >= 2500 && BLOOM_DURATION_MS <= 3500)
})

test('the bloom window uses the six-petal DANZ flower', () => {
  const svg = readFileSync(new URL('../public/brand/danz-flower.svg', import.meta.url), 'utf8')
  assert.equal((svg.match(/<circle /g) ?? []).length, 7)
  const source = readFileSync(new URL('../src/arcade/BloomIntro.tsx', import.meta.url), 'utf8')
  assert.equal((source.match(/r=\\?"20\\?"/g) ?? source.match(/r="20"/g) ?? []).length, 6)
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
