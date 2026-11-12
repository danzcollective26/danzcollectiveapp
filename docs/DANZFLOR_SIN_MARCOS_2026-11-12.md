# DANZFLOR: producto recortado sobre el fondo

El propietario pidió mostrar las prendas procedentes de Shopify sin marcos, como un PNG recortado sobre el fondo de la app. Se inspeccionaron los archivos del catálogo: las imágenes de producto de las cinco prendas (frente/reverso) son WebP RGBA con alfa 0..255. Las fotografías de campaña conservan fondo fotográfico. No hace falta regenerar prendas ni modificar sus estampados.

Se retira el fondo papel de catálogo, detalle y miniaturas. Etiquetas de categoría y contador pierden sus rectángulos claros. La miniatura seleccionada usa una línea inferior discreta, manteniendo la indicación de selección y el foco de teclado. Se conserva el color del producto, proporción, fotos originales, sincronización de Shopify, variantes, precios y enlaces. Las nuevas fotos que lleguen con fondo incorporado necesitarán su correspondiente imagen recortada en origen; CSS no elimina fondos fotográficos.
