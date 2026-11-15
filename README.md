# DANZ Collective

Prototipo React + TypeScript + Vite recuperado de los pasos 5/6/9/10 y continuado
en Codex. Fotos y ARCADANZ son las dos áreas principales. El historial de recuperación
está en `DANZ-TRASPASO-CODEX.md` y `docs/VERIFICACION_CODEX.md`.

## Demo DANZ

[Abre DANZ](https://danzcollectiveapp.vercel.app).
La ruta [`/test`](https://danzcollectiveapp.vercel.app/test) reúne los paseos de
Yeppo y accesos a los juegos actuales para probarlos desde el móvil. La antigua
demo de Sites se conserva como referencia de versiones anteriores.
La PWA abre al público sin una cuenta de ChatGPT desde el 10 de noviembre de
2026, con autorización del propietario. Fotos, perfiles y administración mantienen
sus permisos de DANZ/Supabase. La configuración para probar correo y móvil está
en `docs/PRUEBA_CORREO_Y_MOVIL.md`.

## Estado actual

- Inicio y navegación con la flor de DANZ y la marca oficial del colectivo. Retratos
  de artistas en color con marcos coral, menta, lila y lima.
- DANZ Snake local con teclado/gestos/botones opcionales, cuerpo continuo, récord
  por modo y velocidad progresiva. Clásico y tres laberintos: Islas, Pasillos y
  Circuito; cinco objetivos permiten avanzar y el último recorrido es infinito.
- DANZ Idle Studio: tarjeta «Próximamente» con ilustración y nombre provisionales.
  El juego completo y las caras de integrantes siguen pendientes.
- Cartel A4 con QR de acceso general a la app y decoración inspirada en el amor.
  Generación e impresión: `docs/QR_IMPRIMIBLE.md`. No concede un sello de evento.
- Web del colectivo opcional y desactivada por ahora; la app usa su propia URL.
  Perfiles de Chicharro (ES), TonyDawgs, Wizme y LEÖN integrados con un estilo
  común, retratos oficiales y enlaces en la misma ventana con retorno a DANZ IN.
  Configuración preparada para caras de Snake, pendientes de recibir.
  Ver `docs/CONTENIDO_COLECTIVO.md`.
- Instalación PWA en navegadores compatibles, instrucciones Android/iPhone y
  apertura de Snake sin conexión tras guardar el shell. Actualizaciones confirmadas.
- Cuenta por correo sin contraseña, validación de sesión, cierre de sesión y perfil propio.
- Google/Apple preparados con PKCE y detección de proveedores activados en el
  servidor. Google está operativo; Apple espera la membresía y configuración del colectivo.
  Requisito de 200 altas y activación: `docs/ACCESO_GOOGLE_APPLE_200_ALTAS.md`.
- Galerías privadas: consulta de eventos autorizados y fotos publicadas, enlaces firmados
  de corta duración, visor y descarga. Los permisos los impone Supabase, no el navegador.
- DANZERS: pase por enlace QR o código, canje validado en el servidor y pasaporte
  de sellos por cuenta, con acceso directo a la galería de cada evento. Pases de varias noches conservados
  sin registro en puerta y canje automático después del acceso.
- Administración de eventos y pases: borradores/publicación/archivo, códigos con
  caducidad/cupo, descarga de QR y revocación. Requiere permisos explícitos y MFA.
- Fotos en nube: tandas de hasta 600, originales de descarga intactos, vistas previas,
  revisión/publicación por selección y presupuesto de espacio. Las galerías de
  eventos archivados siguen disponibles a sus asistentes.
- Álbumes de este navegador: se conserva la demo local de administración y asistente,
  guardada en IndexedDB. Esa simulación no concede permisos sobre las galerías privadas.
- Pruebas de reglas, permisos de base de datos y recorridos Playwright; CI en GitHub Actions.

El acceso por correo requiere las plantillas, redirecciones y envío de Supabase correctamente
configurados. Las pruebas automáticas no envían correos ni sustituyen una prueba real de
recepción/callback. Apple, interfaz de denuncias/moderación y recompensas
siguen pendientes. La instalación física en Android/iPhone sigue por verificar.
Los puntos de Snake son locales y no canjeables.

El flujo y las condiciones de los pases están en `docs/PASAPORTE_EVENTOS.md`.
El primer acceso al panel se explica en `docs/ADMINISTRACION_EVENTOS.md`.
Capacidad y límites: `docs/GALERIA_Y_ALMACENAMIENTO.md`.
Instalación: `docs/INSTALACION_PWA.md`. Activación SMTP pendiente:
`docs/ACTIVACION_CORREO.md` (vía provisional sin DNS; autorización Gmail pendiente).

## Desarrollo

Las reglas permanentes están en `AGENTS.md`; las diez mejoras y los tres nuevos
juegos aprobados están en `docs/ARCADANZ_ROADMAP.md`.

Usar **Node.js 24**. Las versiones Supabase y el lockfile están fijados.

```sh
npm ci
npm run dev
```

Copiar `.env.example` a `.env.local` y configurar URL y clave **publishable** del proyecto.
Nunca usar `service_role` ni `sb_secret_` en Vite. `.env.local` está excluido de Git.
Sin configuración, las cuentas/galerías privadas muestran su estado no disponible;
el resto del prototipo sigue funcionando.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:pwa
```

En el entorno de Codex puede usarse el Chromium instalado:

```sh
CI=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright arranca un servidor con URL y clave ficticias. Los tests de cuentas y galería
privada interceptan la API y no envían correos; las pruebas de permisos usan PostgreSQL
aisladamente mediante PGlite con datos sintéticos. Esto permite probar denegaciones
sin tocar registros de producción. Ver los límites en `docs/SUPABASE_ESTADO.md`.

## Conservar tus fotos

Las galerías antiguas permanecen en IndexedDB del navegador original, bajo el origen
`http://localhost:5173`. No están en este repositorio ni se suben a Supabase automáticamente.
No borrar los datos del sitio ni el perfil del navegador antes de exportarlas y verificar
su recuperación. `docs/RESCATE_GALERIAS.md` explica la herramienta de respaldo local.

Las fotografías privadas, originales, copias de IndexedDB, sesiones y secretos deben
permanecer fuera de Git. Las URLs firmadas expiran, pero no revocan una copia ya descargada.
