# Recuperación en Codex

Origen: DANZ-Codex-Codigo-Paso10.zip. Extraído en un entorno independiente;
no se accedió ni modificó el ordenador original ni sus fotografías.

Verificado el 9 de noviembre de 2026:
- Instalación de dependencias y generación de package-lock.json.
- npm run build: TypeScript y Vite correctos.
- Chromium automatizado: crear álbum, cargar PNG sintético, recargar y
  recuperar foto desde IndexedDB, abrir/cerrar visor y vista de asistente.
- Navegación Inicio/Fotos/Arcade en 390, 768 y 1280 píxeles sin desbordamiento.
- Sin errores JavaScript durante estos recorridos.

Pendiente: prueba completa de Snake y controles táctiles, dispositivos físicos,
autenticación, integración Supabase, QR/sellos y PWA. La vista de asistente
es una simulación local, sin autorización real.

## Hito de continuidad — 9 de noviembre de 2026

- Base recuperada guardada en GitHub privado, commit `b73ba92`.
- ZIP fuente SHA-256:
  `4cb567a219688aa6c442c03fb7a6e38fb3ddee06ef81abc939eb17c6e9b702cc`.
- Snake: reglas extraídas a módulo; bloqueo de giros inválidos, victoria al
  completar tablero, deslizamiento, botones opcionales persistentes y pausa
  al cambiar de sección o recibir evento de ocultación de pestaña.
- `npm test`: **10/10** pruebas del motor correctas.
- `npm run build`: TypeScript y Vite correctos con el estado actualizado.
- Suite integrada Playwright con servidor propio (`CI=true`), Chromium del
  entorno: **27/27** recorridos correctos (9 en cada tamaño 1280/768/390).
- Fotos: creación y aislamiento de álbumes, subida de PNG sintético,
  persistencia tras recarga, visor, descarga, simulación de asistente,
  edición, cancelación/confirmación de borrado y rechazo de formatos no válidos.
- Snake: teclado, giro por movimiento, pausa/reinicio, gesto táctil Chromium
  CDP sin scroll, preferencia de botones y pausa al cambiar de sección.
  `visibilitychange` se simula porque Chromium headless no cambia su estado
  al abrir otra pestaña; no sustituye prueba física del ciclo de vida móvil.
- Configurada automatización de estas verificaciones en GitHub Actions.
  Este registro acredita la ejecución local; el resultado remoto debe
  comprobarse en Actions y no se presupone correcto por tener el workflow.
- Supabase inspeccionado solo en lectura. Tipos e informe en el repositorio;
  propuestas SQL locales sin aplicar y sin validación funcional todavía.

Hubo una primera ejecución integrada fallida por reutilizar un servidor de
pruebas que otra ejecución había cerrado (ERR_CONNECTION_REFUSED); se repitió
con servidor propio y sin ejecuciones concurrentes. No se migraron fotos ni
se modificó el proyecto remoto de Supabase.

Pendiente: cuentas/login, permisos de galería privada y Storage, QR/sellos,
PWA y despliegue. Snake sigue siendo prototipo 13×13; faltan branding final,
rostros, Labyrinth y puntos de servidor. Probar en iPhone/Android físicos.

## Cuentas y galerías privadas — 9 de noviembre de 2026

Implementado: cliente Supabase tipado con clave publicable y versiones fijadas,
inicio de sesión por enlace PKCE/código opcional de correo, validación mediante
`getUser()`, cierre local y perfil propio. La interfaz separa galerías privadas
de la demo IndexedDB, sin subir ni migrar fotografías automáticamente.

Se muestran únicamente eventos/fotos permitidos por RLS, con firma de objetos
privados durante 60 segundos, renovación visible, visor y descarga temporal.
Las respuestas tardías de otra cuenta/evento no se muestran. Cerrar sesión
borra la vista privada incluso si la petición de revocación al servidor falla;
se comunica ese fallo. Un logout antiguo tampoco cierra una cuenta nueva.
Los códigos residuales de callbacks sin verificador se limpian sin autorizar.

Base de datos: recuperadas las cuatro migraciones históricas del servidor.
Después de 15 pruebas SQL aisladas se aplicó
`20261108234457_danz_private_gallery_client_access` al proyecto existente.
Se verificaron privilegios/denegaciones sin leer filas privadas; la API REST
real devolvió HTTP 401 al rol anónimo en las siete consultas LIMIT 0. El bucket
sigue privado. No se crearon usuarios de prueba ni se subieron objetos al remoto.

Validación local final por suites:
- `npm test`: 29/29 (15 permisos SQL, 4 helpers Auth, 10 reglas Snake).
- `npm run build`: TypeScript y Vite correctos.
- Cuentas: 21/21 recorridos Chromium (7 por tamaño), incluidos PKCE positivo,
  código opcional, errores/rate limit, perfil, logout y callback sin verificador.
- Privadas: 21/21 recorridos (7 por tamaño), incluidos aislamiento de cuenta,
  respuestas tardías, rutas públicas rechazadas y renovación denegada.
- Álbumes locales/Snake: 27/27 recorridos del bloque integrado, conservados.
- GitHub Actions ejecuta el conjunto completo con claves y endpoints ficticios,
  PostgreSQL aislado y fotografías sintéticas.

Límites: las pruebas de navegador interceptan Auth/Storage; no se enviaron
correos reales, ni se validaron SMTP/plantilla/allowlist, emisión real de URLs
con cuenta y objetos, ni iPhone/Android físicos. PGlite es PostgreSQL 18.6 y
el remoto 17.11; las comprobaciones remotas verifican DDL/permisos reales,
pero no sustituyen una prueba completa con cuentas autorizadas. Una firma
caducada no revoca una copia ya descargada ni purga cachés externas.

Pendiente: entorno accesible de prueba y validación del correo real,
administración autenticada/MFA/subidas de nube, QR/sellos, recompensas,
PWA y despliegue. No está listo como lanzamiento de producción.

## Preparación de demo privada — 9 de noviembre de 2026

Hosting declarado como estático Vite (`dist`) para Sites, sin migración de
framework ni cambio del backend. Se añadió meta referrer=no-referrer para
limitar la propagación de parámetros de retorno y recursos privados.

