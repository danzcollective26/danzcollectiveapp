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
