# Traspaso del proyecto DANZ Collective a Codex

**Fecha de verificación:** 9 de noviembre de 2026  
**Destino:** [GitHub — danzcollective26/danzcollectiveapp](https://github.com/danzcollective26/danzcollectiveapp), repositorio **privado**.  
**Prioridad:** PWA funcional Fotos + Arcade + administración + QR/sellos.  
**Carácter del documento:** decisiones y estado comprobable; **no contiene contraseñas, API keys, tokens ni cadenas de conexión**.

> **Regla de trabajo para Codex:** conservar el código y los datos existentes; inspeccionar antes de cambiar. No presentar ideas aprobadas como funciones ya desarrolladas. Mantener los datos de prueba locales hasta exportarlos. Preguntar solo por decisiones creativas o permisos imprescindibles; automatizar el resto, ejecutar pruebas, corregir fallos y guardar hitos con Git, sin obligar al usuario a copiar archivos a mano repetidamente.

## 1. Resumen ejecutivo

DANZ Collective reúne los eventos **DANZERS**, la moda **DANZFLOR**, los artistas y música **DANZ IN**, las **galerías privadas de eventos** y **DANZ Arcade**. La aplicación será **PWA primero** para acceso sin instalación desde códigos QR (iPhone/Android y escritorio), con posibles versiones nativas después. En la portada, **Fotos y Arcade tienen protagonismo equivalente**; el resto son módulos secundarios. Diseño final pendiente: usar identidad y recursos auténticos de DANZ, no plantillas genéricas.

**Estado real de frontend:** el usuario comprobó en Windows que funciona un prototipo React + TypeScript + Vite servido en `http://localhost:5173/`. Probó navegación, Snake, álbumes por evento, subida local de imágenes, gestión básica, el visor de fotos, persistencia IndexedDB tras F5 y el simulador de vista admin/asistente. **No** es una PWA de producción ni existe protección real por cuenta/sello.

**Estado real de backend:** hay proyecto Supabase activo, con 7 tablas y políticas RLS (ver sección 4). La app local todavía **no está conectada a Supabase**.

**Estado real GitHub (consulta de hoy):** repositorio privado `danzcollective26/danzcollectiveapp`, `main` configurada como rama predeterminada, tamaño reportado **0**, sin código cargado según metadatos. El usuario indicó tenerlo conectado a Codex. No se han realizado escrituras al repositorio en este traspaso.

## 2. Tecnologías y estructura

- **Frontend recomendado y usado en la demo:** React + TypeScript + Vite; desarrollo local Node.js LTS y VS Code en Windows.
- **Juegos:** actual DANZ Snake es una implementación React sencilla; **Phaser** propuesto para juegos 2D futuros y arquitectura modular de juegos autónomos.
- **Backend:** Supabase/PostgreSQL/Auth, bajo RLS; verificar roles y políticas con pruebas reales.
- **Almacenamiento de fotografía de producción:** valorar Cloudflare R2 con originales y miniaturas privadas; no está configurado.
- **Hosting PWA:** Cloudflare Pages, propuesto, no desplegado.
- **Futuras aplicaciones nativas:** Capacitor como ruta propuesta de reutilización de código; requiere validación de funciones de iOS y Android.
- **DANZ Moments:** motor pesado de análisis multimedia fuera del navegador; integración vía API y módulo administrativo, fase posterior.
- **Costes:** desarrollo local gratuito; hosting y cuentas pueden comenzar con cuotas free, **no presuponer 0 € permanente**. Presupuesto inicial orientativo conversado de **25–60 USD/mes** para pequeña producción, no presupuesto confirmado ni garantía. Almacenamiento, correos, vídeos, asesoramiento legal y tiendas podrían sumar gastos.

### Archivos recuperados del último frontend

Paquete adjunto: `DANZ-Codex-Codigo-Paso10.zip` (**reconstruido a partir de los ZIP disponibles del Paso 5, 6, 9 y 10**; no extraído directamente del PC del usuario).

| Archivo | Función / procedencia |
|---|---|
| `src/App.tsx` | Navegación, portada, Snake y módulos (Paso 6). |
| `src/App.css`, `src/index.css`, `index.html` | Estilos y página inicial (Paso 5). |
| `src/PhotoGallery.tsx`, `src/PhotoGallery.css` | Galería más reciente, vistas y gestión (Paso 10). |
| `src/galleryStorage.ts` | IndexedDB con álbumes y fotos como Blob (Paso 9). |
| `src/main.tsx`, `package.json`, `vite.config.ts`, `tsconfig*.json` | **Andamiaje reconstruido** para que Codex pueda instalar y arrancar. No se ha cotejado con `package.json` ni `package-lock.json` del ordenador original. |
| `public/backup-galerias.html` | Utilidad añadida **en este traspaso** para exportar los álbumes locales a carpeta; herramienta auxiliar, no funcionalidad de producto. |
| `docs/RESCATE_GALERIAS.md` | Instrucciones de conservación. |

**Importante:** el proyecto original del usuario está en la captura en `C:\Users\jcn1\Documents\danz-collective`. **La versión autoritativa es la que exista allí hoy**: comprobar diferencias con el ZIP de recuperación antes de sobrescribir. El bundle se ha validado como archivo y el código se ha inspeccionado; la instalación de dependencias y la compilación final deben ejecutarse en Codex/PC (`npm install`, `npm run build`) para completar la verificación. Ninguna biblioteca ni galerías personales están incluidas en el ZIP.

## 3. Funciones acordadas, distinguiendo estado

### A. Navegación, inicio, identidad y PWA

**Acordado:** una sola aplicación con entrada por QR; portada adaptable a campañas por administrador, Fotos y Arcade con igual énfasis, otras áreas (DANZERS / DANZ IN / DANZFLOR), enlaces profundos. Diseño BN con acentos variables según colección/evento, identidad auténtica desde `danzcollective.com` y activos facilitados por el colectivo. Android/iPhone, instalación opcional, administración móvil y escritorio con todas sus funciones. Acceso offline parcial a contenido cacheado cuando sea técnicamente posible.

**Hecho:** prototipo web de portada, navegación y estética preliminar. **Pendiente:** manifest PWA, service worker, pantalla de instalación, diseño final, rutas profundas, roles y offline seguro.

### B. Registro, perfiles, permisos

**Acordado:** exploración pública y juego invitado sin registro; cuenta progresiva mediante Google, Apple o correo sin contraseña cuando proceda; cuenta para sellos, puntos, favoritos, rankings oficiales, galería privada. Perfil con foto, nombre visible y `@usuario` editable; handle Instagram opcional, **no tratar texto escrito como identidad verificada**. Controles independientes de visibilidad pública/búsqueda/Instagram/etiquetado; privados por defecto. El administrador principal es el usuario, con permisos granulares por área para colaboradores, 2FA y auditoría. Tester por invitación sin permisos admin, entorno de prueba aislado.

**Hecho:** simulador visual admin/asistente únicamente. **Pendiente:** autenticación y roles en servidor, CRUD y políticas por rol, verificación Instagram, 2FA, auditoría y tests negativos de acceso.

### C. Eventos, códigos QR, pasaporte y sellos

**Acordado:** fiestas propias, sets DJ y eventos colaboradores; página con cartel, artistas, entradas y localización. QR del evento (o código alfanumérico especial) genera **pase/token individual único** guardable localmente y recuperable por correo cuando se vincule; canje único tras registrarse genera sello permanente de la fiesta y habilita SU galería privada. Sin personal verificando la puerta; un QR estático puede compartirse y **no prueba asistencia física** (riesgo aceptado para este caso, controles adicionales en premios sensibles). Archivo histórico de sellos y galerías. Niveles orientativos de fidelidad: Rookie 1, Regular 3, Insider 5, VIP DANZ 10, Legend 20; aún ajustables.

**Hecho:** tablas de asistencia/códigos en Supabase, vacías. **Pendiente:** creación del pase, hash seguro y protección antirreutilización, canje transaccional, recuperación y validación, conectarlo a la app; eventos públicos y privados bien diferenciados.

### D. Galerías de fotos y recuerdos

**Acordado:** fotos por evento; todas las fotografías se suben con **marca de agua previamente incorporada** (no inventar segunda marca). Borradores, subida por tandas, previsualizar, programar publicación, archivo persistente mientras lo permita la ley, descargas con marca original, compartir, favoritos y `Aquí salgo yo` manual; sección Mis recuerdos. Zoom, swipes, pantalla completa, selección de fotos y posible ZIP bajo límites, más adelante. Nada de comentarios ni DMs al inicio. Etiquetar usuarios con consentimiento y sin revelar datos privados. Solicitudes de retirada con motivo, identificación del solicitante y dos prioridades: normal a revisión; privacidad/sensible puede ocultarse preventivamente, resolver los derechos legales con prontitud.

**Hecho:** álbumes por evento, crear/editar/borrar/limpiar, añadir/quitar fotos, visor, navegación con teclado/táctil, descarga individual, guardado local IndexedDB y cambio de vista **sin seguridad**. **Pendiente:** nube privada, protección de originales/miniaturas con firma, RLS y permisos de Storage, watermark verificado, denuncias/ocultación, favoritos y publicación por lotes. **No trasladar las fotos de IndexedDB directamente a un bucket público**.

### E. DANZ Arcade y puntos

**Acordado:** Arcade equiparado a Fotos en home; varias experiencias móviles, permanentes y estacionales, puntuaciones/rankings por global/semana/mes/temporada/evento, controles táctiles y botones, invitados pueden jugar y cuentas registradas guardan resultados y obtienen puntos con protección antifraude y topes. Minijuegos definidos/propuestos: **DANZ Snake** como primero, idle del estudio, competitivo móvil, propuestas como Rave Runner y DJ Panic. Snake puede usar flor del logo como cabeza, caras aportadas por integrantes y modos clásico, laberinto, poderes opcionales, niveles/infinito. Posible separación futura de los juegos como productos autónomos. Recompensas por puntos canjeables por entradas, ropa, consumiciones, VIP, digitales y colaboraciones, con validación QR/código por personal autorizado y registro antifraude; los sellos de asistencia no son los puntos.

**Hecho:** solo Snake sencillo en React, puntuación local sin premios/rankings. **Pendiente:** identidad/assets definitivos, backend de rankings, perfil, recompensas, antitrampas, posible migración a Phaser y otros juegos.

### F. DANZ IN y DANZ ID

**Acordado:** perfiles de artistas, sesiones, lanzamientos, actuaciones, enlaces a Spotify, SoundCloud, YouTube y redes. Integrar **reproductores oficiales** cuando estén permitidos y ofrecer siempre salida a la plataforma original; no alojar streaming propio inicialmente. Usuarios podrán marcar favoritos de artistas, sesiones y lanzamientos (enlaces a publicaciones originales). **DANZ ID:** reconocimiento puntual tipo Shazam para cualquier música cuando exista integración viable y posible visualización de canciones de sesiones en directo; avanzar progresivamente, sin exigir trabajo manual al DJ. El reconocimiento general puede implicar licencias/API de pago y en PWA puede requerir alternativas.

**Hecho:** sección descriptiva/placeholder. **Pendiente:** todos los contenidos e integraciones reales, favoritos y reconocimiento.

### G. DANZ Moments / Studio

**Acordado:** dos partes. **DANZ Moments Studio** es **solo interno para administración autorizada**, con subida de audio de mesa, vídeo continuo de cámara fija y clips de cámaras secundarias, detección de catálogo **ampliable** (DANZ IN, colaboradores y luego más referencias), timestamps, sincronización, fragmentos sugeridos, revisión, gestión de originales, edición **híbrida**: ajustes básicos internos y montaje complejo externo. Sin pedir a DJs botones ni acciones durante sesiones. Multicámara sincronizada y montaje automático son fases futuras. **DANZ Moments para asistentes** muestra **solo clips finales publicados**, artista/tema/enlaces/favoritos, bajo los permisos del evento; jamás originales, editor, borradores o detecciones sin aprobar. El reconocimiento en mezclas no está garantizado; pruebas con material real. Evaluar derechos de música y vídeo.

**Hecho:** especificación conceptual, **ningún motor/editor desarrollado**. **Pendiente:** prototipo externo de reconocimiento postevento, sincronización, metadatos y editor interno; **no bloquear MVP**.

### H. DANZFLOR, eventos, notificaciones, apoyo y administración

**Acordado:** DANZFLOR Shop opción C: catálogo informativo/enlace a tienda existente inicialmente, compras directas futuras, puntos por compra verificada. DANZERS lista de eventos primero y calendario opcional, filtros y recordatorios. Notificaciones por categorías (galerías, eventos, juegos, ropa, DJs, recompensas), marketing solo con consentimiento; bandeja in-app. Ayuda/FAQ, recuperación de pase, soporte por ticket privado, feedback privado y votación pública opcional más adelante. Panel con roles, campañas, borradores, publicaciones programadas, métricas agregadas respetuosas de privacidad, copias de seguridad **automáticas y probadas**, logs y reversión.

**Hecho:** enlaces y pantallas de espera. **Pendiente:** todo el backend/workflows reales.

## 4. Supabase: configuración comprobada directamente

**Proyecto**: `danzcollectiveapp Project`  
**ID/referencia pública del proyecto**: `ttgehdknhnrxtddxpknc`  
**Región**: `eu-west-1` (Europa)  
**Estado observado**: `ACTIVE_HEALTHY`  
**PostgreSQL**: 17  
**Plan**: el usuario seleccionó *Free* al crear según instrucciones; **no he verificado el plan de facturación actual**, por lo que no afirmar que siga siendo Free.  
**Sin credenciales incluidas.**

### Tablas públicas encontradas (todas con RLS activado y 0 filas al comprobar)

| Tabla real | Estructura/uso |
|---|---|
| `public.danz_events` | `id`, `title`, `starts_at`, `ends_at`, `status` (`draft`, `published`, `archived`), `created_at`. |
| `public.danz_profiles` | `user_id` (FK `auth.users`), `display_name`, `instagram_handle`, `created_at`. |
| `public.danz_attendance` | `(user_id,event_id)` clave compuesta, `granted_at`. |
| `public.danz_photos` | `id`, `event_id`, `storage_path` único, `status` (`draft`,`published`,`quarantined`), `created_at`. |
| `public.danz_photo_reports` | `id`, `photo_id`, `reporter_id`, `reason`, `status` (`pending`,`reviewing`,`resolved`,`dismissed`), `created_at`. |
| `public.danz_admins` | `user_id` (FK `auth.users`), `created_at`. |
| `public.danz_event_access_codes` | `id`, `event_id`, `code_hash` único, `expires_at`, `max_uses`, `used_count`, `revoked_at`, `created_at`. |

**Atención:** en una respuesta antigua se propuso SQL para `public.events`. **Esa tabla NO figura en el esquema real**; `public.danz_events` ya existe. **No ejecutar el SQL anterior sin comparar**: evitar duplicados.

**Migraciones registradas** (consultadas, no aplicadas aquí):

- `20261107055811` — `danz_core_private_foundation`.
- `20261107055900` — `danz_photo_moderation_foundation`.
- `20261107055903` — `restrict_photo_reports_to_attendees`.
- `20261107060023` — `danz_admin_and_private_access_codes`.

**Políticas RLS observadas (resumen de lectura directa de `pg_policies`):**

- `danz_admins`: miembros administradores pueden consultar su propia pertenencia.
- `danz_attendance`: usuario autenticado puede leer solo sus asistencias.
- `danz_events`: lectura para usuario autenticado **con asistencia** a evento `published`.
- `danz_photos`: lectura de fotos `published` solo con asistencia al evento publicado.
- `danz_profiles`: lectura, inserción y actualización **del propio perfil**.
- `danz_photo_reports`: lectura de denuncias propias e inserción de denuncia de foto publicada accesible por asistencia.
- `danz_event_access_codes`: **no había políticas en `pg_policies`** (RLS activado); deben operarse mediante flujo de servidor controlado, no exposición pública.

**Lectura crítica:** las políticas actuales protegen borradores y fotos en tablas, pero todavía **no permiten la exploración pública de eventos** acordada, ni implementan escrituras admin generales; el diseño público/privado exige políticas o endpoints adicionales con pruebas de seguridad. RLS no basta si Storage es público. Desconocemos aún configuración Auth/SMTP/providers, buckets y permisos detallados; **verificar antes de dar por lista la seguridad**. No utilizar `service_role` ni `secret` en frontend. No hemos creado tablas, modificado políticas ni subido imágenes durante esta verificación.

## 5. Cómo conservar las galerías locales del navegador

**Este paso es crucial.** El usuario confirmó que los álbumes persisten al recargar. **No están ni en Supabase, ni en GitHub ni dentro de los ZIP.**

La app guarda en `IndexedDB` del **origen completo** `http://localhost:5173`, dentro del perfil del navegador donde se probaron:

- DB `danz-collective-local-gallery`, v1.
- Store `albums`: `{id, name, date, order}`.
- Store `photos`: `{id, eventId, name, image: Blob, addedAt}` con índice `eventId`.

**Precauciones inmediatas:** no limpiar datos de sitios, no usar modo incógnito, no borrar perfil de Chrome, no cambiar de puerto o dominio asumiendo que los datos se migran automáticamente, no sobrescribir el proyecto local original. `npm install`, commits y cambios de código en el **mismo origen** no borran normalmente IndexedDB, pero al cambiar de navegador/origen los datos dejan de verse. El navegador puede liberar espacio: tampoco es un backup garantizado.

**Exportación offline facilitada para este traspaso:** en el ZIP se incluye `public/backup-galerias.html`. Copiar **solo ese archivo** a `C:\Users\jcn1\Documents\danz-collective\public\backup-galerias.html`, mantener Vite en el puerto 5173 y abrir `http://localhost:5173/backup-galerias.html` con el **mismo perfil Chrome** que muestra las fotos. Pulsar «Exportar álbumes y fotos», elegir **carpeta vacía**, comprobar `manifest.json` + carpeta `fotos/`. Los archivos `.bin` contienen los bytes reales de las imágenes; `manifest.json` relaciona nombres, MIME, IDs y evento. No sube nada a internet y no escribe en IndexedDB. **La exportación debe probarse en el PC**, la utilidad solo se ha comprobado estáticamente aquí. Es una copia para recuperación, **no tiene importación integrada**; Codex debe implementar y probar la restauración antes de migrar o borrar el origen.

**Privacidad:** mantener esta carpeta fuera de GitHub. Los originales en el equipo siguen siendo otra copia de las imágenes, pero no necesariamente de los nombres, fechas y asociaciones tal como están en la demo. Guía ampliada en `docs/RESCATE_GALERIAS.md`.

## 6. Estado de trabajo y decisiones pendientes

| Área | Hecho verificado | Próximo paso |
|---|---|---|
| Código local | Vite, UI preliminar, Snake y Fotos hasta Paso 10 | Llevar **código**, no blobs privados, a repo; `npm run build` y pruebas. |
| GitHub | Repositorio privado `danzcollective26/danzcollectiveapp` existe y metadatos reportan tamaño 0 | Primer commit desde fuente local verificada, `.gitignore`, README, hitos. |
| Supabase | Proyecto activo, 7 tablas RLS, 4 migraciones, 9 políticas leídas, 0 filas | Recuperar/volcar migraciones versionadas, auditar grants, buckets, auth, SMTP y roles; decidir modelo de eventos públicos. |
| Fotos | Galerías locales persistentes y simulador de vistas | Exportar datos locales; conectar Supabase + almacenamiento privado + tests de RLS. |
| Usuarios | Tablas de perfiles/admin sin registros | Definir alta/primer superadmin y protección de acciones; habilitar login progresivo. |
| QR/sellos | Esquema inicial de asistencia y códigos | Diseñar/implementar tokens individuales y canje sin intervención de personal. |
| Arcade | Snake React funcional en pruebas | Arquitectura de juego separable, puntuaciones seguras, Phaser opcional; más juegos después. |
| Identidad visual | Diseño provisional | Incorporar los **logotipos y material real** con permisos. |
| DANZ Moments | Diseño y secuenciación conceptual | Prototipo de reconocimiento offline postevento más adelante. |

**Cuestiones NO cerradas:** herramienta exacta para los montajes externos de Moments; retención del vídeo original en servidores o solo clips finales; alcance y presupuesto del alojamiento real; fecha de migración a producción; política final de acceso a carteles/eventos públicos vs galerías cerradas; mecanismos de recuperación y fraude de pases compartidos; escala inicial de fotos/usuarios y proveedor de envío de email.

## 7. Orden recomendado para Codex (sin bloquear el lanzamiento)

1. **Preservación:** pedir al usuario solo el permiso necesario para crear la copia de sus datos IndexedDB. No sustituir ni mover su carpeta Windows hasta que confirme exportación y recuperación posible.
2. **Repositorio GitHub:** verificar si está vacío (consulta nueva), inicializar desde la copia local real si es accesible; si no, usar el ZIP reconstruido, verificar archivos del scaffold; primer commit. No añadir fotos privadas, secretos, `.env`, `node_modules` o copias IndexedDB.
3. **Pruebas automáticas:** ejecutar `npm install`, `npm run build`, iniciar Vite y probar navegador/teclado, álbumes, IndexedDB recarga, editar/borrar, vistas, Snake; corregir errores sin perder funcionalidad.
4. **Arquitectura:** separar shell, rutas, eventos, fotos y Arcade; añadir test runner, lint/CI, modelo de datos tipado. Mantener estética provisional mientras se usa material oficial.
5. **Seguridad Supabase:** inspeccionar **tablas reales** y migraciones del proyecto anterior; auditoría RLS + grants + storage, login de prueba, bootstrap controlado del admin, recuperación; establecer diferencia entre contenidos públicos y privados. No crear `public.events` duplicada.
6. **Persistencia nube:** empezar con eventos y fotos de prueba **sin imágenes privadas**; diseñar subida segura, miniaturas, RLS y URLs firmadas. Solo después migrar las fotos reales autorizadas.
7. **QR y sellos:** flujo invitado → pase individual → registro → canje único → galería desbloqueada, con pruebas antifraude.
8. **Arcade/MVP:** conservar Snake, evolucionar juegos y perfiles; QR/sellos + Fotos + Arcade + administración como demo prioritaria.
9. **DANZ IN, Shop, Moments e ID:** diseñar módulos extensibles pero implementación progresiva. No retrasar MVP por reconocimiento de audio o multicámara.

## 8. Texto listo para iniciar una tarea en Codex

> Trabaja en el repositorio privado `danzcollective26/danzcollectiveapp` siguiendo `DANZ-TRASPASO-CODEX.md`. El repositorio se ha observado vacío: antes de crear archivos, vuelve a comprobar el estado. Reconstruye el frontend desde el paquete `DANZ-Codex-Codigo-Paso10.zip` si no puedes leer la carpeta local original `C:\Users\jcn1\Documents\danz-collective`; no sobrescribas esa carpeta ni borres IndexedDB. Verifica primero `npm install` y `npm run build`, luego pruebas de interfaz y guardado. Comprueba el proyecto Supabase `ttgehdknhnrxtddxpknc`: **ya tiene siete tablas `danz_*`, RLS y cuatro migraciones**; nunca vuelvas a crear el antiguo ejemplo `public.events` sin comparar el esquema. Prioriza Fotos + Arcade + administración + QR/sellos. No publiques datos reales ni introduzcas secretos en el repositorio. Avanza de forma autónoma, usa Git por hitos y explica solo decisiones o permisos imprescindibles. La exportación local de fotografías debe probarse antes de migrarlas.

---

**Documento generado a partir de decisiones de la conversación, ZIP de código recuperados y consultas de solo lectura al GitHub y Supabase conectados.** No sustituye una prueba funcional/seguridad completa, ni constituye constancia de que los servicios de autenticación, las galerías protegidas o los sellos reales estén funcionando.
