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
