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

Validación final y publicación de esta corrección: pendientes de registrar.
