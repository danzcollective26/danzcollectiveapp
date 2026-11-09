# Activación del correo de DANZ

Estado comprobado el 9 de noviembre de 2026:

- Proyecto Supabase `ttgehdknhnrxtddxpknc`, creado el 4 de noviembre de 2026.
- Las capturas muestran Free, la pestaña Source deshabilitada y el formulario
  SMTP con campos vacíos. El interruptor verde por sí solo no demuestra que se
  haya guardado un proveedor válido. El propietario indicó que otra persona
  gestiona `danzcollective.com`.
- Supabase bloquea la edición de plantillas de los proyectos Free nuevos que
  usan su correo predeterminado desde el 3 de junio de 2026. Un SMTP propio
  permite editar las plantillas conservando Free. El servicio de envío puede
  tener sus propios límites y costes; todavía no se ha elegido ni contratado.

## Lo necesario de la persona que gestiona el dominio

Primero, confirmar dónde se gestionan los DNS y si ya hay un servicio de envío
de correo compatible con SMTP. Si existe, revisar si admite correos de acceso
de la app y el volumen previsto. La capacidad depende de asistentes y accesos,
no del número de fotos.

Si hace falta otro proveedor, crear/configurar su cuenta bajo control del
colectivo y generar los registros de verificación que solicite. Puede usarse
un subdominio dedicado, por ejemplo `auth.danzcollective.com`, pendiente de
confirmación por quien gestiona el dominio. Esa persona añade los registros
exactos generados por el proveedor. No hay valores DNS listos para copiar aún.
Conservar los registros de la web y del correo actual; no sustituir los MX de
la raíz para habilitar únicamente el envío de la app.

No es necesario compartir la contraseña del dominio ni conceder acceso
administrativo a Supabase para añadir esos DNS. Las credenciales SMTP se
introducen directamente en el panel autorizado, nunca en el chat ni en Git.

## Después de verificar el remitente

1. Configurar un remitente verificado, nombre DANZ Collective y los parámetros
   SMTP exactos en [Supabase](https://supabase.com/dashboard/project/ttgehdknhnrxtddxpknc/auth/smtp).
   Guardar únicamente una configuración completa.
2. Aplicar `supabase/email-templates/passwordless.html` en Magic Link y Confirm
   Signup. Asunto: «Tu código de acceso a DANZ». Conservar el resto de ajustes.
3. Solicitar un correo nuevo. Probar por separado el código numérico y un
   segundo correo cuyo enlace se abra en otro navegador. Cada código/enlace
   sirve una sola vez; no reutilizar el mismo para ambas pruebas.
4. Comprobar recepción, validación de la cuenta y persistencia tras recargar.
   Revisar los límites del proveedor y de Supabase antes de un evento público.

Mientras esto siga pendiente, la prueba individual con el correo permitido
por Supabase puede usar el enlace predeterminado solicitándolo y abriéndolo
en el mismo navegador. No demuestra entrega al resto de asistentes. No añadir
asistentes al equipo de administradores para sortear esa limitación.

## Referencias oficiales

- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-supabase-smtp (ejemplo compatible; no seleccionado)
- https://resend.com/docs/dashboard/domains/introduction
