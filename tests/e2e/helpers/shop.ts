import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

export const storefrontEndpoint = 'https://danzcolective.myshopify.com/api/2026-10/graphql.json'
export const storefrontFixture = () => JSON.parse(readFileSync(new URL('../../fixtures/storefront-catalog.json', import.meta.url), 'utf8'))

export async function mockShop(page: Page) {
  const data = storefrontFixture()
  const saved = JSON.parse(readFileSync(new URL('../../../src/shop/catalog.json', import.meta.url), 'utf8'))
  const images = new Map<string, string>()
  for (const product of data.data.collection.products.nodes) {
    const local = saved.products.find((item: { handle: string }) => item.handle === product.handle)
    product.images.nodes.forEach((image: { url: string }, index: number) => { if (local?.images[index]) images.set(image.url, local.images[index]) })
  }
  await page.route(storefrontEndpoint, route => route.fulfill({ json: data }))
  await page.route('https://cdn.shopify.com/s/files/1/0991/7910/2555/files/**', route => {
    const image = images.get(route.request().url())
    return image ? route.fulfill({ path: fileURLToPath(new URL('../../../public' + image, import.meta.url)), contentType: 'image/webp' }) : route.abort()
  })
}