La guía de correo/móvil registra la URL concreta de retorno y las limitaciones
de la conexión Supabase para modificar Auth config. No se envían correos de
prueba ni se cambian permisos/SMTP por la publicación.

En este entorno faltan los scripts auxiliares de Sites. Se conserva el contrato
nativo mediante Git autenticado con credencial recibida por stdin sin archivos
ni argumentos, compilación Vite y tar de `.openai/hosting.json` más `dist`.
No se incluyen `.env.local`, originales, copias, tests ni código fuente en ese tar.

SITES_MANAGED_LINUX_CONTAINER=1 y cua_repl.js no disponible: se omite browser QA
de esta publicación conforme a Sites. Compilación y revisión de referencias
estáticas verificadas; las pruebas de aplicación del hito anterior siguen
siendo evidencia del código, no una validación del sitio alojado ni del móvil.

Publicación confirmada por Sites:
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site
- Acceso: privado del propietario, conservado por operación privada nativa.
- Project ID: appgprj_6af1179413088191b92fa5b50e37fdb2.
- Deployment ID: appgdep_6af1188347a4819191e2fe0165d96844; estado succeeded.
- Versión: appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_1a805fdba1d88191b3fb8c47ca4663a5.
- Source Sites: a4b2ea9d57fb369253aa77182889b16a196e671f; árbol idéntico al
  commit GitHub 5121883 de preparación. Tar solo manifest y dist, validado.
- CI GitHub de 5121883 completó con éxito instalación, pruebas, build y
  recorridos de navegador: actions/runs/42542095932.

Esta anotación posterior solo actualiza documentación; no cambia la aplicación
publicada. La guía de correo contiene el ajuste pendiente de Redirect URLs.
No se anunció recepción de email ni validación visual/móvil como completadas.


## Confirmación real de correo y sesión móvil — 9 de noviembre de 2026

El propietario confirmó la prueba personal de acceso por correo en la demo
publicada y que la sesión continúa iniciada tras recargar Cuenta en el móvil.
Supabase corroboró una cuenta con email confirmado e inicio de sesión reciente
mediante consulta agregada; no se leyeron direcciones, códigos o tokens.

Quedan validados ese correo/cuenta y ese navegador/dispositivo. No equivale a
validación de envíos a cualquier asistente, todos los navegadores, permisos
administrativos ni carga de fotografías reales. No se migraron galerías.

Esta actualización es documental y no cambia la versión alojada.

## Canje de códigos y pasaporte — 9 de noviembre de 2026

Implementados DANZERS con pase por fragmento QR/código, guardado antes del registro,
canje en servidor y pasaporte por cuenta. El sello abre su galería y permanece visible
al archivar el evento. Las implementaciones privilegiadas están fuera de `public`;
los wrappers de API son invoker. Rate limit por cuenta y locks de código controlan
reintentos, capacidad y duplicados sin permitir escribir asistencias desde cliente.

Validación local: 42/42 pruebas correctas y compilación TypeScript/Vite correcta.
Añadidos 15 recorridos de navegador a CI (cinco casos en tres tamaños).
No se han creado eventos reales, códigos ni sellos remotos de asistentes.
Queda pendiente la interfaz de administración para emitir códigos y el resto
del alcance descrito en `PASAPORTE_EVENTOS.md`.

Aplicada en Supabase `20261109041611_danz_event_passport`. Se sincronizó el
nombre local con la versión emitida por el servidor tras aplicar por MCP.
Prueba remota bajo rol authenticated: canje, repetición idempotente, pasaporte,
acceso RLS al evento y contador de un solo uso correctos; denegación anon correcta.
Se usaron filas sintéticas en una única transacción terminada en ROLLBACK:
no queda ninguna cuenta, evento, código o asistencia de esta comprobación.
La revisión de privilegios confirmó que anon no ejecuta los RPC, el cliente no
lee intentos ni inserta asistencias y todas las funciones fijan search_path.

GitHub Actions de `0e1a87b`: 42/42 pruebas de reglas/SQL y **84/84 recorridos
Chromium** correctos, ejecución `42560869423` (escritorio/tablet/móvil).
La revisión visual con el navegador de preview confirmó captura de enlace,
guardado, recarga y descarte del pase pendiente; se corrigió contraste del formulario.
El host de preview de Vite se limita explícitamente a `terminal.local`.
Los recorridos de Auth/Storage/canje del navegador son simulados; no sustituyen
una prueba física de canje con un evento operativo, que aún no se ha creado.

Advisors: sin nuevos avisos WARN de base de datos; se mantienen el aviso previo
de protección de contraseñas filtradas (el acceso actual es por correo sin contraseña)
y los INFO de RLS sin policies en tablas deliberadamente cerradas al cliente.


### Versión publicada del pasaporte

- GitHub: `6f45061781ae4155e9852614e417d071440e4f4b`.
- GitHub Actions: ejecución `42561344207` terminada correctamente: 42/42
  pruebas locales/SQL y 84/84 recorridos Chromium, además de instalación y build.
