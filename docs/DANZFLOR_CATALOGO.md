# DANZFLOR · catálogo público conectado, opción C

Actualización: 12 de noviembre de 2026 (Europe/Madrid).

Se mantiene la opción C autorizada: catálogo dentro de DANZ con enlace a la tienda existente. La colección pública Tracks & Cocktails se consulta mediante Storefront API, sin credenciales. Contiene actualmente Club House Tee, Disco Culture Tee, Tracks & Cocktails Tee, YEPO SWIM SHORT y Yepo Bag. La instantánea de la web 34 queda como respaldo.

## Comportamiento

- Cuadrícula con fotos, precios EUR, categorías y tallas; filtro de camisetas/baño/accesorios.
- Ficha interna, tres imágenes por producto, variantes y disponibilidad de la consulta. Historial Atrás y enlaces `?seccion=danzflor&producto=...`.
- «VER EN LA TIENDA» abre el producto y la variante en otra pestaña, conservando DANZ. No añade al carrito, cobra ni concede puntos.
- Se indica la fecha de consulta y que la tienda confirma precio y disponibilidad actuales. La consulta comprobó las camisetas a 38 €, el bañador a 40 € y Yepo Bag a 14 €, esta última agotada.
- Al abrir DANZFLOR se consulta la colección pública; productos, nombres, precios EUR, variantes, disponibilidad y fotos reflejan la respuesta actual. No se carga la web en un iframe. Se conserva el orden de la colección Shopify.
- Hay actualización manual y nueva consulta al volver a una pestaña tras cinco minutos desde el último intento. No hay un intervalo permanente en segundo plano. Salir de la sección cancela la solicitud y las respuestas tardías se ignoran.
- Si falla la consulta, se mantiene el catálogo anterior y su fecha con un mensaje visible; un error, moneda distinta o respuesta parcial nunca se presenta como información actualizada. Una colección válida vacía sí retira del listado las prendas antiguas.
- Las imágenes actuales proceden solo del directorio público de esta tienda en cdn.shopify.com. Ni ellas ni la API se incorporan al precaché. Los datos estáticos y quince imágenes guardadas siguen disponibles como respaldo; en modo sin conexión puede faltar alguna imagen.

## Fuente y actualización

`src/shop/catalog.json` es la instantánea manual de respaldo. `docs/DANZFLOR_FUENTES.json` conserva su procedencia. Las imágenes guardadas son la respuesta pública del CDN a ancho 960, sin editar el contenido ni usar fotos privadas.

La consulta actual usa **https://danzcolective.myshopify.com/api/2026-10/graphql.json** y `collection(handle: "tracks-cocktails")`, con contexto de mercado ES/EUR. El dominio permanente se verificó en el objeto público Shopify.shop de la web del colectivo. Se probó HTTP 200, API 2026-10, CORS permitido y cinco productos completos, coste solicitado 107. También se comprobó la consulta real desde Chrome dentro de la app, con el estado «Catálogo actualizado desde la tienda» y hora actual.

`src/shop/storefront.ts` envía únicamente una consulta GraphQL pública de productos, sin cookies, cabecera de autenticación, token, sesión DANZ ni datos de cuenta. No hay mutaciones de carrito, pedidos o clientes. Valida precios en céntimos, moneda, IDs, imágenes de esta tienda y respuesta completa antes de cambiar la vista. La consulta tiene un límite total de diez segundos, hasta cinco páginas de veinte productos y hasta veinte variantes por producto; si se exceden esos límites, se mantiene el respaldo y se indica fallo de actualización en lugar de truncar en silencio. Las descripciones españolas existentes siguen siendo resúmenes editoriales; las prendas nuevas usan la descripción pública de la tienda.

`python3 scripts/sync-shopify-catalog.py` consulta únicamente los cinco handles declarados mediante la API pública Ajax de producto, comprueba moneda EUR, variantes e imágenes antes de guardar la instantánea. Requiere Python y Pillow. Ejecutar después compilación, pruebas de catálogo y revisión visual; publicar la nueva versión. Los resúmenes en español son editoriales a partir de las descripciones públicas y deben revisarse si cambia una prenda.

Documentación técnica consultada: https://shopify.dev/docs/api/ajax/reference/product . El precio Ajax se expresa en la moneda de presentación; se comprobó EUR en `https://danzcollective.com/cart.js`. No se ejecutaron solicitudes de carrito ni checkout.

La conexión de administración Shopify de ChatGPT sigue siendo independiente. El acceso administrativo previo estaba bloqueado por la passkey Google de otra persona; la consulta pública documentada por Shopify permite actualizar el catálogo sin cambiar esa seguridad. No se han cambiado credenciales, creado usuarios ni enviado invitaciones.

Lectura del catálogo en vivo implementada. Carrito propio, gestión de pedidos, compras verificadas y puntos requieren una fase posterior autorizada; el cliente no puede acreditar recompensas.

## Verificación

La versión inicial del catálogo pasó la compilación web y **108 pruebas internas**, incluidas cuatro de catálogo: moneda/precio en céntimos, variantes agotadas, enlaces de producto y rechazo de datos/rutas inválidas. En Chrome compartido se comprobaron filtros, ficha de Yepo Bag agotada, cambio de imagen, retorno con filtro y foco conservados, talla L de Club House Tee con su URL exacta y recarga de una ficha mediante enlace profundo.

La web 34 completó su CI **43136224590**, job **130912104943**: **108 pruebas internas, 8 PWA y 279 E2E correctas**. Ya no está pendiente. La revisión a 390/320 px de esa versión no equivalía a prueba física móvil.

La lectura en vivo añade siete pruebas de lógica sobre actualización de precio/stock, céntimos exactos, paginación, rechazo de respuestas parciales, colección vacía, imágenes de otra tienda, cancelación y tiempo límite. La compilación y las **115 pruebas internas completas** pasan. Las E2E nuevas simulan respuestas de tienda, imágenes, error y recuperación sin efectuar compras. Registrar el CI del nuevo árbol cuando termine; no reutilizar los resultados de la web 34 para atribuirlos al cambio en vivo.

En Chrome se verificó además la consulta real y la ausencia de desbordamiento horizontal a 320 y 390 px de ancho útil. Una página de prueba local (no incluida en dist) confirmó el respaldo al fallar la red, el reintento con precio/stock simulados y la conservación de esa última respuesta correcta ante un segundo fallo. Esto no equivale a una prueba física en Android o iPhone ni modifica los precios de la tienda.

Documentación pública de Shopify consultada: https://shopify.dev/docs/api/storefront/2026-10 y https://shopify.dev/docs/api/storefront/2026-10/queries/collection . El acceso público sin token se limita a las funciones documentadas; no concede acceso administrativo.
