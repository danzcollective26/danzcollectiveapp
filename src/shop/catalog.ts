export type ShopVariant = { id: string; title: string; price: number; available: boolean }
export type ShopProduct = { handle: string; title: string; category: string; summary: string; images: string[]; variants: ShopVariant[] }
export type ShopCatalog = { schemaVersion: 1; syncedAt: string; storeUrl: string; collectionUrl: string; collectionName: string; currency: 'EUR'; products: ShopProduct[] }

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid shop data')
  return value as Record<string, unknown>
}
function text(value: unknown, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid catalog text')
  return value.trim()
}
function unique<T>(values: T[], id: (value: T) => string): T[] {
  if (new Set(values.map(id)).size !== values.length) throw new Error('Duplicate catalog entry')
  return values
}
export function storeImage(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cdn.shopify.com' && !url.username && !url.password && !url.port && !url.hash && /^\/s\/files\/1\/0991\/7910\/2555\/files\/[^/]+\.(?:png|jpe?g|webp)$/i.test(url.pathname)
  } catch { return false }
}
export function parseShopCatalog(input: unknown, allowStoreImages = false): ShopCatalog {
  const c = record(input)
  if (c.schemaVersion !== 1 || c.currency !== 'EUR' || c.storeUrl !== 'https://danzcollective.com' || c.collectionUrl !== 'https://danzcollective.com/pages/danzflor' || typeof c.syncedAt !== 'string' || !Number.isFinite(Date.parse(c.syncedAt)) || !Array.isArray(c.products)) throw new Error('Invalid catalog source')
  const products = c.products.map(raw => {
    const p = record(raw)
    const handle = text(p.handle, 80)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle) || !Array.isArray(p.images) || !Array.isArray(p.variants) || !p.variants.length) throw new Error('Invalid product')
    const images = p.images.map(value => {
      if (typeof value !== 'string' || (!/^\/shop\/[a-z0-9-]+\.(?:jpg|png|webp)$/.test(value) && !(allowStoreImages && storeImage(value)))) throw new Error('Use a public DANZ product image')
      return value
    })
    const variants = unique(p.variants.map(raw => {
      const v = record(raw)
      if (typeof v.id !== 'string' || !/^\d{1,20}$/.test(v.id) || typeof v.price !== 'number' || !Number.isSafeInteger(v.price) || v.price < 0 || typeof v.available !== 'boolean') throw new Error('Invalid variant')
      return { id: v.id, title: text(v.title, 80), price: v.price, available: v.available }
    }), v => v.id)
    return { handle, title: text(p.title), category: text(p.category, 60), summary: text(p.summary, 320), images, variants }
  })
  return { schemaVersion: 1, syncedAt: c.syncedAt, storeUrl: c.storeUrl, collectionUrl: c.collectionUrl, collectionName: text(c.collectionName), currency: 'EUR', products: unique(products, p => p.handle) }
}
export function priceLabel(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
export function productPrice(product: ShopProduct): string {
  const prices = product.variants.map(v => v.price)
  return `${Math.min(...prices) === Math.max(...prices) ? '' : 'Desde '}${priceLabel(Math.min(...prices))}`
}
export function productLink(product: ShopProduct, variant?: ShopVariant): string {
  const url = new URL(`/products/${encodeURIComponent(product.handle)}`, 'https://danzcollective.com')
  if (variant && product.variants.some(v => v.id === variant.id)) url.searchParams.set('variant', variant.id)
  return url.href
}