- Source Sites: `ae7deda705214ff4253111af4dc4730b8ac1eef0`; su árbol se comparó con GitHub y es idéntico.
- Deployment: `appgdep_6af14a735a04819191b947968f8a681e`, estado `succeeded`.
- Versión Sites: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_82a9457ef2608191b3d11d0468ff2549`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site
- Acceso privado del propietario conservado; publicación por operación privada.
- Archivo de despliegue generado mediante el helper de Sites y build Vite correcto.

Próximo bloque pendiente: administración autenticada de eventos, emisión/revocación
  de códigos y QR, y prueba del primer canje operativo. No se ha anunciado un evento
  real, ni se han creado códigos operativos o enviado correos en este hito.

Esta anotación posterior solo actualiza documentación; no cambia la aplicación publicada.

## Administración de eventos y códigos — 9 de noviembre de 2026

Preparado el panel de creación/edición/publicación/archivo de eventos y emisión
de códigos con caducidad/cupo, QR descargable y revocación confirmada.
Permisos events.manage/codes.manage separados, sin autoasignación del cliente.
Los RPC requieren identidad válida, membresía/alcance actual y aal2; sus wrappers
públicos son invoker y las implementaciones privilegiadas permanecen privadas.
La app incorpora configuración TOTP y verificación de factores ya inscritos.
El QR de acceso se genera localmente; solo se transmite su hash, no el código.
Los reintentos de emisión reutilizan ID/hash para evitar códigos duplicados.

Validación local: 52/52 pruebas de reglas/SQL y build TypeScript/Vite correctos.
Se añadieron seis casos Playwright en tres tamaños (18 recorridos). Su resultado
remoto y el despliegue se registrarán al completarse, sin presumirlos correctos.
La vinculación real del autenticador requiere al propietario y no se ha realizado
de forma automática. No se han publicado eventos ni emitido códigos operativos.


### Administración publicada y verificada

- Migración remota: `20261109054826_danz_admin_events_codes`.
- Comprobación PostgreSQL remota bajo roles authenticated/anon: MFA obligatoria,
  creación/publicación, emisión idempotente, canje y revocación correctos. Todas
  las filas sintéticas se descartaron mediante ROLLBACK.
- Cuenta del colectivo confirmada: membresía administrativa y los dos alcances
  habilitados con comprobación exacta de identidad. Cero factores verificados al
  terminar: no se inscribió un autenticador en nombre del propietario.
- Seguridad remota: RLS en permisos, sin INSERT del cliente, sin EXECUTE directo
  del helper de autorización, sin EXECUTE anónimo y sin definers públicos.
- Advisors conserva únicamente los avisos previos documentados; sin nuevos WARN.
- GitHub: `c1f6cb4eeb3ed18c65d0ff36a649fdb61c7ea9eb`.
- Actions `42569400095`: instalación, 52/52 pruebas, build y
  **102/102 recorridos Chromium** correctos (escritorio, tablet y móvil).
- Source Sites: `75e24038083c70795410f884324bd392c30c9773`, árbol idéntico
  al commit GitHub probado. El bundle administrativo/QR se carga por separado.
  Vite informa de un chunk principal de aproximadamente 502 kB; aviso no bloqueante.
- Deployment: `appgdep_6af15f822bb481919e0a2dea5bacd53d`, estado `succeeded`.
- Versión: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_a00df9b728ac8191a29927eda5c5b424`.
- URL privada: https://danz-collective-demo.right-vine-9666.chatgpt.site

Primer paso del propietario: Cuenta → Abrir administración → Configurar dos pasos.
Usar el QR o la clave manual desde su aplicación de autenticación y verificar el
código en la web. Esta prueba física no se ha simulado como completada. Los tests
MFA de navegador usan respuestas sintéticas; no se enviaron correos ni se crearon
factores reales. No quedan eventos ni pases operativos de las comprobaciones.

Pendientes: prueba física del primer acceso/canje, subidas/moderación de fotografías,
PWA instalable, delegación de permisos desde la interfaz y siguientes hitos de Arcade.
Esta anotación posterior es documental y no cambia la aplicación publicada.


## Acceso por correo entre navegadores — 9 de noviembre de 2026

El propietario aportó una captura Android del error de enlace caducado/navegador.
La implementación PKCE anterior exige el almacenamiento del navegador solicitante;
abrir desde otra vista es una causa compatible con lo observado. La captura por sí
sola no distingue caducidad, reutilización y cambio de navegador. Se consultaron
logs agregados sin exponer correos ni credenciales; no demuestran una causa única.

Preparado el canje verifyOtp con token_hash/email para enlaces que no dependen de
un verificador local, con limpieza inmediata de credenciales de URL, canje compartido
entre montajes y validación posterior getUser. Se mantiene la validación PKCE de
los enlaces anteriores. Los formularios permiten introducir email+código recibido
sin haber hecho la solicitud en ese navegador y limpian avisos antiguos al reintentar.
La pantalla distingue un verificador ausente de un código caducado y ofrece recuperación.

54/54 pruebas locales y compilación correctas. Añadidas pruebas de dos contextos
independientes, uso único, persistencia y rechazo de token caducado con recuperación
por código. La plantilla lista para Magic Link/Confirm Signup está en
supabase/email-templates/passwordless.html. No contiene tokens reales.

ACTIVACIÓN PENDIENTE: el Dashboard Supabase pide inicio de sesión y la conexión
no edita Auth config. La plantilla del proveedor todavía no se ha cambiado. Los
correos actuales conservan su formato anterior; no declarar que los nuevos enlaces
ya se estén enviando. La app no modifica la plantilla por publicarse. No se han
enviado correos de prueba, solicitado contraseñas por chat ni cambiado permisos/MFA.

## Galería por tandas y conservación — 9 de noviembre de 2026

Implementados carga en borrador con permiso administrativo/MFA, reserva de espacio,
deduplicación por evento/checksum, originales sin recomprimir, vistas previas,
revisión/publicación por selección y paginación. Los asistentes conservan acceso a
las fotos publicadas de eventos archivados. Ver GALERIA_Y_ALMACENAMIENTO.md.

62/62 pruebas locales y build correctos. Ocho pruebas SQL nuevas comprueban MFA,
scopes, idempotencia, RLS de objetos, cargas incompletas, publicación/cuarentena,
histórico, presupuesto y revocación. Las suites históricas prueban su estado de
migración anterior; la suite nueva comprueba el esquema final con estas funciones.

La descarga local de Chromium no fue un ZIP válido. El navegador de preview
confirmó el acceso privado de Fotos. Se añadieron recorridos Playwright para GitHub;
Actions `42577021541`, commit `bc801e2`, completó instalación, **62/62 pruebas**,
build y **117/117 recorridos Chromium** en escritorio/tablet/móvil. Los casos nuevos
verifican conservación de bytes del original, borradores/publicación confirmada,
deduplicación, rechazo de 601 archivos/formato no permitido y parada por presupuesto.

