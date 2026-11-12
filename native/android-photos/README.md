# DANZ Fotos · Android nativo

Complemento piloto para Android 10 o posterior. La PWA conserva las cuentas, los pases, los sellos y la galería privada. El complemento recibe únicamente un enlace firmado de corta duración para la fotografía elegida, su nombre, MIME, tamaño y SHA-256. No recibe la sesión ni claves de Supabase y no solicita acceso para leer toda la galería del móvil.

## Comportamiento

1. Instalar el APK de prueba y abrir DANZ Fotos.
2. Pulsar **ABRIR DANZ**: se usa el navegador habitual y se activa el destino nativo en ese dispositivo.
3. En la PWA, abrir una foto y pulsar **GUARDAR EN FOTOS · ANDROID**.
4. Android descarga y verifica el original, lo escribe en `DCIM/DANZ` sobre `VOLUME_EXTERNAL_PRIMARY`, vuelve a leerlo y solo entonces lo hace visible en `MediaStore.Images`. Solicita un refresco del índice y comprueba MIME, tamaño, dimensiones y estado publicado. Se conserva el nombre, la calidad y la marca de agua. Si falla, se elimina únicamente la inserción pendiente que acaba de crear el complemento.
5. El complemento muestra el nombre real, dimensiones, bytes y carpeta. **ABRIR FOTO GUARDADA** entrega el URI y MIME al visor de imágenes elegido. **GUARDAR COPIA EN DESCARGAS** crea otra copia verificada en `Download/DANZ`, sin una nueva descarga de red. Compartir y volver a la PWA permanecen disponibles.

La versión 0.2 (código 2) conserva el mismo paquete, firma y protocolo que la 0.1, para actualizar sobre la instalación existente. No recomprime, no cambia EXIF, no escribe fechas/dimensiones de solo lectura en MediaStore y no cambia orientación ni resolución. Una escritura verificada y la aparición en una galería concreta son estados distintos; si el índice tarda, la app lo explica y permite abrir el archivo igualmente.

La versión 0.3 (código 3) corrige el icono de inicio: flor negra sobre fondo blanco opaco, con margen para el recorte del lanzador. Conserva paquete, firma y lógica de guardado de la 0.2. El propietario confirmó el 12/11/2026 que la galería y las descargas de la 0.2 funcionan en su teléfono. La nueva apariencia de la 0.3 aún debe actualizarse en ese dispositivo.

La instalación principal sigue siendo la PWA mediante **INSTALAR DANZ**. Este complemento Android es opcional y no sustituye ese botón. La página de descarga ya entregada (`/android/danz-fotos-0.2`) conserva su URL y ofrece la actualización 0.3; el APK 0.2 se conserva como versión anterior.

«Descargar JPG» y «Guardar como archivo» siguen disponibles para elegir otros destinos. Guardar en la galería del dispositivo no equivale a subir la foto a Google Fotos ni activa la copia de seguridad de ese servicio.

## Stories

El menú nativo permite compartir el `content://` de una imagen ya registrada en la galería. No garantiza que Instagram ofrezca el destino Historia en todos sus dispositivos/versiones.

La ruta específica `com.instagram.share.ADD_TO_STORY` está preparada pero desactivada mientras `DANZ_META_APP_ID` esté vacío. Para habilitarla hace falta el ID público numérico de una aplicación registrada en Meta y validar el resultado en Instagram real. No se necesitan contraseña de Instagram, token de la cuenta ni secreto de cliente en la app. No declarar esa integración como operativa sin el ID y la prueba física.

## Compilación

Proyecto Java sin dependencias AndroidX. Gradle 8.13, Android Gradle Plugin 8.13.2, JDK 17+, SDK Android 36 y Build Tools 35.0.0. CI en `.github/workflows/android-photos.yml`.

```sh
cd native/android-photos
gradle testDebugUnitTest assembleDebug
```

También se puede compilar con las herramientas oficiales del SDK, sin Gradle, mediante `ANDROID_SDK_ROOT=/ruta/al/sdk DANZ_PILOT_KEYSTORE=/ruta/clave-original.p12 python3 build-pilot.py`. Esta vía usa aapt2, javac, D8, zipalign y apksigner; genera `.pilot-build/DANZ-Fotos-Android-pilot.apk` y conserva la clave de prueba en esa carpeta, fuera de Git.

El APK `app/build/outputs/apk/debug/app-debug.apk` o `.pilot-build/DANZ-Fotos-Android-pilot.apk` es un piloto. La distribución estable necesita conservar una clave de firma propia y preparar el flujo de actualizaciones antes de ofrecerla al público. No publicar ni confirmar instalaciones de un APK cuyo build/firma no estén verificados. Los permisos se limitan a INTERNET y a permisos temporales de lectura de la foto compartida.

## Validaciones

- `PhotoRequestTest`: origen HTTPS/bucket fijo, límites de tamaño, parámetros repetidos y checksum.
- La red rechaza redirecciones, cuerpos vacíos/parciales, MIME incorrecto, bytes distintos o exceso de tamaño.
- La publicación en la galería se hace después de comprobar la escritura. El contenido no se recomprime.
- Confirmación del propietario (12/11/2026): galería visible y descargas operativas con la 0.2. La prueba física del nuevo icono 0.3 y la ruta específica de Stories siguen pendientes.

Referencias: [MediaStore](https://developer.android.com/training/data-storage/shared/media), [Intents desde Chrome](https://developer.chrome.com/docs/android/intents), [AGP 8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes).
