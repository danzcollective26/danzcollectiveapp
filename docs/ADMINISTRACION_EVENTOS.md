# Administración de eventos y pases

El panel se abre desde Cuenta → Abrir administración, o desde Administrar en
la navegación. Solo aparece para una cuenta con membresía administrativa; no
es un selector de rol ni concede acceso por estar visible.

## Primer acceso

1. Iniciar sesión con la cuenta del colectivo ya confirmada.
2. Abrir Administración y pulsar Configurar dos pasos.
3. Añadir la cuenta a una aplicación de autenticación mediante el QR o la clave
   manual (útil desde el mismo móvil), e introducir en la web su código actual.

No enviar claves ni códigos de autenticación por chat. La configuración inicial
invalida las otras sesiones de la cuenta, según el comportamiento de Supabase.
La clave solo existe en memoria durante la configuración; no se escribe en
el repositorio, IndexedDB, localStorage, reportes ni registros del programa.
Se puede cancelar el factor no verificado que se acaba de crear. Esta versión
no incluye eliminación de factores verificados ni recuperación automática si
se pierde el autenticador; ese procedimiento debe realizarlo el propietario
desde el proveedor de autenticación con verificación de identidad.

## Eventos y códigos

- Crear eventos como borrador, editar título/horas, publicar y archivar. Las
  horas se introducen en la zona del navegador y se guardan como instantes UTC.
  Publicar requiere una fecha de inicio. No hay borrado de eventos: se conservan
  los sellos existentes. Los borradores/archivados no admiten nuevos canjes.
- Emitir códigos con caducidad obligatoria y cupo opcional. Se pueden preparar
  en borradores y solo podrán canjearse una vez publicado el evento.
- Código aleatorio de 128 bits generado con Web Crypto; solo su SHA-256 se
  envía al servidor. El enlace usa #pase=... y el QR se genera localmente.
- Descargar el PNG o copiar el enlace mientras se muestra. El código en claro
  no se recupera desde la lista; si se pierde, revocarlo y emitir otro.
- Una emisión incierta mantiene el mismo ID/hash para poder reintentarse sin
  duplicados. La lista muestra usos, cupo, caducidad y revocación, nunca hashes.
- Revocar requiere confirmación; no elimina los sellos ya conseguidos. Mostrar
  el código a asistentes sigue demostrando posesión, no presencia física.

La demo mantiene su audiencia privada. Sus QR no convierten el sitio en público.
El panel lista los 200 eventos y 100 códigos por evento más recientes. La
paginación histórica, delegación de roles desde la interfaz, subidas de fotos,
moderación, auditoría administrativa avanzada y recuperación de MFA quedan pendientes.

## Permisos y servidor

Los alcances events.manage y codes.manage se asignan por separado en una tabla
con RLS. El cliente solo puede leer sus propios alcances; no puede asignarlos.
La membresía en danz_admins no basta para operar. Los RPC comprueban cada vez
la identidad, la membresía actual, el alcance requerido y un JWT firmado con
aal2. No se usan user_metadata ni controles de interfaz como autorización.
Las implementaciones privilegiadas viven en danz_private, con search_path
vacío; los wrappers públicos son invoker y anon no tiene EXECUTE. El helper
de autorización tampoco es ejecutable directamente por authenticated.

Revocar alcances/membresía tiene efecto en la siguiente operación. La AAL sigue
la vigencia del JWT emitido por Supabase; no se ha añadido un mecanismo propio
de invalidación instantánea de tokens. El cambio de cuenta desmonta el panel y
borra de memoria códigos/QR/configuración MFA; los errores de permiso lo cierran.

Las pruebas SQL usan roles reales en PostgreSQL aislado. Las pruebas Playwright
de Auth/MFA/API son simuladas y no envían correos ni inscriben factores reales.
No sustituye la vinculación del autenticador ni una prueba física del propietario.