Aplicada la migración `20261109070504_danz_gallery_batches`. Su archivo local se
sincronizó con la versión del servidor (sin cambiar SQL). Una transacción remota
comprobó MFA, deduplicación, INSERT de objetos limitado a reserva, finalización,
publicación y acceso del asistente tras archivar; terminó en ROLLBACK.
Advisors no añadió WARN de seguridad; conserva el aviso previo de contraseñas
filtradas y los INFO previstos. No se han subido fotos reales, creado eventos
operativos ni activado planes de pago. La plantilla del correo continúa pendiente.

## Instalación y modo sin conexión — 9 de noviembre de 2026

Añadidos manifest/iconos, instalación guiada Android/iPhone, confirmación real
de instalación, estado sin conexión y actualizaciones por confirmación. El
service worker precarga exclusivamente el shell estático y rechaza el HTML de
la puerta de acceso privada. Auth, callbacks con query, fotos, URLs firmadas,
canjes y backup no se guardan en su caché. La audiencia de Sites se conserva.
El juego y los álbumes explícitamente locales no requieren una identidad validada.

Corregido el botón del pasaporte para abrir también galerías archivadas: la
base de datos y Fotos ya lo permitían desde el hito de tandas. No hay cambios
de esquema, permisos remotos ni nuevos registros de usuarios/eventos.

68/68 pruebas locales (seis nuevas del service worker, exclusiones y manifest)
y build correctos. Se incorporan recorridos de instrucciones/instalación y un
recorrido sobre build de producción con service worker real y red cortada en
Chromium. Actions `42715435217`, commit `1cc2fdc`, confirmó **68/68 pruebas**,
**120/120 recorridos Chromium** de aplicación y **2/2 recorridos de producción**
sin red (escritorio y móvil). Estos últimos abren de nuevo la aplicación, juegan
a Snake y verifican que no se cachean fotos ni credenciales de callbacks.
Instalación física, Safari y paso por la puerta privada desde PWA pendientes.

La investigación del bloqueo de Source confirmó la restricción de Supabase
Free para nuevos proyectos con correo predeterminado. El formulario SMTP de
las capturas está vacío; no se presupone guardado por ver un switch verde.
El propietario indicó que el dominio lo gestiona otra persona. El procedimiento
está en ACTIVACION_CORREO.md. No se han configurado SMTP/DNS, enviado correos,
creado cuentas de proveedores ni contratado servicios.

Entrega publicada con acceso privado conservado:
- Source Sites: `071bb9c1788706bcb6ccebed720ef0cf2bf5df9f`.
- Árbol de source probado: `9a1942951a7bb606363c9a82388edff3189e15ec`, idéntico
  al commit de GitHub verificado por CI. Backend de producción comprobado en
  el build; no se ha empaquetado el backend ficticio de los tests.
- Deployment: `appgdep_6af24f434eec81919345f22b347cf8f7`, estado `succeeded`.
- Versión: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_3b6f358589448191b487d2a4218ebad2`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site

Esta anotación posterior solo registra resultados; no modifica el bundle publicado.

## App independiente y perfiles de DJs — 10 de noviembre de 2026

El propietario pidió continuar sin acceso a la web/dominio del colectivo.
`src/content/collective.json` deja el enlace externo opcional en null; la
PWA y sus retornos de Auth conservan su propio origen. No se ha cambiado
el proveedor de cuentas, la audiencia privada ni la base de datos remota.

Integrados los perfiles aportados de Chicharro (ES), TonyDawgs, Wizme y LEÖN:
15 enlaces oficiales con presentación común y sin parámetros de seguimiento.
Se resolvieron los tres enlaces cortos SoundCloud y se contrastaron los cuatro
nombres con Spotify oEmbed. El enlace de una pista de LEÖN se cambió al perfil
como pidió el propietario; el YouTube de TonyDawgs se identifica como DANZ IN
Records. No se copian biografías, fotografías ni estadísticas de terceros.

Snake acepta caras como comida y textura atenuada del cuerpo, y una cabeza
opcional. El propietario enviará el grupo completo más adelante; no hay caras
incorporadas ni animaciones individuales. Solo podrán precargarse imágenes
públicas de Arcade explícitas, con validación de rutas, firma y tamaño.

Preparada la vía de SMTP Gmail para pruebas pequeñas sin DNS, con parámetros
y pasos en ACTIVACION_CORREO.md. Requiere que el titular genere y guarde su
contraseña de aplicación directamente en Supabase. No se ha creado esa
credencial, guardado SMTP, modificado la plantilla remota ni enviado correos.
No se presenta Gmail como proveedor validado para un evento masivo.

Validación final: 73/73 pruebas de lógica y permisos, build correcto, revisión
visual local de los cuatro perfiles y Actions `42729093113` satisfactorio:
123/123 recorridos Chromium (escritorio, tablet y móvil) y 2/2 recorridos
de producción sin red. Estos tests no envían correos reales ni validan una
instalación física en Android/iPhone o Safari.

Publicación privada confirmada por el servicio:
- GitHub probado: `a5cd88ca76b36a597e14a292ab22a5c480baadaa`.
- Source Sites: `4487ecb9910bbcb3ecdd97d7a35f4d895b809dcd`.
- Árbol común: `bcc5185bfeddf1d9c99d0180e59647ee2bc41ba0`.
- Deployment: `appgdep_6af2671da3608191b1b786124c32d210`, estado `succeeded`.
- Versión: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_d845abcd258c8191acfa182fbd0c5a79`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site

El bundle contiene el backend de producción y excluye el de los tests.
El paquete no incluye archivos de entorno privados. Esta anotación posterior
solo registra resultados, sin modificar la aplicación publicada.

## Retratos y apertura de enlaces — 10 de noviembre de 2026

El propietario indicó que los enlaces no se abrían en su móvil y pidió fotos
con una presentación similar para todos los DJs. El despliegue anterior tenía
los 15 enlaces correctos en HTML pero solo se había comprobado su presencia,
no pulsar y volver en el navegador del usuario. No se atribuye una causa exacta
al móvil sin reproducirla: los anchors usaban target=_blank y se retira esa
dependencia de pestañas nuevas. La foto/nombre también enlaza al SoundCloud del
artista. Una URL de sección restaura DANZ IN al volver desde una plataforma.

