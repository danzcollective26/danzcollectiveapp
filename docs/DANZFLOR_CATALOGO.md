# DANZFLOR · catálogo inicial, opción C

Actualización: 12 de noviembre de 2026 (Europe/Madrid).

Se mantiene la opción C autorizada: catálogo dentro de DANZ con enlace a la tienda existente. Se incluyen los cinco productos visibles en la página pública DANZFLOR: Club House Tee, Disco Culture Tee, Tracks & Cocktails Tee, YEPO SWIM SHORT y Yepo Bag.

## Comportamiento

- Cuadrícula con fotos, precios EUR, categorías y tallas; filtro de camisetas/baño/accesorios.
- Ficha interna, tres imágenes por producto, variantes y disponibilidad de la consulta. Historial Atrás y enlaces `?seccion=danzflor&producto=...`.
- «VER EN LA TIENDA» abre el producto y la variante en otra pestaña, conservando DANZ. No añade al carrito, cobra ni concede puntos.
- Se indica la fecha de consulta y que la tienda confirma precio y disponibilidad actuales. La consulta comprobó las camisetas a 38 €, el bañador a 40 € y Yepo Bag a 14 €, esta última agotada.
- Metadatos y fotos públicas están incluidos en DANZ; entrar al catálogo no envía peticiones a Shopify ni carga la web en un iframe. Las imágenes no se añaden al precaché de instalación; el catálogo puede mostrarse sin sus imágenes si falla la red.

## Fuente y actualización

`src/shop/catalog.json` es una **instantánea manual**, no una sincronización permanente ni una conexión administrativa Shopify. `docs/DANZFLOR_FUENTES.json` registra las URLs públicas y la fecha. Las imágenes públicas se conservan como respuesta del CDN para ancho 960, sin editar el contenido ni usar fotos privadas.

`python3 scripts/sync-shopify-catalog.py` consulta únicamente los cinco handles declarados mediante la API pública Ajax de producto, comprueba moneda EUR, variantes e imágenes antes de guardar la instantánea. Requiere Python y Pillow. Ejecutar después compilación, pruebas de catálogo y revisión visual; publicar la nueva versión. Los resúmenes en español son editoriales a partir de las descripciones públicas y deben revisarse si cambia una prenda.

Documentación técnica consultada: https://shopify.dev/docs/api/ajax/reference/product . El precio Ajax se expresa en la moneda de presentación; se comprobó EUR en `https://danzcollective.com/cart.js`. No se ejecutaron solicitudes de carrito ni checkout.

La integración oficial Shopify de ChatGPT existe, pero no está instalada/conectada en esta cuenta según la consulta del 12/11. El acceso administrativo previo estaba bloqueado por la passkey Google de otra persona. Este catálogo usa información pública para avanzar; no se han cambiado credenciales, creado usuarios ni enviado invitaciones.

Siguiente fase: conexión Storefront autorizada para datos en vivo, configuración de productos/canales y actualización fiable; después, si se solicita, carrito/checkout Shopify y puntos por compras verificadas. El cliente no puede acreditar pedidos o recompensas.

## Verificación

Compilación web correcta y **108 pruebas internas correctas**, incluidas cuatro nuevas de catálogo: moneda/precio en céntimos, variantes agotadas, enlaces de producto y rechazo de datos/rutas inválidas. En Chrome compartido se comprobaron filtros, ficha de Yepo Bag agotada, cambio de imagen, retorno con filtro y foco conservados, talla L de Club House Tee con su URL exacta y recarga de una ficha mediante enlace profundo.

Revisión visual mediante la vista local y un contenedor de prueba con 390/320 píxeles útiles: catálogo/ficha sin desbordamiento horizontal, imágenes de prendas visibles y controles legibles. No equivale a prueba física en móvil. Las pruebas E2E incluidas cubren además apertura externa, conservación del pase local y fallo de imagen; su resultado de CI debe consultarse antes de declararlas aprobadas. No se intentó arrancar otro Chromium en el executor, cuya restricción de sockets ya se había observado en el trabajo anterior; la revisión utilizó Chrome compartido.
