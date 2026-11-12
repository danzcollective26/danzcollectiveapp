import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseShopCatalog, productLink, productPrice } from '../src/shop/catalog.ts'

const sample = () => ({ schemaVersion: 1, syncedAt: '2026-11-11T23:00:00Z', storeUrl: 'https://danzcollective.com', collectionUrl: 'https://danzcollective.com/pages/danzflor', collectionName: 'Example collection', currency: 'EUR', products: [{ handle: 'test-shirt', title: 'Example shirt', category: 'Camisetas', summary: 'Test item', images: ['/shop/test-shirt-1-123456789abc.jpg'], variants: [{ id: '1234', title: 'S', price: 3800, available: false }, { id: '1235', title: 'M', price: 4000, available: true }] }] })

test('catalog preserves the source date, prices in cents and unavailable variants', () => {
  const c = parseShopCatalog(sample())
  assert.equal(c.syncedAt, '2026-11-11T23:00:00Z')
  assert.equal(c.products[0].variants[0].available, false)
  assert.equal(c.products[0].variants[1].price, 4000)
  assert.match(productPrice(c.products[0]), /^Desde 38,00\s€$/)
})

test('product links select an existing variant on the official store without creating a cart', () => {
  const p = parseShopCatalog(sample()).products[0]
  assert.equal(productLink(p, p.variants[1]), 'https://danzcollective.com/products/test-shirt?variant=1235')
  assert.equal(productLink(p, { ...p.variants[1], id: '999' }), 'https://danzcollective.com/products/test-shirt')
  assert.equal(productLink(p), 'https://danzcollective.com/products/test-shirt')
})

test('rejects unexpected currencies, source origins, dates and image paths', () => {
  for (const change of [{currency:'USD'}, {storeUrl:'https://danzcollective.com.evil.example'}, {collectionUrl:'javascript:alert(1)'}, {syncedAt:'unknown'}, {schemaVersion:2}]) assert.throws(() => parseShopCatalog({ ...sample(), ...change }))
  for (const path of ['https://cdn.example/photo.jpg', '/shop/../private.jpg', '/private/photo.jpg', '/shop/a.svg', '/shop/a.jpg?token=private']) {
    const c = sample(); c.products[0].images = [path]
    assert.throws(() => parseShopCatalog(c))
  }
})

test('rejects duplicate products, ambiguous variants and invalid prices or availability', () => {
  const duplicate = sample(); duplicate.products.push(duplicate.products[0])
  assert.throws(() => parseShopCatalog(duplicate))
  const variants = sample(); variants.products[0].variants.push(variants.products[0].variants[0])
  assert.throws(() => parseShopCatalog(variants))
  for (const price of [-1, 1.5, NaN, Infinity]) {
    const c = sample(); c.products[0].variants[0].price = price
    assert.throws(() => parseShopCatalog(c))
  }
  const invalid = sample(); Object.assign(invalid.products[0].variants[0], { available: 'true' })
  assert.throws(() => parseShopCatalog(invalid))
})