Incorporadas las fotos oficiales de los cuatro perfiles Spotify proporcionados,
en su resolución de hasta 640 píxeles. Son archivos propios del catálogo público,
con fuentes y SHA-256 en FUENTES_RETRATOS_DJS.md. El acabado unificado se realiza
en CSS, sin regenerar caras ni cuerpos; Snake conserva sus caras pendientes.
Los retratos también entran en el precache explícito, sin datos privados.

Revisión local: navegación real en la misma pestaña a Spotify de Chicharro (ES)
y regreso a la sección de música confirmados en el navegador. Los 19 enlaces
(15 plataformas + 4 fotos/nombres) tendrán comprobación automática de navegación
nativa y retorno con destinos simulados. Estas pruebas no acreditan que cada
plataforma esté disponible ni que el teléfono del propietario esté verificado.

La activación SMTP sigue pendiente. Se dieron al propietario los primeros pasos
para la verificación de Google en su propia cuenta. No se ha generado ni recibido
una contraseña de aplicación, iniciado sesión en Google/Supabase por él ni
cambiado la configuración remota de Auth.

Validación final: 74/74 pruebas de lógica y permisos y build correctos. Actions
`42731314673` confirmó 126/126 recorridos Chromium en escritorio, tablet y móvil
simulado, incluidos los 19 enlaces y la vuelta a Inicio sin conservar una URL
de música desactualizada. Los 2/2 recorridos de producción sin conexión también
pasaron. La comprobación del teléfono físico del propietario sigue pendiente.

Publicación privada confirmada:
- GitHub probado: `4a5b281ce293455a835645cb4f99a2ae43481d4a`.
- Source Sites: `868a5cb7ed34a590cf8bef89f0a92e1e4e9219d1`.
- Árbol común: `83b237f3d6916b211a52f65d2e58ac894c2738b9`.
- Deployment: `appgdep_6af26b0c0ce48191b4b3f44930600067`, estado `succeeded`.
- Versión: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_76868431f8b88191b941694993ec94f9`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site

El paquete incluye las cuatro fotos del catálogo y el backend de producción,
sin archivos de entorno privados ni backend ficticio. El acceso sigue limitado
al propietario. Este registro posterior no modifica la aplicación publicada.

## Enlaces desde vista incrustada — 10 de noviembre de 2026

El propietario indicó que seguían sin abrirse al entrar desde el enlace de la
conversación. La prueba anterior de navegación había sido en una pestaña completa;
no demostraba el funcionamiento dentro de una vista incrustada. La versión 8
publicada se comprobó por el acceso de servicio oficial de Sites: index y bundle
actuales, fotos presentes y service worker bda862e9ad3d01b4. No se cambió la audiencia,
se envió la credencial solo al mismo Site y no se guardó en disco o en código.

Se cambia el destino nativo de los 19 enlaces de _self a _top: una pulsación
puede abrir el perfil fuera del iframe cuando el contenedor lo permite. Dentro
de una página completa conserva la misma pestaña. Guardar la sección de retorno
pasa a ser opcional si el contenedor prohíbe history.replaceState.

Nueva regresión: app dentro de un iframe de otro origen, sin popups y con
navegación superior permitida por interacción. El destino simulado prohíbe ser
incrustado (frame-ancestors none y X-Frame-Options DENY). Debe abrirse arriba y
volver a DANZ. El entorno exacto del móvil del propietario no está disponible;
esta prueba cubre una causa posible, no atribuye con certeza el fallo de su móvil.

El propietario confirmó creada la contraseña de aplicación Google. Se le indicó
pegarla directamente en el formulario SMTP de Supabase. No se recibió, almacenó
ni utilizó dicha contraseña; guardar SMTP y probar entrega siguen pendientes.

Corrección publicada con acceso privado conservado: source Sites
`9938f585f5660056e137bf8b3eb46eefdae9474c`, árbol probado
`1ac5c73c285218723e93fe104d47af7d7e2b9319`, commit GitHub
`e6b12b5624db364b59a93576a3b860e5d3408a8e`, Actions `42735181268`.
Confirmados 74/74 tests de lógica/permisos, 129/129 recorridos Chromium y 2/2
de producción sin red. Deployment `appgdep_6af272efa1408191bf6a8764459ddd98`
en succeeded; versión `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_8a4a7eeb3dec8191aaf1d2020d6d02cd`.

Las primeras dos ejecuciones de la prueba incrustada fallaron antes de cargar
la app. El trace de `42733647635` confirmó ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS:
el origen padre simulado se trataba como público. Se corrigió el harness para
usar una página padre real y dos orígenes loopback; no se deshabilitó ninguna
protección. Además, una comprobación visual real en Chrome abrió Spotify desde
un iframe y salió a la página completa. El fixture temporal se eliminó antes
de empaquetar. El entorno del teléfono del propietario sigue por validar.

El propietario reportó guardado SMTP con el aviso de proveedor personal Gmail.
Se explicó que el aviso no acredita ni impide por sí solo la entrega. Se le
indicó solicitar y abrir un correo nuevo desde el mismo Chrome. No se recibió
ninguna contraseña ni se confirmó todavía recepción por ese SMTP.

## Google, Apple y requisito de 200 altas — 10 de noviembre de 2026

El propietario concretó 200 altas en el día del evento y pidió acceso con Google
o Apple. Se preparan los flujos web PKCE y una consulta al endpoint público de
settings para mostrar solo proveedores explícitamente habilitados. Una lectura
real confirmó Google=false, Apple=false, email=true y registro permitido.
No se han activado proveedores, creado clientes externos, configurado secretos
ni contratado servicios. La contraseña SMTP no se usa para configurar OAuth.

El acceso social comienza en una página completa. Desde una vista incrustada,
se abre primero el mismo origen de la app, trasladando únicamente un pase
pendiente validado en el fragmento. La app retira el fragmento y conserva el
pase antes de crear el verificador OAuth. El callback sigue requiriendo getUser
verificado; los perfiles sociales no otorgan administración ni asistencia.

Gmail es provisional. La preparación del evento exige SMTP transaccional con
remitente autenticado, margen de reintentos y revisión de límites globales y por
IP, incluyendo asistentes en la misma Wi-Fi. No se ha hecho una prueba de carga
ni se presenta como acreditada la capacidad de 200 altas. El hosting de la demo
sigue privado para su propietario. Pasos y bloqueos en
ACCESO_GOOGLE_APPLE_200_ALTAS.md.

76/76 tests locales y build correctos. Se incorporan recorridos con API simulada
para Google/Apple, callback PKCE, pase pendiente, no envío OTP y salida del iframe.
Validación final: Actions `42737486491` confirmó 76/76 tests de lógica y permisos,
141/141 recorridos Chromium y 2/2 recorridos de producción sin red. Los tests
sociales verifican callbacks simulados de ambos proveedores, PKCE, identidad
comprobada con getUser, pase pendiente y ausencia de correo OTP en ese flujo.
No se han usado cuentas reales de Google/Apple ni medido 200 altas.

Preparación publicada con audiencia privada conservada:
- GitHub probado: `51fc499faefbaae8e9e8608a005e07f562bf42f0`.
- Source Sites: `d402ac6e6d02ff01f04f7561db2bde4e7b70e471`.
- Árbol común: `d9778a09abaeb907b7b195051b244d48ad63db45`.
- Deployment: `appgdep_6af277c076988191bfb953c12b71505f`, estado `succeeded`.
- Versión: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_f94e5490b1d8819185cb06a6c033425d`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site

