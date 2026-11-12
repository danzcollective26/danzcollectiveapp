# Icono e instalación de DANZ

Actualización: 12 de noviembre de 2026, Europe/Madrid.

## Confirmado por el propietario

La galería y las descargas con DANZ Fotos 0.2 funcionan en su móvil. Solicitó corregir la flor clara que se pierde sobre el fondo blanco del lanzador y conservar **INSTALAR DANZ** como instalación principal de la PWA.

## Cambio aplicado

- Iconos PWA, favicon y Apple Touch Icon: flor negra sobre fondo blanco opaco. Nuevos nombres de archivo para que el navegador detecte el cambio, sin modificar `id`, `start_url`, `scope` o la instalación existente. Se conservan y actualizan los alias anteriores.
- El precaché incluye los nuevos iconos. No se borra almacenamiento, cuentas, pases ni álbumes. El cambio se aplica mediante el flujo de actualización ya existente.
- DANZ Fotos 0.3 (`com.danzcollective.photos`, código 3): mismo paquete, clave y permisos que 0.2; cambia el icono y el indicador de versión. Guardado, descargas y acceso a fotos no cambian.
- La página Android existente ofrece el APK 0.3. No se añade un aviso de APK a la pantalla principal ni se cambia el botón PWA. El complemento sigue siendo opcional.
- La flor clara de Snake y los símbolos internos sobre fondo oscuro conservan su diseño.

## Verificación

- Compilación web y 16 pruebas existentes de instalación, caché, preparación offline y protocolo Android correctas.
- Inspección en Chrome: guía PWA accesible con Android/iPhone y flor negra visible sobre blanco.
- PNG de 180, 192 y 512 píxeles y variante maskable, RGB opaco, dimensiones reales comprobadas.
- APK 0.3 compilado y firma verificada con herramientas oficiales Android. Certificado SHA-256: `80d56ce05b7d29ed0414948ae65cf42774b6febc9a49dec4f0aff6f5fccf3ea3`, igual al de 0.2. Solo permiso INTERNET. 25049 bytes; SHA-256 del APK: `cf53fdd439c98409eff99f712aeea60bbd0aeec2d8243090b44ce6f3c9a22ddc`.

## Límite en dispositivos ya instalados

Publicar la web no actualiza el APK instalado: para cambiar su icono hay que instalar la actualización 0.3 sobre 0.2. La renovación de un icono PWA existente depende del navegador/lanzador; no se ha comprobado su actualización automática en el teléfono del propietario. No desinstalar ni borrar datos para aplicar esta corrección.
