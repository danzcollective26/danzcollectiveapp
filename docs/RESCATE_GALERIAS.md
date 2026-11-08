# Cómo preservar los álbumes locales de DANZ

**Dónde están hoy:** Chrome/Edge del ordenador de desarrollo, **origen** `http://localhost:5173`, base de datos IndexedDB `danz-collective-local-gallery`, versión 1, stores `albums` y `photos`. Los datos incluyen nombres, fechas, orden, imágenes como `Blob` y asociaciones foto-evento. Los archivos de imagen originales del ordenador no se modifican al cargar o borrar álbumes de la demo.

## Antes de mover el proyecto a Codex / GitHub

1. **No borres** datos del sitio de `localhost:5173`, el perfil de Chrome, cachés/datos de navegación seleccionando «cookies y datos del sitio», ni desinstales el navegador con sus datos.
2. Mantén por ahora la aplicación anterior abierta desde el **mismo origen y puerto**. Abrirla en un dominio nuevo, otro puerto u otro perfil no mostrará los álbumes, aunque estos sigan en el perfil antiguo.
3. No borres ni sobrescribas la carpeta Windows `C:\Users\jcn1\Documents\danz-collective`; es la fuente local original del código, que puede diferir del paquete reconstruido.
4. **Exporta los álbumes antes de cualquier migración** mediante el archivo `public/backup-galerias.html` incluido aquí. Para usarlo con tu versión local actual, copia **solo ese HTML** a `C:\Users\jcn1\Documents\danz-collective\public\backup-galerias.html`, mantén Vite en `http://localhost:5173`, y abre `http://localhost:5173/backup-galerias.html` con el mismo perfil de Chrome. Pulsa «Exportar álbumes y fotos», selecciona una **carpeta nueva vacía** y espera a la confirmación.
5. Verifica que la carpeta resultante contiene `manifest.json` y `fotos` con archivos `.bin`. Haz una copia de esa carpeta en un disco o ubicación segura si contiene material que no quieres perder. **No subir a GitHub**, aunque el repo sea privado: son fotos de asistentes.
6. La utilidad es solo de **exportación**, no restaura ni migra automáticamente. Codex debe crear y probar una rutina de importación que lea el manifiesto y los Blobs de manera segura, preservando ID y relaciones, primero sobre una base vacía de pruebas y sin sobrescribir el origen.

## Si no quieres usar la utilidad aún

Conserva intacto el navegador y el origen de la app. Se pueden seguir usando los álbumes en la máquina original, pero **esto NO es una copia de seguridad**; el navegador puede purgar el almacenamiento. Los ZIP de código y GitHub no contienen estas fotos.

## Notas para Codex

- Nombre de DB: `danz-collective-local-gallery`, versión 1.
- `albums`: `{id, name, date, order}`.
- `photos`: `{id, eventId, name, image: Blob, addedAt}`; índice `eventId`.
- El archivo HTML de exportación produce `manifest.json` y `fotos/<uuid>.bin` con los bytes originales. El `manifest` conserva `mime`, nombre, IDs y metadatos para reconstruir `Blob`s.
- Evitar sincronizar accidentalmente IndexedDB con Supabase; migración de fotos privadas solo tras permisos y consentimiento apropiados.
