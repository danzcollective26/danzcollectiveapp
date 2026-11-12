import { useEffect, useRef, useState } from 'react'
import source from './catalog.json'
import { parseShopCatalog, priceLabel, productPrice, productLink, type ShopProduct } from './catalog'
import { useShopCatalog } from './useShopCatalog'
import './DanzShop.css'

const baseline = parseShopCatalog(source)
const requested = () => new URLSearchParams(window.location.search).get('producto')

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed || !src ? <span className="shop-image-missing">Imagen no disponible</span> : <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
}

function ProductDetail({ product, onBack }: { product: ShopProduct; onBack: () => void }) {
  const [image, setImage] = useState(0)
  const [variantId, setVariantId] = useState(() => (product.variants.find(v => v.available) ?? product.variants[0]).id)
  const variant = product.variants.find(v => v.id === variantId) ?? product.variants.find(v => v.available) ?? product.variants[0]
  const currentImage = Math.max(0, Math.min(image, product.images.length - 1))
  const heading = useRef<HTMLHeadingElement>(null)
  const detail = useRef<HTMLDivElement>(null)
  useEffect(() => { detail.current?.scrollIntoView({ block: 'start' }); heading.current?.focus({ preventScroll: true }) }, [])
  return <div ref={detail} className="shop-detail">
    <button className="back shop-catalog-back" onClick={onBack}>← VOLVER AL CATÁLOGO</button>
    <div className="shop-product-gallery">
      <div className="shop-detail-image"><ProductImage key={product.images[currentImage]} src={product.images[currentImage]} alt={`${product.title} · imagen ${currentImage + 1}`} />{product.images.length > 0 && <span className="shop-image-count">{currentImage + 1} / {product.images.length}</span>}</div>
      <div className="shop-thumbnails" role="group" aria-label={`Imágenes de ${product.title}`}>
        {product.images.map((src, index) => <button key={src} type="button" aria-pressed={index === currentImage} aria-label={`Ver imagen ${index + 1}`} onClick={() => setImage(index)}><ProductImage key={src} src={src} alt="" /></button>)}
      </div>
    </div>
    <div className="shop-detail-copy">
      <div className="shop-kicker">DANZFLOR / {product.category.toUpperCase()}</div>
      <h2 ref={heading} tabIndex={-1}>{product.title}</h2>
      <p className="shop-detail-price">{priceLabel(variant.price)}</p>
      <p className="shop-summary">{product.summary}</p>
      <fieldset className="shop-variants"><legend>{product.variants.length > 1 ? 'TALLA' : 'VARIANTE'}</legend>
        {product.variants.map(v => <label key={v.id} className={`${v.id === variant.id ? 'is-selected' : ''}${!v.available ? ' is-unavailable' : ''}`}><input type="radio" name={`shop-variant-${product.handle}`} value={v.id} checked={v.id === variant.id} onChange={() => setVariantId(v.id)} /><span>{v.title}</span>{!v.available && <small>Agotada</small>}</label>)}
      </fieldset>
      <p className={`shop-stock${variant.available ? '' : ' is-unavailable'}`} role="status"><span aria-hidden="true">●</span> {variant.available ? 'Disponible al consultar' : 'Agotado al consultar'}</p>
      <a className="primary-btn shop-store-link" href={productLink(product, variant)} target="_blank" rel="noopener noreferrer">VER EN LA TIENDA <span aria-hidden="true">↗</span></a>
      <p className="shop-checkout-note">La tienda confirma el precio, las tallas y la disponibilidad actuales.</p>
    </div>
  </div>
}

