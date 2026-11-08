# DANZ Collective

Prototipo React + TypeScript + Vite recuperado de los pasos 5/6/9/10 y continuado
en Codex. Fotos y Arcade son las dos áreas principales. El historial de recuperación
está en `DANZ-TRASPASO-CODEX.md` y `docs/VERIFICACION_CODEX.md`.

## Estado actual

- Inicio y navegación, DANZ Snake local con teclado/gestos/botones opcionales.
- Cuenta por correo sin contraseña, validación de sesión, cierre de sesión y perfil propio.
- Galerías privadas: consulta de eventos autorizados y fotos publicadas, enlaces firmados
  de corta duración, visor y descarga. Los permisos los impone Supabase, no el navegador.
- Álbumes de este navegador: se conserva la demo local de administración y asistente,
  guardada en IndexedDB. Esa simulación no concede permisos sobre las galerías privadas.
- Pruebas de reglas, permisos de base de datos y recorridos Playwright; CI en GitHub Actions.

El acceso por correo requiere las plantillas, redirecciones y envío de Supabase correctamente
configurados. Las pruebas automáticas no envían correos ni sustituyen una prueba real de
recepción/callback. Google/Apple, administración de nube, QR/sellos, recompensas y PWA
instalable/despliegue siguen pendientes. Los puntos de Snake son locales y no canjeables.

## Desarrollo

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
