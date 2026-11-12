"""Import the explicitly selected public DANZFLOR products; no admin credentials."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl
from urllib.request import Request, urlopen
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STORE = 'https://danzcollective.com'
ITEMS = [
    ('club-house-tee', 'Camisetas', 'Camiseta gris de algodón orgánico de 240 g/m², estampada en el estudio.'),
    ('disco-culture-tee', 'Camisetas', 'Camiseta en blanco crema, de algodón orgánico de 240 g/m². Estampada en el estudio.'),
    ('tracks-cocktails-tee', 'Camisetas', 'Camiseta blanca de algodón orgánico de 240 g/m², estampada en el estudio.'),
    ('swim-short', 'Baño', 'Bañador de poliéster reciclado con estampado de la colección y forro de malla.'),
    ('yepo-bag', 'Accesorios', 'Bolsa con cremallera de algodón orgánico de 280 g/m². Medidas publicadas: 40 × 35 cm.'),
]

def fetch(url, image=False):
    parsed = urlsplit(url)
    allowed = {'danzcollective.com', 'cdn.shopify.com'}
    if parsed.scheme != 'https' or parsed.hostname not in allowed or parsed.username or parsed.password or parsed.port:
        raise ValueError('Unexpected source URL')
    request = Request(url, headers={'Accept': 'image/webp,image/*' if image else 'application/json'})
    with urlopen(request, timeout=25) as response:
        final = urlsplit(response.geturl())
        if final.scheme != 'https' or final.hostname not in allowed:
            raise ValueError('Unexpected redirect')
        data = response.read(5 * 1024 * 1024 + 1)
        if len(data) > 5 * 1024 * 1024:
            raise ValueError('Source response too large')
        return data

def image_copy(handle, index, source):
    url = 'https:' + source if source.startswith('//') else source
    parsed = urlsplit(url)
    # Request the store CDN's ordinary responsive image. Keep its returned bytes.
    query = dict(parse_qsl(parsed.query)); query['width'] = '960'
    url = urlunsplit(parsed._replace(query=urlencode(query)))
    data = fetch(url, image=True)
    with Image.open(BytesIO(data)) as im:
        im.verify()
        ext = {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}.get(im.format)
    if not ext or len(data) > 1500 * 1024:
        raise ValueError('Invalid or oversized catalog image')
    path = f'/shop/{handle}-{index + 1}-{sha256(data).hexdigest()[:12]}.{ext}'
    return path, data, source

def product(item):
    handle, category, summary = item
    data = json.loads(fetch(f'{STORE}/products/{handle}.js'))
    if data.get('handle') != handle or not data.get('variants') or not data.get('images'):
        raise ValueError('Unexpected public product')
    images = [image_copy(handle, i, url) for i, url in enumerate(data['images'][:3])]
    variants = []
    for v in data['variants']:
        if type(v.get('price')) is not int or v['price'] < 0 or type(v.get('available')) is not bool:
            raise ValueError('Invalid variant')
        variants.append({'id': str(v['id']), 'title': 'Única' if v['title'] == 'Default Title' else v['title'], 'price': v['price'], 'available': v['available']})
    return {'handle': handle, 'title': data['title'], 'category': category, 'summary': summary,
            'images': [img[0] for img in images], 'variants': variants}, images

def main():
    currency = json.loads(fetch(f'{STORE}/cart.js')).get('currency')
    if currency != 'EUR':
        raise ValueError('Review the catalog currency before importing')
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(product, ITEMS))
    # Nothing is written until every product, variant and image has been received.
    destination = ROOT / 'public/shop'; destination.mkdir(parents=True, exist_ok=True)
    for _, images in results:
        for path, data, _ in images:
            (ROOT / 'public' / path.lstrip('/')).write_bytes(data)
    catalog = {'schemaVersion': 1, 'syncedAt': datetime.now(timezone.utc).isoformat(),
               'storeUrl': STORE, 'collectionUrl': STORE + '/pages/danzflor',
               'collectionName': 'Tracks & Cocktails', 'currency': currency,
               'products': [data for data, _ in results]}
    target = ROOT / 'src/shop/catalog.json'; target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp'); temporary.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
    source = {'retrievedAt': catalog['syncedAt'], 'method': 'Public Shopify Ajax Product API; manual snapshot, no runtime or admin connection.',
              'products': [{'url': f'{STORE}/products/{data["handle"]}.js', 'images': [src for _, _, src in images]} for data, images in results]}
    (ROOT / 'docs/DANZFLOR_FUENTES.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n')
    print(f'DANZFLOR: {len(results)} productos y {sum(len(images) for _, images in results)} imágenes públicas importados; moneda {currency}.')

if __name__ == '__main__':
    main()
