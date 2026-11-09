# Galería y almacenamiento

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
