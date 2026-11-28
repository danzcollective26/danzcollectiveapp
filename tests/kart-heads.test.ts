import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enlargeFeatures, faceBoxFromPixels, nearestPalette, posterize, renderBalloon, skinScore } from '../src/arcade/kart/head/stylize.ts'
import { customDriverId, customDriverRef } from '../src/arcade/kart/head/identity.ts'
import { installHeadVault, listHeads, memoryVault, packHead, saveHead, deleteHead } from '../src/arcade/kart/head/store.ts'
import { DEFAULT_BUILD, normalizeBuild } from '../src/arcade/kart/garage.ts'
import { DEFAULT_KART_PREFERENCES, KART_PREFERENCES_KEY, readKartPreferences, saveKartPreferences } from '../src/arcade/kart/preferences.ts'

const ID = '10000000-0000-4000-8000-000000000001'

test('palette, face crop and balloon keep a recognisable face and empty corners', () => {
  assert.deepEqual(nearestPalette(228, 209, 176), [228, 209, 176])
  assert.equal(skinScore(210, 160, 130), 1)
  assert.equal(skinScore(20, 40, 50), 0)
  const width = 48, height = 48, data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4
    const skin = x > 12 && x < 34 && y > 8 && y < 36
    data[i] = skin ? 210 : 20; data[i + 1] = skin ? 160 : 40; data[i + 2] = skin ? 130 : 50; data[i + 3] = 255
  }
  const box = faceBoxFromPixels(width, height, data)
  assert.ok(box.x > 4 && box.y < 16 && box.x + box.width < 44 && box.y + box.height > 30)
  const grown = enlargeFeatures({ width, height, data })
  assert.equal(grown.data.length, data.length)
  posterize(grown)
  const colors = new Set<string>()
  for (let i = 0; i < grown.data.length; i += 4) colors.add(`${grown.data[i]},${grown.data[i + 1]},${grown.data[i + 2]}`)
  assert.ok(colors.size < 12)
  const balloon = renderBalloon({ width, height, data }, box)
  assert.equal(balloon.width, 256)
  assert.equal(balloon.data[3], 0)
  assert.equal(balloon.data[(128 * 256 + 128) * 4 + 3], 255)
})

test('a saved cabezón keeps only the drawing and can be deleted', async () => {
  installHeadVault(memoryVault())
  const png = 'data:image/png;base64,iVBORw0KGgo='
  const packed = packHead({ id: ID, name: '  Tronco!!  ', png, photo: 'secret-face' } as never)
  assert.deepEqual(Object.keys(packed).sort(), ['createdAt', 'id', 'name', 'png'])
  assert.equal(packed.name, 'Tronco')
  assert.equal('photo' in packed, false)
  await saveHead(packed)
  assert.equal((await listHeads())[0].id, ID)
  assert.equal(customDriverId(customDriverRef(ID)), ID)
  await deleteHead(ID)
  assert.deepEqual(await listHeads(), [])
  assert.throws(() => packHead({ id: 'not-a-face', name: 'X', png }))
  assert.equal(customDriverId('custom:../secret'), null)
})

test('custom drivers survive preferences and unknown ids fall back', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const data = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) } })
  try {
    const driver = customDriverRef(ID)
    const saved = { ...DEFAULT_KART_PREFERENCES, builds: [{ ...DEFAULT_BUILD, driver }, { ...DEFAULT_BUILD }] as typeof DEFAULT_KART_PREFERENCES.builds }
    saveKartPreferences(saved)
    assert.equal(readKartPreferences().builds[0].driver, driver)
    assert.equal(normalizeBuild({ driver: 'custom:not-valid' }).driver, DEFAULT_BUILD.driver)
    assert.equal(normalizeBuild({ driver }).driver, driver)
    assert.equal(data.get(KART_PREFERENCES_KEY)?.includes('photo'), false)
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
