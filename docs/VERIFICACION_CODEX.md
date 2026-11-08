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