El paquete excluye archivos de entorno y fixtures temporales, y contiene el
backend de producción. Proveedores reales y correo siguen pendientes de su
prueba de activación; el código solo ofrece métodos habilitados por el servidor.

## Acceso Google real y llegada rápida — 10 de noviembre de 2026

El titular completó la configuración Google en su propio Chrome e introdujo su
secreto directamente en Supabase. Settings público confirmó Google=true,
Apple=false, correo=true y registro permitido. Authorize devolvió 302 al cliente
Google correcto y al callback de Supabase. Después, «He entrado» se contrastó
con una identidad Google y un acceso real a las 04:31 Europe/Madrid, manteniendo
el UUID, perfil y permisos anteriores y una sola cuenta para su correo.
La prueba no acredita 200 altas ni Apple; MFA de administración sigue pendiente.

El propietario priorizó que la entrada no obligue a instalar o registrarse.
El QR ya guardaba el código al cargar; ahora se muestra directamente el recibo
«Pase guardado», con seguir la noche y vincular después. No se espera a Auth ni
se pide reenviar un formulario. Solo se anuncia éxito tras comprobar guardado
local real. Se conserva el fallback si el almacenamiento falla y la limpieza
de URL/navegación tolera una vista que bloquee history.replaceState.

El canje, la caducidad del código, RLS y MFA no se modifican. El guardado local
no concede un sello ni reserva cupo; ver ENTRADA_RAPIDA.md. Apple continúa
preparado en cliente y pendiente de la cuenta y credenciales Apple Developer.
La audiencia privada de Sites se conserva hasta una decisión explícita.


Validación y publicación de esta entrega:
- 76/76 tests de lógica y permisos; build local correcto.
- Actions `42757159287`, commit `1857341d686e35329dec71dcc7da585dca8d817b`:
  147/147 recorridos Chromium (escritorio, tablet y móvil simulado) y 2/2 de
  producción sin conexión. Google/Apple se prueban con API simulada en este CI.
- QA manual en Chrome: QR de ensayo local, recibo automático, recarga y continuar
  sin registro. No se completó un canje real ni se activó Apple durante la QA.
- Source Sites: `a777ef24bee79aeaef9b25b4eea868fab610083a`.
- Árbol común probado: `5bb57b0df7e62a473e903b53d17179c866f9e60e`.
- Deployment: `appgdep_6af2a132330481919d2f5f7dcdbbf3a9`, estado `succeeded`.
- Versión 11: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_75b854b0f5608191af2af0e46687c441`.
- URL: https://danz-collective-demo.right-vine-9666.chatgpt.site

Paquete de 22 entradas, cuatro retratos y backend de producción, sin entornos ni
fixtures QA. Se mantiene la audiencia del propietario, sin visitantes externos.
El navegador de trabajo muestra la puerta privada de ChatGPT del sitio publicado;
no se presenta como una prueba autenticada de la UI alojada. Pendientes: autorización
para abrir la PWA sin ChatGPT, Apple Developer y prueba física de Apple/iPhone,
MFA del propietario y capacidad real de 200 altas. Registro posterior documental;
no modifica la aplicación publicada.

## Apertura pública autorizada — 10 de noviembre de 2026

El propietario autorizó explícitamente abrir la PWA sin ChatGPT. La operación
nativa de Sites confirmó access_mode=public, revisión 2. Se conserva la versión
11 y no se añaden editores, administradores ni destinatarios de invitaciones.
No cambia el proyecto Supabase, sus secretos, su autenticación ni sus permisos.

Antes de la apertura, peticiones anónimas con la clave publicable a eventos,
fotos y perfiles fueron rechazadas con HTTP 401. En el navegador que antes
mostraba la puerta privada, recargar abrió directamente la PWA sin autenticarse
en ChatGPT. Fotos pidió iniciar sesión y Cuenta mostró Continuar con Google;
Apple no se anuncia como activado. Una sonda de urllib sin credencial de servicio
devolvió 403, por lo que no se usa como prueba de acceso público: la verificación
positiva es la del navegador y la política devuelta por Sites.

El propietario no conoce una membresía Apple Developer del colectivo. El crédito
de bienvenida de Google Cloud solo sirve para sus productos y servicios elegibles;
Apple Developer se paga a Apple aparte, con tarifa de referencia 99 USD/año o
precio local. No se ha verificado el saldo o la caducidad de una cuenta concreta,
contratado Apple, movido fotos a Google Cloud ni activado facturación de pago.
La configuración Apple y una prueba física en iPhone siguen pendientes.

Fuentes oficiales revisadas:
- https://docs.cloud.google.com/free/docs/free-cloud-features
- https://developer.apple.com/help/account/membership/program-enrollment

No hubo cambios de código ni una nueva versión: se conserva la validación
76/76 + 147/147 + 2/2 del código publicado. Este registro y las guías se
actualizan en Git para no volver a tratar el sitio como privado.

## Vinculación automática del pase después del acceso — 10 de noviembre de 2026

El propietario priorizó pocos pasos y acceso desde iPhone aunque no se disponga
de una cuenta Google. Se mantiene el pase local sin registro en puerta. Al
completar un acceso verificado desde Cuenta con un pase pendiente, la PWA vuelve
al pasaporte y realiza un solo canje automático. Con una sesión ya verificada,
abrir el QR también inicia el canje. No se exige guardar nombre, foto o Instagram.

Se integra la cola de hasta cien pases de noches distintas y el canje global
de la actualización `cfab9536593ac7bc1c9c0b021bec804369c25a9f`, conservando sus
mejoras de entrada rápida, carga diferida y Snake. Un QR nuevo no interrumpe
el canje en curso: se procesa después. Las respuestas atrasadas de una cuenta
anterior se ignoran y cada éxito elimina únicamente el código confirmado.
Un fallo conserva el pase; el usuario puede reintentar y volver a tener conexión
desencadena otro intento. Los códigos no disponibles no se repiten por navegar
entre pantallas y no bloquean otros pases. Los permisos, caducidad y límites
del canje siguen siendo decisión del servidor.

Se añaden pruebas de canje sin pulsación adicional, fallo con reintento explícito,
QR nuevo recibido durante un canje y correo iCloud con API simulada. Google y
Apple recorren el callback PKCE, verificación de usuario y sello automático en
las pruebas. Esto no acredita entrega real a iCloud ni activa el proveedor Apple.
No se han enviado correos, creado cuentas externas ni modificado permisos.

### Validación y publicación de la versión 12

- GitHub: `eb2d7478c50061c48374b7336e6942300d31924d`.
- CI `42767486730`, job `129667276416`: 80/80 pruebas de lógica y SQL,
  165/165 E2E Chromium en tres tamaños y 2/2 de PWA sin conexión. Sin fallos.
- Árbol común comprobado: `6bbd5c65a3177cc3cfada89918e2c9e9238c88cf`.
- Source Sites: `2c0d74a69c334edb277e5e644ba17cb0342dba4d`.
- Versión 12: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_90e340ce35f8819183464667400541a8`.
- Deployment: `appgdep_6af2b9fcd4bc8191a45aafd4f6b837ca`, `succeeded`,
  10 de noviembre de 2026 a las 06:30 UTC. Se conserva la audiencia pública.
