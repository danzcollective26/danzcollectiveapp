# Groove — música protegida

16 de noviembre de 2026. Integración y publicación en curso.

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

Pendiente de registrar al cerrar: backend conectado, CI, capturas y revisión
pública. T01 conserva teléfonos físicos, GPU, FPS, batería y audio escuchado.
G04/G07 mantiene evaluación musical/diversión; G08, puntos, fotos, otros módulos,
entregas externas y QR mantienen sus estados.
