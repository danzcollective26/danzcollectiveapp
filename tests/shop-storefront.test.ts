import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseShopCatalog } from '../src/shop/catalog.ts'
import { euroCents, fetchStorefrontCatalog, parseStorefrontPage, STOREFRONT_ENDPOINT } from '../src/shop/storefront.ts'

const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/storefront-catalog.json', import.meta.url), 'utf8'))
const baseline = () => parseShopCatalog(JSON.parse(readFileSync(new URL('../src/shop/catalog.json', import.meta.url), 'utf8')))
const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

test('Storefront refresh reads the public collection without credentials and applies changed price and availability', async () => {
  const data = fixture()
  const variant = data.data.collection.products.nodes[0].variants.nodes[0]
  variant.price.amount = '42.75'; variant.availableForSale = false
  const result = await fetchStorefrontCatalog(baseline(), new AbortController().signal, async (url, options) => {
    assert.equal(url, STOREFRONT_ENDPOINT)
    assert.equal(options?.method, 'POST')
    assert.equal(options?.credentials, 'omit')
    assert.equal(options?.redirect, 'error')
    assert.equal(options?.cache, 'no-store')
    assert.deepEqual(options?.headers, { 'Content-Type': 'application/json', Accept: 'application/json' })
    assert.match(JSON.parse(String(options?.body)).query, /^query DanzCatalog/)
    return json(data)
  }, () => Date.parse('2026-11-12T02:00:00Z'))
  assert.equal(result.syncedAt, '2026-11-12T02:00:00.000Z')
  assert.equal(result.products[0].variants[0].price, 4275)
  assert.equal(result.products[0].variants[0].available, false)
  assert.equal(result.products[0].variants[0].id, '52782613692763')
  assert.match(result.products[0].images[0], /^https:\/\/cdn\.shopify\.com\/s\/files\/1\/0991\/7910\/2555\//)
})

test('currency conversion preserves cents exactly and rejects malformed or different-currency prices', () => {
  assert.equal(euroCents('38.0', 'EUR'), 3800)
  assert.equal(euroCents('0.01', 'EUR'), 1)
  assert.equal(euroCents('0', 'EUR'), 0)
  for (const amount of ['1.005', '-1', 'NaN', '1e3', ' 38 ', '999999999999999999', 38, null]) assert.throws(() => euroCents(amount, 'EUR'))
  assert.throws(() => euroCents('38.0', 'USD'))
})

test('pagination replaces the catalog only after all pages are valid; a partial failure returns no current data', async () => {
  const first = fixture(), second = fixture()
  first.data.collection.products.nodes = first.data.collection.products.nodes.slice(0, 2)
  first.data.collection.products.pageInfo = { hasNextPage: true, endCursor: 'next-page' }
  second.data.collection.products.nodes = second.data.collection.products.nodes.slice(2)
  let calls = 0
  const result = await fetchStorefrontCatalog(baseline(), new AbortController().signal, async (_, options) => {
    assert.equal(JSON.parse(String(options?.body)).variables.after, calls ? 'next-page' : null)
    return json(calls++ ? second : first)
  })
  assert.equal(result.products.length, 5)
  calls = 0
  await assert.rejects(fetchStorefrontCatalog(baseline(), new AbortController().signal, async () => calls++ ? json({ errors: [{ message: 'unavailable' }] }) : json(first)))
})

test('empty published collections replace old products; unknown products can lack photos', () => {
  const empty = fixture(); empty.data.collection.products.nodes = []
  assert.deepEqual(parseStorefrontPage(empty, baseline()).products, [])
  const fresh = fixture(); const p = fresh.data.collection.products.nodes[0]
  p.handle = 'new-design'; p.title = 'New Tee'; p.images.nodes = []
  assert.equal(parseStorefrontPage(fresh, baseline()).products[0].category, 'Camisetas')
  assert.deepEqual(parseStorefrontPage(fresh, baseline()).products[0].images, [])
})

test('rejects partial variants, errors, duplicate products, another collection and another store image', () => {
  for (const change of [
    (d: any) => { d.errors = [{ message: 'partial' }] },
    (d: any) => { d.data.collection.handle = 'another-collection' },
    (d: any) => { d.data.collection.products.nodes[0].variants.pageInfo.hasNextPage = true },
    (d: any) => { d.data.collection.products.nodes[0].variants.nodes[0].price.currencyCode = 'USD' },
    (d: any) => { d.data.collection.products.nodes[0].images.nodes[0].url = 'https://cdn.shopify.com/s/files/1/0000/0000/0000/files/photo.png' },
    (d: any) => { d.data.collection.products.nodes.push(d.data.collection.products.nodes[0]) },
  ]) { const data = fixture(); change(data); assert.throws(() => parseStorefrontPage(data, baseline())) }
})

test('leaving the view rejects a late response even if a transport ignores cancellation', async () => {
  const controller = new AbortController()
  let finish: (response: Response) => void = () => { throw new Error('Request not started') }
  const pending = fetchStorefrontCatalog(baseline(), controller.signal, () => new Promise(resolve => { finish = resolve }))
  controller.abort(); finish(json(fixture()))
  await assert.rejects(pending, { name: 'AbortError' })
})

test('a hanging catalog request ends after ten seconds and does not leave an indefinite loading state', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const pending = fetchStorefrontCatalog(baseline(), new AbortController().signal, (_, options) => new Promise((_, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  }))
  t.mock.timers.tick(10000)
  await assert.rejects(pending, { name: 'AbortError' })
})
