import { parseShopCatalog, type ShopCatalog } from './catalog.ts'

export const STOREFRONT_ENDPOINT = 'https://danzcolective.myshopify.com/api/2026-10/graphql.json'
export const STOREFRONT_QUERY = `query DanzCatalog($after: String) @inContext(country: ES, language: ES) {
  collection(handle: "tracks-cocktails") {
    title handle
    products(first: 20, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle title description productType
        images(first: 3) { nodes { url(transform: {maxWidth: 960}) } }
        variants(first: 20) {
          pageInfo { hasNextPage }
          nodes { id title availableForSale price { amount currencyCode } }
        }
      }
    }
  }
}`

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid store response')
  return value as Record<string, unknown>
}
function nodes(value: unknown): unknown[] {
  const connection = record(value)
  if (!Array.isArray(connection.nodes)) throw new Error('Missing store list')
  return connection.nodes
}
export function euroCents(amount: unknown, currency: unknown): number {
  if (currency !== 'EUR' || typeof amount !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(amount)) throw new Error('Unexpected price or currency')
  const [whole, decimal = ''] = amount.split('.')
  const cents = Number(whole) * 100 + Number((decimal + '00').slice(0, 2))
  if (!Number.isSafeInteger(cents)) throw new Error('Price is out of range')
  return cents
}
function category(type: string, title: string): string {
  const text = `${type} ${title}`.toLowerCase()
  if (/\b(bag|tote|bolsa|bolso)\b/.test(text)) return 'Accesorios'
  if (/swim|bañador/.test(text)) return 'Baño'
  if (/\b(tee|t-shirt|camiseta)\b/.test(text)) return 'Camisetas'
  return 'Más prendas'
}

/** Accept an entire valid page; never relabel partial data as a current catalog. */
export function parseStorefrontPage(input: unknown, baseline: ShopCatalog) {
  const response = record(input)
  if (response.errors !== undefined && response.errors !== null && (!Array.isArray(response.errors) || response.errors.length)) throw new Error('Store query failed')
  const collection = record(record(response.data).collection)
  if (collection.handle !== 'tracks-cocktails' || typeof collection.title !== 'string') throw new Error('Unexpected collection')
  const connection = record(collection.products)
  const page = record(connection.pageInfo)
  if (typeof page.hasNextPage !== 'boolean' || (page.hasNextPage && (typeof page.endCursor !== 'string' || !page.endCursor || page.endCursor.length > 1024))) throw new Error('Invalid store pagination')
  const products = nodes(connection).map(raw => {
    const p = record(raw)
    if (typeof p.handle !== 'string' || typeof p.title !== 'string') throw new Error('Invalid store product')
    const existing = baseline.products.find(product => product.handle === p.handle)
    const variants = record(p.variants)
    if (record(variants.pageInfo).hasNextPage !== false) throw new Error('Product has additional variants; keep the previous catalog')
    return {
      handle: p.handle, title: p.title,
      category: existing?.category ?? category(typeof p.productType === 'string' ? p.productType : '', p.title),
      summary: existing?.summary ?? (typeof p.description === 'string' && p.description.trim() ? p.description.trim().slice(0, 300) : 'Descubre los detalles de esta prenda en la tienda.'),
      images: nodes(p.images).map(raw => record(raw).url),
      variants: nodes(variants).map(raw => {
        const v = record(raw), price = record(v.price)
        if (typeof v.id !== 'string' || !/^gid:\/\/shopify\/ProductVariant\/\d{1,20}$/.test(v.id) || typeof v.title !== 'string') throw new Error('Invalid store variant')
        return { id: v.id.split('/').at(-1), title: v.title === 'Default Title' ? 'Única' : v.title, available: v.availableForSale, price: euroCents(price.amount, price.currencyCode) }
      }),
    }
  })
  const validated = parseShopCatalog({ ...baseline, collectionName: collection.title, products }, true)
  return { products: validated.products, title: validated.collectionName, cursor: page.hasNextPage ? page.endCursor as string : null }
}

/** Public, read-only catalog access. No account, cookies, access token or cart. */
export async function fetchStorefrontCatalog(baseline: ShopCatalog, signal: AbortSignal, fetcher: typeof fetch = fetch, now: () => number = Date.now): Promise<ShopCatalog> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) controller.abort()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    let cursor: string | null = null, title = baseline.collectionName
    const products: ShopCatalog['products'] = []
    const seen = new Set<string>()
    for (let page = 0; page < 5; page++) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const response = await fetcher(STOREFRONT_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
        signal: controller.signal, body: JSON.stringify({ query: STOREFRONT_QUERY, variables: { after: cursor } }),
      })
      if (!response.ok || !/json/i.test(response.headers.get('Content-Type') ?? '')) throw new Error('Store is unavailable')
      const body = await response.text()
      if (body.length > 2 * 1024 * 1024) throw new Error('Store response too large')
      const result = parseStorefrontPage(JSON.parse(body), baseline)
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      products.push(...result.products); title = result.title
      if (!result.cursor) return parseShopCatalog({ ...baseline, products, collectionName: title, syncedAt: new Date(now()).toISOString() }, true)
      if (seen.has(result.cursor)) throw new Error('Repeated store cursor')
      seen.add(result.cursor); cursor = result.cursor
    }
    throw new Error('Catalog exceeds the current page limit')
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', cancel)
  }
}
