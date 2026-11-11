# Fotos: archivos completos y álbum publicado

11 de noviembre de 2026.

## Problema observado

El propietario informa de archivos de 0 bytes en Android después de guardar desde la versión 29. Los originales de las seis fotos existentes permanecen completos en Storage: 542633, 438760 y 676926 bytes, cada uno en DANZ-PRUEBA (publicado) y en DANZERS WORLD · Ch. VII (borrador). Esto localiza la incidencia reportada en la entrega o escritura en el dispositivo; no demuestra por sí solo su causa exacta.

## Recorrido implementado

- Al abrir una foto se recibe el original completo con acceso autorizado y una URL firmada. Antes de ofrecer descargar/compartir se comprueban longitud, cabecera, MIME, SHA-256 cuando está registrado y decodificación de la imagen.
- Descargar utiliza una URL Blob del propio origen con nombre y extensión. El gestor de descargas no recibe directamente un enlace temporal de otro dominio. No se recomprime ni se cambia la marca de agua.
- Un archivo vacío, incompleto, alterado o ilegible no genera un enlace de descarga. El visor muestra el fallo y permite reintentar.
- El nombre y el tamaño comprobado aparecen en el visor.
- Guardar como archivo solo se habilita después de recibir la foto completa. Si hay selector nativo, se propone Imágenes; tras escribir/cerrar se vuelve a leer el archivo y se compara su tamaño y SHA-256. Un proveedor que devuelve 0 bytes no se anuncia como guardado correcto.
- Compartir utiliza el File completo, sin URL ni texto, durante el toque. La resolución del menú del sistema no acredita que Instagram haya aceptado la foto ni que se haya publicado una historia.
- Al cerrar el visor se cancela la preparación. Las URLs Blob usadas para una descarga se liberan con retraso para permitir que Android termine; las demás se liberan al salir.

## Organización del álbum

Las publicadas aparecen primero, en un bloque visual con el nombre del evento y una cuadrícula mayor. No llevan selección ni un botón para publicarlas de nuevo. Gestionar publicadas permite devolver explícitamente una selección a borrador. Los borradores quedan debajo, identificados como solo administración, con su selección y confirmación de publicación. El visor recorre únicamente el estado de la foto abierta. Se mantienen la paginación de 60, las tandas, la persistencia y la renovación de vistas previas.

## Preferencia confirmada y límite pendiente

El propietario quiere que el destino habitual sea Fotos/Galería del móvil, dejando elegir otra carpeta como opción. La PWA no puede escribir de forma automática en MediaStore/Carrete ni seleccionar una actividad concreta de Instagram. No llamar Guardar en Fotos a una descarga del navegador. Para dar esa experiencia de forma fiable se necesita un puente nativo de Android/iOS; no se ha implementado un APK ni se ha cambiado la estrategia PWA en este trabajo.

Se mantiene el menú para compartir archivos y se añade un enlace explícito para abrir Instagram dentro de la ayuda. Desde la web no se garantiza abrir Stories con la imagen ya insertada.

## Comprobaciones realizadas antes de publicar

- Compilación TypeScript/Vite y 102 pruebas internas correctas.
- Prueba en Chrome compartido de álbum, visor y descarga: JPEG de 95461 bytes; archivo descargado idéntico al original sintético byte por byte, con imagen legible.
- Inspección visual en un marco de 390 px con los estilos reales.
- Ampliadas las pruebas E2E para respuestas vacías, parciales, imágenes alteradas, reintento, lectura tras guardar (incluidos 0 bytes), compartir el File y separación de publicadas/borradores. El resultado de CI se registra en el traspaso al terminar.
- Pendiente confirmar la nueva entrega en el Android físico del propietario y su recepción en Instagram. Una prueba simulada no sustituye esas comprobaciones.

Fuentes: [Web Share](https://www.w3.org/TR/web-share/), [guardar archivos en Chromium](https://developer.chrome.com/docs/capabilities/browser-fs-access), [medios compartidos en Android](https://developer.android.com/training/data-storage/shared/media).