export default function DanzShop() {
  const { catalog, checking, failed, refresh } = useShopCatalog(baseline)
  const consulted = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date(catalog.syncedAt))
  const [handle, setHandle] = useState<string | null>(requested)
  const [category, setCategory] = useState('Todo')
  const selected = catalog.products.find(p => p.handle === handle)
  const categories = ['Todo', ...new Set(catalog.products.map(p => p.category))]
  const activeCategory = categories.includes(category) ? category : 'Todo'
  const visibleProducts = catalog.products.filter(p => activeCategory === 'Todo' || p.category === activeCategory)
  const previous = useRef<string | null>(null)
  useEffect(() => {
    const back = () => setHandle(requested())
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, [])
  useEffect(() => {
    if (!selected && previous.current) document.getElementById(`shop-card-${previous.current}`)?.focus({ preventScroll: true })
  }, [selected])
  function open(product: ShopProduct) {
    previous.current = product.handle
    const url = new URL(window.location.href)
    url.searchParams.set('seccion', 'danzflor'); url.searchParams.set('producto', product.handle)
    try { window.history.pushState({ ...window.history.state, danzShopDetail: true }, '', url) } catch { /* The local view remains usable. */ }
    setHandle(product.handle)
    window.scrollTo({ top: 0 })
  }
  function back() {
    if (window.history.state?.danzShopDetail) { window.history.back(); return }
    const url = new URL(window.location.href); url.searchParams.delete('producto')
    try { window.history.replaceState(window.history.state, '', url) } catch { /* Local navigation still works. */ }
    setHandle(null)
  }
  return <div className="danz-shop">
    <div className="shop-sync-row"><p role="status" className="shop-sync-message">{checking ? 'Consultando novedades en la tienda…' : failed ? 'No se ha podido actualizar. Mostramos la última consulta disponible.' : 'Catálogo actualizado desde la tienda.'}</p><button type="button" className="outline-btn" onClick={refresh} disabled={checking}>{checking ? 'ACTUALIZANDO…' : 'ACTUALIZAR CATÁLOGO'} <span aria-hidden="true">↻</span></button></div>
    {selected ? <ProductDetail key={selected.handle} product={selected} onBack={back} /> : <>
      {handle && <p role="status" className="shop-checkout-note">Esa prenda ya no aparece en este catálogo. Puedes explorar las demás.</p>}
      <div className="shop-collection-heading"><div><span className="shop-kicker">COLECCIÓN / SS2026 V1 RESORT</span><h2>{catalog.collectionName}</h2></div><a className="shop-all-link" href={catalog.collectionUrl} target="_blank" rel="noopener noreferrer">LA COLECCIÓN EN LA TIENDA ↗</a></div>
      <div className="shop-filter-row"><div className="shop-filters" role="group" aria-label="Tipo de prenda">{categories.map(value => <button key={value} type="button" aria-pressed={activeCategory === value} onClick={() => setCategory(value)}>{value}</button>)}</div><span className="shop-count">{visibleProducts.length} {visibleProducts.length === 1 ? 'PRENDA' : 'PRENDAS'}</span></div>
      {!catalog.products.length && <p className="shop-empty" role="status">La colección no tiene prendas publicadas ahora mismo. Puedes consultar las novedades en la tienda.</p>}
      <div className="shop-grid" aria-label="Catálogo DANZFLOR">
        {visibleProducts.map(product => <article className="shop-card" key={product.handle} aria-label={product.title}>
          <button id={`shop-card-${product.handle}`} className="shop-card-open" type="button" onClick={() => open(product)} aria-label={`Ver ${product.title}`}>
            <span className="shop-card-image"><ProductImage key={product.images[0]} src={product.images[0]} alt={product.title} /><span className="shop-card-tag">{product.category.toUpperCase()}</span>{!product.variants.some(v => v.available) && <span className="shop-sold-out">AGOTADO</span>}</span>
            <span className="shop-card-copy"><span><strong>{product.title}</strong><small>{product.variants.length > 1 ? product.variants.map(v => v.title).join(' / ') : 'Talla única'}</small></span><span className="shop-card-price">{productPrice(product)}<span className="shop-card-arrow" aria-hidden="true">↗</span></span></span>
          </button>
        </article>)}
      </div>
    </>}
    <p className="shop-freshness">Última consulta: {consulted}. Los precios y la disponibilidad pueden cambiar; se confirman en la tienda.</p>
  </div>
}
