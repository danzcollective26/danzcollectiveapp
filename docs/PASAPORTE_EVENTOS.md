# Pases y pasaporte de eventos

Hito del 9 de noviembre de 2026. Continúa la demo privada y las cuentas por correo
ya verificadas por su propietario.

## Recorrido

- DANZERS permite introducir un código o abrir un enlace con fragmento `#pase=CODIGO`.
  El teléfono puede leer ese enlace con su cámara; la web no necesita acceder a la cámara.
- El código se retira de la barra de direcciones, se guarda en este navegador y no se
  confunde con el parámetro `?code=` del retorno de Supabase. Se admite un pase pendiente.
- Antes de registrarse el pase no concede acceso. Tras iniciar sesión, el usuario confirma
  «Guardar mi sello». El servidor vincula el sello exclusivamente a `auth.uid()`.
- Mis sellos muestra las asistencias de la cuenta y permite abrir su galería exacta.
  Los eventos archivados conservan el sello, el título y el acceso a sus fotos
  publicadas para asistentes anteriores; no admiten nuevos canjes.
- Repetir un canje de la misma cuenta/evento devuelve el sello original y no gasta más usos.
  Ante un fallo de red se puede reintentar con el mismo código.

## Servidor

`danz_redeem_event_code` y `danz_my_passport` son wrappers SECURITY INVOKER.
Las implementaciones privilegiadas están en `danz_private`, con search_path vacío,
identidad obligatoria y sin acceso de anon/PUBLIC. Las cuentas Auth anónimas tampoco
pueden invocarlas. El navegador sigue sin poder insertar asistencias, consultar hashes,
crear administradores o modificar eventos/códigos/fotos directamente.

El hash del código se busca por el índice único existente. Se bloquea primero la fila
de intentos de la cuenta y después el código durante la transacción: capacidad y sello
se actualizan juntos. Ocho intentos por cuenta cada diez minutos; los errores devueltos
conservan el contador. La tabla de intentos tiene RLS y no tiene permisos de cliente.
Los códigos inexistentes, caducados, revocados, agotados o de eventos no publicados
devuelven la misma respuesta sin metadatos del evento. Un sello obtenido previamente
no se retira por caducidad/revocación del código que lo emitió.

## Emisión de códigos y alcance

La interfaz administrativa para crear eventos y emitir/revocar sus códigos todavía
está pendiente. Este hito no crea eventos reales, códigos operativos ni asistencias
de usuarios existentes. No se han cargado ni migrado fotografías.

Al implementar la emisión, usar códigos aleatorios criptográficos de alta entropía,
de 12 a 64 letras mayúsculas/números. Se eliminan espacios y guiones para el canje.
Guardar únicamente SHA-256 hexadecimal de la representación normalizada en `code_hash`;
el código en claro solo se entrega al administrador para el QR/código del evento.
Configurar expiración/cupo/revocación según el evento. No usar un UUID de evento como pase.

Un código compartido puede reenviarse: el canje demuestra posesión del código, no
presencia física. Este hito no implementa geolocalización, prueba física de asistencia,
validación de entradas pagadas, premios canjeables ni correo de recuperación del pase.
El guardado previo al registro depende del navegador; después del canje, el sello vive
en la cuenta. No borrar eventos para archivarlos: el esquema histórico tiene cascadas.

## Validación

- `npm test`: 42/42, incluidas 10 pruebas PostgreSQL aisladas del canje/pasaporte y
  3 de interpretación de códigos/enlaces. Regresiones de Auth, RLS, Storage y Snake correctas.
- `npm run build`: TypeScript y Vite correctos.
- Añadidos 5 recorridos Playwright, repetidos en escritorio, tablet y móvil en CI:
  guardado previo a login, canje y galería concreta, errores/reintento, archivo/recarga
  de sellos y cambio de cuenta con respuesta de canje tardía.
- PGlite usa una conexión: valida resultados y permisos, pero no reproduce contención
  entre varias conexiones PostgreSQL. La concurrencia se protege mediante locks SQL;
  no se declara una prueba de carga o contención remota completada.
- Estado de aplicación remota, CI y revisión visual: se registra en `VERIFICACION_CODEX.md`.
