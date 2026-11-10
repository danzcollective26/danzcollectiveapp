# Correo sin dependencia del navegador solicitante

Antes de editar: los proyectos Free creados desde el 3 de junio de 2026 con
SMTP predeterminado no permiten modificar plantillas. El proyecto DANZ es
posterior y el editor aparece bloqueado. Configurar/verificar un proveedor
SMTP propio antes de aplicar el HTML. El dominio lo gestiona otra persona.
La app seguirá independiente; se ha preparado una vía provisional con Gmail
sin DNS, pendiente de autorización de su titular. No se ha activado el envío.
Pasos y comprobaciones pendientes: `docs/ACTIVACION_CORREO.md`.

La app soporta el canje oficial verifyOtp({token_hash,type:'email'}) y códigos
numéricos email+token. PKCE se mantiene para los enlaces anteriores y otros
flujos que lo usan. No se aceptan sesiones desde parámetros sin verificar.

La plantilla passwordless.html está lista para Magic Link y Confirm Signup.
La app envía RedirectTo con la raíz HTTPS del sitio actual (barra final, sin
query), que debe seguir en la allowlist. La plantilla añade token_hash y type=email.
TokenHash y Token son variables del proveedor, no credenciales guardadas aquí.

Aplicar al proyecto existente únicamente los cuerpos de esas dos plantillas,
con asunto sugerido «Tu código de acceso a DANZ». Conservar SMTP, límites,
caducidad, allowlist, proyecto y resto de plantillas. Los enlaces viejos PKCE
siguen necesitando el navegador solicitante; el nuevo comportamiento comienza
con los correos emitidos después de aplicar la plantilla.

El token de enlace se captura y retira inmediatamente de la barra antes de
inicializar el cliente; el canje se realiza contra Auth del proyecto configurado.
La URL inicial llega al hosting antes de que JavaScript pueda limpiarla; no
registrar su query en analítica propia. La app lleva referrer=no-referrer y la
plantilla de correo no incorpora recursos externos.
El canje se comparte entre montajes de StrictMode para no usar dos veces el token.
getUser() valida la identidad después del canje. Admin sigue exigiendo MFA.

La conexión Supabase disponible no edita Auth config. La aplicación local no
cambia por sí sola los correos del proveedor. La activación debe confirmarse
en Dashboard después de iniciar sesión con una cuenta autorizada del proyecto.
