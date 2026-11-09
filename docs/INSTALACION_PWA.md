# Instalar DANZ y usar Snake sin conexión

La aplicación incorpora un manifest con identidad estable, iconos PNG de
192/512 px y variante maskable, icono Apple de 180 px y modo standalone. El
monograma D. es provisional; no sustituye la futura aplicación de los logos
originales del colectivo. La demo conserva su audiencia privada de Sites.

## En el móvil

Abrir la demo con conexión en Chrome (Android) o Safari (iPhone). Si el enlace
se abrió dentro del correo/ChatGPT, pasarlo al navegador. Entrar con la cuenta
ChatGPT propietaria cuando lo pida el hosting.

Usar «Instalar DANZ» si Chrome ofrece la instalación. En caso contrario,
«Cómo instalar DANZ» muestra las instrucciones del navegador:

- Android: menú ⋮ → Instalar y crear acceso directo / Añadir a pantalla de
  inicio → Instalar.
- iPhone: Compartir → Añadir a pantalla de inicio → Añadir. Activar «Abrir
  como app web» si aparece. El menú Compartir puede estar dentro del menú de
  página según la disposición de Safari.

La app confirma instalación únicamente al recibir appinstalled o detectar
modo standalone. Aceptar/cancelar el diálogo por sí solo no simula ese éxito.
No solicita notificaciones ni permisos de cámara.

## Qué funciona sin conexión

Tras la primera carga completada, el aviso «Snake disponible sin conexión»
indica que el navegador ha activado el service worker. La app puede abrirse
desde su raíz y permite jugar a Snake. Los álbumes ya guardados explícitamente
en IndexedDB siguen teniendo el mismo carácter local. El navegador puede
liberar almacenamiento; no es una copia de seguridad ni una garantía permanente.

Cuentas, canjes QR y galerías privadas necesitan Internet y sus permisos de
servidor. No se autoriza una cuenta usando únicamente la sesión local guardada.
Al recuperar conexión, pueden utilizarse los reintentos/recarga existentes.

## Caché y actualizaciones

`npm run build` genera `dist/sw.js` con una lista cerrada de archivos estáticos
de la aplicación. No almacena respuestas de Auth, REST o Storage, fotos privadas,
URLs firmadas, callbacks, consultas de URL, pases o la herramienta de backup.
Un HTML de inicio de sesión del hosting no se acepta como shell de DANZ.
La navegación online siempre alcanza el hosting; el shell es el fallback ante
un fallo de red de la raíz sin query. Las rutas con query nunca usan ese fallback.

Los cambios de aplicación esperan confirmación antes de activar un worker nuevo
y recargar. Terminar subidas/guardar cambios antes de «Actualizar y recargar».
Se conserva un build anterior para sus bundles y se eliminan solo cachés con
el prefijo de DANZ; no se borra IndexedDB, sesiones ni cachés de otras apps.

Las pruebas de producción usan `npm run test:pwa` sobre Vite preview, con un
service worker real y corte de red en Chromium. No sustituyen la instalación
física en Android/iPhone, Safari ni una prueba de la sesión privada de hosting
desde la app ya instalada. Esa prueba del propietario sigue pendiente.

Resultado del hito: Actions `42715435217`, 68 pruebas locales/SQL y 120 recorridos
de aplicación correctos, más dos pruebas de producción offline en Chromium
(escritorio/móvil). Publicación privada confirmada el 9 de noviembre de 2026.

Fuentes:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://support.google.com/chrome/answer/9658361?hl=es
- https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios
