# Groove — música protegida

16 de noviembre de 2026. Publicado y verificado en PR 46.

El propietario autoriza publicar el código y reproducir Funky Fiesta y WTHIMH
con acceso protegido, sin botón de descarga y sin subir los audios a GitHub.

- Selector Funky Fiesta / WTHIMH / Ensayo; oleadas a semipulsos y Scratch a
  127 BPM aproximados. El reloj del audio gobierna la sesión, también en silencio.
- Pausa conserva el punto; salir/cambiar tema/cerrar sesión libera el audio.
  Carga espera, error permite reintentar o usar Ensayo. Récord por tema/modo.
- Los temas requieren sesión; Ensayo queda sin cuenta y offline. Se preparan
  los enlaces antes de pulsar JUGAR para conservar reproducción con gesto móvil.
- Funky también en radio, con renovación de enlaces conservando posición.
  Los otros seis temas mantienen su configuración anterior.
- Bucket privado `danz-music-private`; MP3 completos de 192 kbps fuera de Git.
  Originales conservados. Ambos archivos subidos; URLs públicas rechazadas.
- Función `danz-music-playback`, gateway JWT habilitado y validación con getUser.
  Rechaza invitados anónimos y peticiones sin sesión. Solo dos rutas fijas y
  120 s de validez; el cliente no elige bucket, ruta, TTL o modo descarga.
- CORS limitado, respuesta no-store y service role solo en variables del servidor.
  Sin permisos directos de lectura de ese bucket para los clientes.
- Validación de origen/ruta/validez del enlace, caché por usuario solo en memoria;
  cancelación al cambiar cuenta/pantalla. Sin audio o URLs firmadas en precaché.
- Controles propios sin descarga. Limita el acceso y la descarga visible; no
  evita toda grabación o extracción. No incluye nuevas recompensas competitivas.

267 pruebas internas y build locales correctos: autenticación, denegación,
rutas/TTL fijos, errores sin filtración, enlaces inválidos, separación por cuenta,
cancelación y ausencia de audios en Git. Escenarios de navegador con fixture
original sintetizado y usuarios ficticios; ningún master se publica en CI.

Backend conectado, CI y revisión pública verificados en el cierre siguiente. T01 conserva teléfonos físicos, GPU, FPS, batería y audio escuchado.
G04/G07 mantiene evaluación musical/diversión; G08, puntos, fotos, otros módulos,
entregas externas y QR mantienen sus estados.


## Cierre comprobado

- Merge `4b6e0082`, código probado `e448d25b`, producción READY
  `dpl_2hyyE5QNx8z96f47ZZaHw5SqcA8G`. Alias público y /test comprobados.
- CI 235: build, 267 internas, 582 navegador (194 por tamaño) y 16 offline
  correctos sin reintentos fallidos. Fixture musical propio; ningún master en CI.
- Ambos archivos reales: privados, lectura pública rechazada, reproducción por
  rangos 206 con sesión válida y MIME audio/mpeg. Sin sesión/JWT inválido 401,
  alteración de ruta/TTL 400, otro origen 403. Usuario sintético retirado; cero
  usuarios QA restantes y acceso de la cuenta borrada rechazado. Auxiliar cerrado.
- Revisión pública: selector de ambos temas, aviso de sesión y Ensayo jugable sin
  cuenta. Cambio de tema restaura sesión; ajustes legibles, controles >=44 px y
  sin desborde horizontal. Corregida una regla CSS que partía el carrusel en dos
  columnas dentro de ajustes; se conserva el menú, la física y la protección.
- Sin audios en la historia publicada de GitHub; el precaché tampoco contiene
  los archivos ni enlaces temporales. Service role solo en servidor.
- G02/G03 completos en este alcance. T01/G04/G07/G08 conservan sus límites.
  No se afirma reproducción oída en un teléfono físico ni protección absoluta
  contra captura de audio.
