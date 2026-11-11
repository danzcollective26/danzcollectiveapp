# Galería y almacenamiento

## Archivo JPG en Android — 11 de noviembre de 2026

El visor muestra el nombre y formato del original, por ejemplo 1000273117.jpg. La acción DESCARGAR JPG entrega un enlace privado de Storage con nombre de archivo y Content-Disposition de adjunto, para que el navegador guarde el original como archivo. Los enlaces se renuevan cada 45 segundos y caducan a los 60, sin guardar URLs firmadas en almacenamiento local.

En móviles compatibles, GUARDAR O COMPARTIR JPG prepara un File con el nombre, MIME image/jpeg y bytes originales. Abre el selector nativo solo por una acción del usuario; si una descarga lenta consume la activación del primer toque, deja el archivo preparado y solicita otro toque. Cancelar el selector no se trata como un fallo. El File temporal se descarta al salir del visor o cambiar de cuenta/foto. No se recomprime ni se retira la marca de agua.

Android puede mostrar un archivo descargado mediante una URI content://media/external/downloads y un identificador numérico. Esa URI no es el nombre del archivo. La descarga puede localizarse desde Archivos → Descargas y abrirse o compartirse desde allí. Queda por confirmar el resultado en el móvil físico del propietario.

## Álbumes persistentes y acceso del administrador — 11 de noviembre de 2026

Las fotos completadas se conservan en el servidor dentro del evento, como borradores o publicadas. Salir del panel, volver atrás, recargar o elegir otra tanda no las borra. El álbum seleccionado se recuerda por cuenta en la sesión del navegador y se incluye en la URL; los archivos de una carga todavía incompleta deben reseleccionarse para continuarla.

Fotos muestra «Mis álbumes» a administradores con events.manage. Permite abrir sus eventos sin tener que concederse un sello de asistente; usa los RPC administrativos y la misma comprobación MFA. «Galerías con mi sello» mantiene el recorrido habitual de asistentes. No se amplían permisos ni se hacen públicos borradores o archivos.

La revisión del álbum aparece antes de los códigos/QR, con filtros de borradores/publicadas y acceso a añadir otra tanda. Las miniaturas renuevan su enlace privado antes de caducar. Al pulsar una foto se abre un visor dentro de DANZ, con zoom, cambio de foto y descarga del archivo original conservando sus bytes y nombre. Atrás cierra primero la foto y conserva el álbum. La navegación entre secciones también mantiene historial interno.

Las pruebas de regresión cubren salida/vuelta/recarga, segunda tanda, publicación, renovación de enlaces, acceso administrativo sin asistencia, descarga exacta y Atrás desde el visor. Los datos de esas pruebas son sintéticos; no publican ni modifican fotos de producción.

Objetivo del 9 de noviembre de 2026: primera versión utilizable el 16 de noviembre,
centrada en Fotos, QR/sellos y Snake. Es una previsión, pendiente de correo real,
primer acceso administrativo/MFA y pruebas en teléfonos reales.

La primera galería admite hasta 600 JPG/PNG/WebP por tanda y 25 MiB por archivo.
Los archivos de descarga conservan exactamente los bytes subidos y deben incorporar
ya la marca de agua. Solo la vista previa se redimensiona a 960 px de lado largo.
La carga secuencial limita memoria. El SHA-256 por evento evita duplicados al
reseleccionar archivos. Una transferencia fallida se reintenta por archivo; no es TUS.
Mantener la pantalla abierta; después de salir hay que reseleccionar los archivos.
Los archivos/reservas incompletos se conservan para el reintento.

La gestión usa el permiso existente events.manage y MFA. Las fotos se suben como
borradores, se revisan por páginas de 60 y se publican por selección con confirmación.
Los asistentes solo consultan fotos publicadas de eventos con asistencia autorizada.
Archivar conserva la galería publicada y detiene nuevos canjes. Borradores de evento
y fotos en cuarentena siguen ocultos. No se borran fiestas anteriores automáticamente.

