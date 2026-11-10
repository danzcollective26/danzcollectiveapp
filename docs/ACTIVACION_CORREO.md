# Activación del correo de DANZ sin depender de la web

Revisión: 10 de noviembre de 2026. Proyecto Supabase `ttgehdknhnrxtddxpknc`.

La app funciona en su propia dirección. No necesita vincularse a la web del
colectivo ni cambiar su dominio. `danzcollective.com` lo gestiona otra persona;
el propietario ha pedido dejar esa conexión para más adelante.

**Estado real:** parámetros e instrucciones preparados; no se ha guardado un
SMTP propio, autorizado Google ni comprobado entrega a nuevos destinatarios.
No poner contraseñas, códigos de acceso ni enlaces de sesión en el chat o Git.

## Primera vía: cuenta Gmail del proyecto, para pruebas pequeñas

Puede enviarse desde `danzcollectiveapp@gmail.com` sin modificar DNS. La persona
con control de esa cuenta debe autorizar una contraseña de aplicación. No es
la contraseña normal del correo ni el acceso «Continuar con Google» de los
asistentes. No activa Google como proveedor de inicio de sesión de la app.

1. Abrir [la cuenta de Google](https://myaccount.google.com/security) e iniciar
   sesión con **danzcollectiveapp@gmail.com**. Si no se controla esa cuenta,
   no continuar con otra identidad por error.
2. Activar **Verificación en dos pasos** si todavía no está activada.
3. Abrir [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords),
   crear una llamada **DANZ Supabase** y conservarla solo para introducirla en
   el formulario autorizado. Algunas cuentas, políticas de organización o
   configuraciones de seguridad no permiten esta opción: si no aparece, no
   sustituirla por la contraseña normal ni desactivar protecciones.
4. Abrir [Supabase → Authentication → SMTP Settings](https://supabase.com/dashboard/project/ttgehdknhnrxtddxpknc/auth/smtp)
   con una cuenta administradora del proyecto. Activar SMTP propio y completar
   los campos siguientes; pegar la contraseña de aplicación directamente allí.
5. Guardar la configuración completa. Si no se dispone de la contraseña,
   cancelar el formulario sin guardar campos vacíos.

| Campo en Supabase | Valor preparado |
| --- | --- |
| Sender email address | `danzcollectiveapp@gmail.com` |
| Sender name | `DANZ Collective` |
| Host | `smtp.gmail.com` |
| Port | `587` (STARTTLS) |
| Username | `danzcollectiveapp@gmail.com` |
| Password | Contraseña de aplicación generada por el titular; pendiente |

Es una vía para pruebas de poco volumen. Gmail personal puede bloquear el
envío al superar sus límites (Google documenta más de 500 mensajes diarios,
con bloqueos de 1–24 horas); no garantiza entregar un lote de accesos para
500–600 asistentes. También se aplican los límites de Supabase. La app no
se conecta directamente a Gmail: Supabase usa el SMTP autorizado y las
credenciales permanecen allí.

## Plantillas y prueba real después de guardar SMTP

El proyecto se creó el 4 de noviembre de 2026. Supabase no permite editar las
plantillas de proyectos Free nuevos que usan SMTP predeterminado desde el
3 de junio de 2026. Un SMTP propio permite editarlas conservando Free.
El interruptor verde con campos vacíos de las capturas no confirma activación.

1. En las plantillas **Magic Link** y **Confirm Signup**, pegar el cuerpo de
   `supabase/email-templates/passwordless.html`. Asunto: **Tu código de acceso a DANZ**.
   Conservar el resto de plantillas y ajustes.
2. Mantener en las redirecciones permitidas la raíz HTTPS exacta de la PWA:
   `https://danz-collective-demo.right-vine-9666.chatgpt.site/`.
   No introducir la web del colectivo como destino de acceso a la app.
3. Solicitar un correo nuevo desde Cuenta y probar el código numérico.
4. Solicitar **otro** correo y abrir su enlace en otro navegador. Cada correo
   sirve una sola vez: no reutilizar el de la prueba anterior.
5. Comprobar recepción también en un destinatario de prueba fuera del equipo
   Supabase, cuenta verificada, sesión tras recargar y cierre de sesión.

La demo de Sites conserva el acceso privado para su propietario. El SMTP no
quita ese requisito de ChatGPT. La prueba individual anterior no valida envío
general, y los tests automáticos no envían correos reales.

## Conexión con el dominio más adelante

Cuando haya acceso, elegir un proveedor transaccional apto para el volumen del
evento y verificar su remitente con los registros DNS que él genere. Puede
usarse un subdominio dedicado; no sustituir los MX ni tocar la web actual.
Cambiar únicamente los parámetros SMTP de Supabase y probar recepción. No
requiere recrear cuentas, sellos, fotos, códigos de eventos ni la PWA.

Un botón hacia la web/tienda es otra opción independiente, preparada en
`src/content/collective.json`. Cambiar el alojamiento/dominio de la propia PWA
sería una migración distinta: requeriría revisar redirecciones y datos locales.

Mientras SMTP siga pendiente, Supabase predeterminado limita el envío a miembros
del equipo y tiene límites bajos. No añadir asistentes como administradores
para sortearlos. Los enlaces antiguos PKCE requieren el mismo navegador donde
se solicitaron; los códigos y enlaces nuevos solo llegan tras aplicar la plantilla.

## Documentación oficial comprobada

- https://support.google.com/accounts/answer/185833?hl=es
- https://support.google.com/mail/answer/7104828?hl=es
- https://support.google.com/mail/answer/22839?hl=es
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
