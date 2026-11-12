# Preparación sin conexión en el alojamiento publicado

12 de noviembre de 2026.

La navegación a `/index.html` en la web 36 termina en `/`. En esa versión se observó de nuevo el aviso de preparación sin conexión fallida en Chrome compartido. El service worker intentaba precargar `/index.html` con `redirect: error`, por lo que el servidor podía impedir instalar el shell al redirigir esa ruta.

La corrección solicita directamente `/` para obtener el HTML y conserva `/index.html` como clave interna estable de caché. El resto de recursos y el fallback de navegación no cambian. Se mantienen el rechazo de redirecciones, la comprobación de origen, MIME y marcador DANZ; una página de acceso del alojamiento no puede presentarse como shell de la app. APIs, callbacks, enlaces con parámetros, originales privados y catálogo externo siguen fuera del precaché.

La nueva prueba reproduce un alojamiento que rechaza la petición a `/index.html` por la redirección y permite `/`; verifica instalación y recuperación sin red. Las pruebas anteriores de acceso privado, MIME y bypass continúan pasando. Resultado local: compilación y **116 pruebas internas correctas**. La comprobación final de la versión publicada y el CI se registran en el documento de continuidad.

El aviso «Snake disponible sin conexión» solo se muestra cuando el navegador confirma la activación. No implica que galerías privadas o catálogo externo funcionen sin Internet, ni sustituye una prueba física en Android/iPhone.

El trabajo de Equipo está aparcado en `work/equipo-pendiente-2026-11-12`, fuera de esta entrega, a petición del propietario hasta que facilite nombres y perfiles.
