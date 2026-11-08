# DANZ Collective — prototipo local recuperado hasta Paso 10

> **Origen:** reconstruido de los ZIP de los pasos 5, 6, 9 y 10 que sí estaban disponibles en la conversación. No es una descarga directa de la carpeta Windows del usuario. Los archivos `src` y `index.html` son los recuperados; `package.json`, archivos TypeScript de configuración y `src/main.tsx` se han preparado para que el conjunto sea portable. Verificar compilación y diferencias con el proyecto local real antes de sobrescribir nada.

## Arranque (Windows / Node.js LTS)

```powershell
npm install
npm run dev
```

Abrir `http://localhost:5173/`. Antes de lanzar producción: `npm run build` y corregir errores.

## Código presente

- Inicio DANZ con Fotos y Arcade prioritarios, DANZERS, DANZ IN y DANZFLOR (algunos aún placeholders).
- DANZ Snake local en `src/App.tsx` (no clasificaciones ni recompensas).
- Galerías por fiesta, gestión manual, visor, descarga, simulador de vista admin/asistente.
- Guardado en IndexedDB (`src/galleryStorage.ts`).
- Herramienta auxiliar de exportación de datos locales en `public/backup-galerias.html`. **No es parte del producto final.**

## Lo que **no** existe aún

Autenticación y roles reales, QR/sellos, sincronización entre dispositivos, galería privada en la nube, subida segura, integración Supabase, puntos, reservas/premios, DANZ Moments, DANZ ID, PWA/manifest/service worker de producción y alojamiento. El cambio de vista no equivale a seguridad.

## Avisos importantes de datos

Las fotos **no están en este repositorio**: permanecen en el navegador del ordenador original. No borrar datos de `localhost:5173`, no cambiar el puerto/origen antes de exportar, y no subir a GitHub fotos privadas ni copias de las galerías. Consultar `DANZ-TRASPASO-CODEX.md` y `docs/RESCATE_GALERIAS.md`.

## Seguridad

- Sin contraseñas, credenciales ni claves de Supabase.
- No configurar el navegador para acceder a originales en buckets públicos.
- Las políticas RLS se consultaron pero aún no se han probado contra cuentas reales.
