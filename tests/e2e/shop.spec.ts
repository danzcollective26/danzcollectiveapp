import { expect, test } from '@playwright/test'
import { mockShop, storefrontEndpoint, storefrontFixture } from './helpers/shop'

test.beforeEach(async ({ page }) => { await mockShop(page) })

test('DANZFLOR reads only the public catalog, filters and returns through browser history', async ({ page }) => {
  const outgoing: string[] = []
  page.on('request', request => { if (/danzcollective\.com|shopify\.com/.test(new URL(request.url()).hostname)) outgoing.push(request.url()) })
  await page.goto('/?seccion=danzflor')
  await expect(page.getByRole('article')).toHaveCount(5)
  await page.getByRole('button', { name: 'Accesorios', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Ver Yepo Bag', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Yepo Bag', exact: true })).toBeVisible()
  await expect(page.locator('.shop-stock')).toContainText('Agotado al consultar')
  await expect(page.getByRole('link', { name: 'VER EN LA TIENDA' })).toHaveAttribute('href', /^https:\/\/danzcollective\.com\/products\/yepo-bag\?variant=\d+$/)
  await page.goBack()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Ver Yepo Bag', exact: true })).toBeFocused()
  expect(outgoing.some(url => url === storefrontEndpoint)).toBe(true)
  expect(outgoing.every(url => url === storefrontEndpoint || url.startsWith('https://cdn.shopify.com/s/files/1/0991/7910/2555/files/'))).toBe(true)
})

test('a product deep link survives reload, selects a size, and opens only the store in a new tab', async ({ page, context }) => {
  await context.route('https://danzcollective.com/products/club-house-tee?variant=*', route => route.fulfill({ contentType: 'text/html', body: '<h1>Tienda de prueba</h1>' }))
  await page.addInitScript(() => localStorage.setItem('danz-pending-event-pass', 'DANZSHOP12345678'))
  await page.goto('/?seccion=danzflor&producto=club-house-tee')
  await expect(page.getByRole('heading', { name: 'Club House Tee', exact: true })).toBeVisible()
  await page.getByRole('radio', { name: 'L', exact: true }).press('Space')
  await expect(page.getByRole('link', { name: 'VER EN LA TIENDA' })).toHaveAttribute('href', 'https://danzcollective.com/products/club-house-tee?variant=52782613758299')
  const opened = context.waitForEvent('page')
  await page.getByRole('link', { name: 'VER EN LA TIENDA' }).click()
  const store = await opened
  await expect(store.getByRole('heading', { name: 'Tienda de prueba' })).toBeVisible()
  expect(await store.evaluate(() => window.opener === null)).toBe(true)
  await store.close()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Club House Tee', exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe('DANZSHOP12345678')
  await page.getByRole('button', { name: 'VOLVER AL CATÁLOGO' }).click()
  await expect(page.getByRole('article')).toHaveCount(5)
  expect(new URL(page.url()).searchParams.has('producto')).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('missing product images leave the catalog and detail usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.route(/\/shop\/[a-z0-9-]+\.(?:png|jpg|webp)(?:\?|$)/, route => route.abort())
  await page.route('https://cdn.shopify.com/**', route => route.abort())
  await page.goto('/?seccion=danzflor')
  await expect(page.getByRole('button', { name: 'Ver Club House Tee', exact: true })).toContainText('Imagen no disponible')
  await page.getByRole('button', { name: 'Ver Club House Tee', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Club House Tee', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'VER EN LA TIENDA' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('a current store response updates price and sold-out status without changing the saved local catalog', async ({ page }) => {
  const data = storefrontFixture()
  for (const variant of data.data.collection.products.nodes[0].variants.nodes) { variant.price.amount = '45.5'; variant.availableForSale = false }
  await page.route(storefrontEndpoint, route => route.fulfill({ json: data }))
  await page.goto('/?seccion=danzflor&producto=club-house-tee')
  await expect(page.getByText('Catálogo actualizado desde la tienda.', { exact: true })).toBeVisible()
  await expect(page.locator('.shop-detail-price')).toHaveText(/45,50\s€/)
  await expect(page.locator('.shop-stock')).toContainText('Agotado al consultar')
  expect(await page.evaluate(() => localStorage.getItem('danz-snake-best-v1'))).toBeNull()
})

test('a connection failure keeps the previous catalog visible and an explicit retry restores current data', async ({ page }) => {
  let fail = true
  await page.route(storefrontEndpoint, route => fail ? route.abort() : route.fulfill({ json: storefrontFixture() }))
  await page.goto('/?seccion=danzflor')
  await expect(page.getByText('No se ha podido actualizar. Mostramos la última consulta disponible.', { exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(5)
  fail = false
  await page.getByRole('button', { name: 'ACTUALIZAR CATÁLOGO' }).click()
  await expect(page.getByText('Catálogo actualizado desde la tienda.', { exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(5)
})