La galería carga 60 vistas previas y ofrece cargar más. El archivo de buena calidad
se pide al abrir/descargar. Todas las URLs son privadas y caducan a los 60 segundos.
La aplicación reserva un presupuesto inicial de 900 MB, contando objetos y reservas
pendientes, con serialización en servidor. No es el medidor de facturación del proveedor.

## Capacidad orientativa

MB/GB decimales. Añadir el espacio de las vistas previas a estas cifras.

| Fotos | Tamaño medio por JPG | Archivos de descarga |
| --- | --- | --- |
| 500 | 1 MB | 500 MB |
| 600 | 1 MB | 600 MB |
| 600 | 2 MB | 1,2 GB |
| 600 | 5 MB | 3 GB |

No se reduce silenciosamente la calidad de descarga para encajar en el plan.
Las visitas/descargas consumen transferencia, distinta del almacenamiento.

## Referencias oficiales comprobadas el 9 de noviembre de 2026

| Servicio | Incluido gratis | Referencia de ampliación |
| --- | --- | --- |
| Supabase Free | 1 GB de archivos; 5 GB de egress y 5 GB de cached egress | Pro desde 25 USD/mes, 100 GB de archivos incluidos |
| Cloudflare R2 Standard | 10 GB-mes; 1 millón de operaciones A y 10 millones B/mes; salida a Internet gratuita | 0,015 USD/GB-mes adicional; operaciones adicionales de pago |

Fuentes: https://supabase.com/pricing y https://developers.cloudflare.com/r2/pricing/.
R2 es una opción futura para conservar más eventos. Requiere integrar entrega privada
y permisos; puede haber otros costes de servidor. No está conectado ni contratado.
No se ha activado un plan de pago, enviado correo ni cargado ninguna foto del usuario.
La interfaz de solicitudes de retirada y su revisión sigue pendiente; los borradores
de esta entrega no sustituyen ese proceso de moderación.

## Guardar en carpeta y usar la foto en Instagram (11/11/2026, versión 29)

El propietario confirmó que abrir la descarga en su Android seguía mostrando una imagen en el navegador y que elegir Instagram desde compartir no cargaba la historia. La confirmación anterior de 344 pruebas no demostraba el recorrido físico de su teléfono.

- Se añade GUARDAR JPG COMO ARCHIVO (o el formato original) cuando existe showSaveFilePicker. Abre el selector del dispositivo durante el toque, antes de esperar a la red; propone Imágenes, nombre y MIME/extensión del original. Escribe los bytes originales y confirma solo después de cerrar correctamente la escritura. No guarda handles ni fotos en el almacenamiento de la PWA.
- La cancelación del selector es silenciosa; un error de escritura no se anuncia como guardado. Cerrar/cambiar de foto o cuenta cancela el trabajo pendiente y no inicia una escritura posterior. Si la selección tarda, se usa el enlace renovado o se firma uno nuevo al continuar.
- DESCARGAR sigue disponible como alternativa cuando el navegador no expone el selector o lo bloquea. Guardar un archivo no garantiza que todas las galerías lo indexen inmediatamente.
- COMPARTIR ARCHIVO envía solo files: un File de imagen, sin title, text ni url. Una respuesta satisfactoria del sistema no acredita publicación ni recepción por el editor de historias de Instagram.
- Se añade ayuda en el visor: guardar el JPG, abrir Instagram → + → Historia → Galería y elegir la carpeta. La PWA no promete controlar la actividad nativa de historias. Un flujo específico nativo requeriría la integración oficial de Android/iOS.

Pruebas: selector simulado con activación del toque, nombre/MIME y bytes exactos, cancelación sin descarga, error de escritura con abort, cierre del visor durante selección, compartir sin texto/enlace, descarga adjunta de respaldo y foco del visor. Sigue pendiente la comprobación del selector y de Instagram en el Android físico del propietario.