- Build SW `f0af79dd03f384a3`, bundle `index-DljjkRVw.js`.
- Paquete local: 418029 bytes, 28 entradas, cuatro retratos y backend de
  producción. Sin entornos, credenciales servidor ni fixtures QA.

La revisión visual local conservó varios pases tras recargar y permitió seguir
con la noche. La página pública alojada abrió directamente sin la puerta de
ChatGPT. No se completó un canje real en producción durante esta revisión.
Apple Developer, la recepción real de correo en iCloud, un iPhone físico,
MFA del propietario y la capacidad real de 200 altas siguen pendientes.
Este registro posterior solo documenta el despliegue; no cambia su código.

## Configuración MFA al cambiar de aplicación — 10 de noviembre de 2026

El propietario informó de que el QR cambiaba al salir a Authenticator y volver
a Chrome. Una notificación SIGNED_IN de la misma cuenta inicia la comprobación
de sesión y desmonta el panel; el estado local del formulario perdía la clave.
Los errores de verificación quedaban además por encima del QR, fuera de la zona
visible al enviar el código desde un móvil.

La configuración temporal se conserva en memoria de la página, asociada al
cliente y al propietario validado por el servidor. Se descarta al cambiar de
cuenta o salir, y no se escribe la clave en localStorage ni sessionStorage.
Una recarga completa permite verificar un factor TOTP pendiente existente sin
generar otro automáticamente. Un reinicio explícito retira solo configuraciones
TOTP sin verificar mediante la API de la cuenta; conserva los factores verificados.
El formulario acepta las seis cifras pegadas con espacios y muestra el rechazo
junto al campo. Se conserva la comprobación de usuario y permisos del servidor.

Se añaden regresiones de revalidación de sesión, recarga, selección del factor
pendiente reciente, pegado, error visible, reinicio y aislamiento entre cuentas.
No se han copiado claves ni códigos reales a fuentes, registros o pruebas.

### Publicación de la corrección móvil — versión 13

- GitHub: `2d098de5ecc134d1ea5fcc5c948546ad6e3bab57`.
- Árbol común: `c555d6f9703da83d1cdf2f9055dd23e13827a0ca`.
- CI `42775943583`, job `129694346950`, resultado success: 80/80 pruebas
  de lógica y SQL, 172 E2E aprobadas y dos aprobadas al reintentar, más 2/2 PWA.
  Los dos reintentos fueron una aserción inmediata del contador de lectura de
  eventos tras mostrar el panel, en tablet y móvil. La conservación del QR,
  el código con espacios y la entrada al panel ya habían pasado en ambos casos;
  la aserción deberá esperar la lectura asíncrona en una próxima revisión.
- Source Sites: `e9cfa0d7cc674989898e5170f18fd57e88242a53`.
- Versión 13: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_e80358e45e58819199dc9d02466d79d2`.
- Deployment: `appgdep_6af2ca3cc2588191b72f1bfe4b002d6c`, succeeded,
  10 de noviembre de 2026 a las 07:39 UTC. Se mantiene la audiencia pública.
- SW `bd76ebf2d82a39df`, bundle `index-CNr3VFTJ.js`.
- Paquete: 418689 bytes y 28 entradas, con backend de producción. Sin entornos,
  fixtures ni claves sintéticas de prueba en los archivos publicados.

La consulta de continuación encontró configuraciones TOTP pendientes y ninguna
verificada para el propietario. No se han modificado por SQL: el usuario deberá
reiniciar su configuración desde la versión corregida y verificar el código en
su propio dispositivo. No se ha confirmado aún esa activación real.

### Prueba del propietario desde otro móvil

El propietario informa de que pudo guardar la aplicación en la pantalla de
inicio, iniciar sesión y navegar en general desde un segundo móvil. Considera
que la navegación funciona bien y pide conservar el pulido estético pendiente.
No especificó el sistema del segundo móvil ni el método de acceso. Esta prueba
manual no confirma todavía el MFA administrativo, un canje real, la galería
privada, la recepción de correo en iCloud ni la capacidad de 200 altas.

## Color, identidad y DANZ Arcade — 10 de noviembre de 2026

Se recupera el color de los cuatro retratos oficiales mediante CSS, sin editar
rostros. Comparten composición y marcos coral, menta, lila y lima. La flor se
reconstruye como vector a partir de la referencia aportada por el propietario;
la marca Danz Collective® se obtiene del encabezado público de danzcollective.com.
La flor reemplaza la D temporal en cabecera, iconos de instalación, sellos y
cabeza de Snake. Los iconos tienen rutas nuevas para facilitar su renovación;
la identidad de la PWA y el acceso independiente de la web se conservan.

Snake mantiene el clásico y añade Islas, Pasillos y Circuito: 8, 14 y 24 muros,
respectivamente. Los espacios transitables están conectados. La comida excluye
muros y cuerpo; chocar con una pared termina la partida. Tras cinco objetivos,
el siguiente mapa comienza pausado con salida segura y puntuación acumulada.
Circuito continúa sin límite de nivel. Los récords se separan por modo.
Las caras de integrantes siguen pendientes; no se han sustituido por los DJs.

DANZ Idle Studio muestra «Próximamente», con nombre y carátula provisionales.
La ilustración generada representa música, ropa, vídeo y diseño; no pretende
ser una fotografía del estudio real. No presenta una acción de jugar disponible.

El cartel A4 utiliza un QR de acceso general con corrección H, zona blanca libre
y corazones alrededor. Doce decodificaciones digitales verifican la URL exacta
con rotaciones, escalas y grises. Queda pendiente la prueba física impresa.
Detalles y regeneración en `docs/QR_IMPRIMIBLE.md`.

Validación local: 85/85 pruebas de lógica y SQL y compilación aprobada. Revisión
visual en navegador de inicio, cuatro retratos, selector de recorridos y tarjeta
Idle. Se añaden dos recorridos E2E y se espera explícitamente la lectura asíncrona
en las dos aserciones administrativas que antes necesitaron reintento. No cambia
el comportamiento de Auth, MFA ni los permisos.

La primera CI (`42864960442`, commit `b38b71c21bb27d3846a49fcffcc160cfac6f4473`)
aprobó 85 pruebas de lógica/SQL y 174 recorridos E2E; fallaron dos casos en los
tres tamaños. La prueba de independencia seguía esperando cero imágenes en
Snake; ahora verifica la flor local cargada y la ausencia de caras pendientes.
La secuencia de colisión añade comprobaciones de ambas posiciones intermedias
antes de enviar el siguiente giro con reloj simulado.

La segunda CI (`42866767634`, commit `9134126356d0ae4e05b40442792c7dde15df17b8`)
aprobó 177 E2E; el caso de colisión todavía fallaba en tres tamaños. La revisión
directa del navegador confirmó la causa: el contenido del recuadro es
`GAME OVEROTRA PARTIDA?`, por lo que getByText con coincidencia exacta no encontraba
el texto aislado. El juego ya estaba terminado y mostraba VOLVER A JUGAR. Se
comprueba ahora el contenido del recuadro y la acción de repetir, manteniendo
las posiciones intermedias y la colisión real contra el muro. No hay cambios
de código de la aplicación por estas correcciones de pruebas.
La tercera CI (`42868379837`, commit `ecb2fc9f1ddc7f70d0ad0b4ea628f1bdb7eb030d`)
aprobó 85/85 pruebas de lógica/SQL y los 180 E2E sin reintentos. Las dos pruebas
PWA detectaron que la flor SVG de la nueva lista de precarga no tenía una rama
de tipo MIME admitido; la instalación del shell se abortaba correctamente al
encontrar un formato desconocido. Se admite image/svg+xml para las rutas SVG
ya incluidas expresamente en BUILD.paths. Se mantienen los controles de origen,
redirecciones, HTML de login, lista explícita y exclusión de datos privados.
Dos regresiones comprueban el SVG válido y rechazos de HTML, JSON y otro origen.
El workflow ejecuta ahora la prueba breve PWA antes de los 180 recorridos para
detectar antes problemas del paquete. La validación y publicación finales se
registrarán al completarse.

### Publicación de color, flor y Arcade — versión 17

- GitHub: `cad85984ff821487490dece73e39821366b86867`.
- Árbol común probado: `4210239f7e94b759fe20a94569f17759e3c5222c`.
- CI `42869795902`, job `130017670995`, success: 87/87 pruebas internas,
  2/2 PWA y 180/180 E2E, sin fallos ni reintentos.
- Source Sites: `6c34915e46ecbd1b37a274694651216ea263d35e`.
- Versión 17: `appgprj_6af1179413088191b92fa5b50e37fdb2~appgver_0f86f7e084188191b2bb1600790332cb`.
- Deployment `appgdep_6af35c25ea6c81919d19f46784ed0062`, succeeded,
  10 de noviembre de 2026 a las 18:02 UTC. Se mantiene la audiencia pública.
- Paquete de producción: 917921 bytes, 39 entradas y 31 archivos; cuatro
  retratos, flor, marca oficial y carátula. Sin entornos, fixtures ni secretos
  servidor. Bundle `index-LB5sCGGn.js`, SW `c3978ca442abffa6`.

Las versiones 14–16 se guardaron durante la verificación y no se publicaron.
La página pública abre directamente y muestra la flor, los colores nuevos,
los tres recorridos de Snake y la tarjeta Idle con su imagen cargada. Se guarda
una captura de la tarjeta publicada como evidencia. La sesión de Chrome gestionado
no mostró el indicador de shell listo; no se usa esa sesión para acreditar el
modo sin conexión del sitio alojado. Las dos pruebas PWA acreditan el build de
producción en CI. Quedan por comprobar el modo sin conexión en un móvil real y
una copia impresa del cartel. Administración/MFA y las caras siguen pendientes
del propietario. Este registro posterior no modifica la aplicación publicada.
