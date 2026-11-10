# Acceso social y requisito de 200 altas

Decisión del propietario, 10 de noviembre de 2026: la app debe atender al menos
200 nuevas altas el día del evento, con entradas concentradas, y facilitar el
acceso con Google o Apple. No se presenta la demo como validada para ese volumen.

## Estado comprobado

El endpoint público `/auth/v1/settings` del proyecto `ttgehdknhnrxtddxpknc`
respondió: Google desactivado, Apple desactivado, correo activado, registro
permitido. No revela credenciales SMTP ni acredita su entrega. El propietario
reportó guardado Gmail con un aviso sobre su uso personal; recepción pendiente.

La app incorpora OAuth con PKCE para Google y Apple y solo muestra un método
cuando el servidor lo declara activado. No tiene IDs ni secretos de proveedores
en el cliente. Tras el callback, la identidad sigue validándose con `getUser()`;
ni Google, ni Apple, ni sus metadatos conceden permisos de administración.

Si la app está incrustada, pide abrirla en el navegador antes de iniciar OAuth.
Un pase pendiente se lleva únicamente en el fragmento de un enlace al mismo
origen y se retira al abrirse. No se incluye en el retorno a Google/Apple.
Esto evita crear el verificador PKCE dentro de una vista distinta del navegador
que completará el acceso. Android/iPhone físicos y PWA instalada requieren prueba
real después de activar el proveedor.

## Activar Google sin depender de la web del colectivo

Usar la cuenta del proyecto bajo control del propietario. En Google Cloud,
crear o seleccionar el proyecto y registrar una aplicación externa de tipo Web
en Google Auth Platform. Pedir solo `openid`, correo y perfil. No acceso a Gmail,
Drive ni otros servicios. Configurar la audiencia adecuada para asistentes reales:
no limitar la publicación a una lista cerrada de probadores.

| Dato | Valor de esta PWA |
| --- | --- |
| Nombre | DANZ Collective |
| Origen JavaScript | `https://danz-collective-demo.right-vine-9666.chatgpt.site` |
| Callback de Google hacia Supabase | `https://ttgehdknhnrxtddxpknc.supabase.co/auth/v1/callback` |
| Retorno de Supabase a la app | `https://danz-collective-demo.right-vine-9666.chatgpt.site/` |

El titular genera el Client ID y Client Secret y los introduce directamente en
Supabase → Authentication → Sign In / Providers → Google. Conservar la allowlist
de retorno de la PWA. El secreto no se envía por chat, Git ni Vite. Después,
comprobar acceso y alta con una cuenta real, sesión al recargar y pase pendiente.
Activar el método no requiere enlazar `danzcollective.com` ni mover usuarios/fotos.
La revisión de marca o de otros requisitos de Google puede requerir pasos externos.

## Apple

Se necesita la configuración de desarrollador Apple: App ID con la capacidad,
Services ID para la web, Team ID y clave de firma. Dominio de retorno Supabase:
`ttgehdknhnrxtddxpknc.supabase.co`, callback igual al de la tabla. El Services ID
web debe ser el primero de la lista de Client IDs del proveedor en Supabase.

El titular conserva la clave `.p8` y genera el secreto para el proveedor. No se
ha creado una cuenta de desarrollador, comprado membresía ni activado Apple.
Registrar también el remitente del correo para las direcciones privadas de Apple
si se usa su relay. Anotar el vencimiento del secreto y renovarlo a tiempo
(Apple limita su duración). Google es el primer método que se propone activar;
Apple no se anuncia como operativo mientras su configuración siga pendiente.

## Capacidad para el evento

Google/Apple autentican sin exigir un correo OTP de DANZ para cada acceso social.
El correo sigue siendo necesario como alternativa y para futuras notificaciones.
Gmail personal no es el proveedor final propuesto para el evento.

El servicio transaccional debe tener remitente autenticado y margen para altas,
reintentos y accesos posteriores. Presupuestar al menos 500 mensajes para ese día,
y ajustar el límite horario al pico previsto y al plan contratado. No basta con
que el plan anuncie 200 mensajes diarios: Supabase y el proveedor aplican sus
propios límites. Brevo es una opción compatible documentada, sin seleccionar ni
contratar; su plan gratuito de 300 al día no se presenta como margen suficiente.
Verificar dominio/remitente puede hacerse en un dominio de envío independiente:
no obliga a integrar o modificar la web del colectivo.

Antes del evento, verificar los límites globales de correo y los límites de
OAuth/token por IP, incluido el caso de asistentes compartiendo Wi-Fi. Hacer una
prueba de carga controlada en un entorno de ensayo, sin enviar cientos de correos
reales ni crear cuentas de Google falsas. Los tests con API simulada prueban flujo
y permisos; no acreditan capacidad ni entregabilidad de los proveedores reales.

La demo de Sites conserva su puerta privada de ChatGPT. Para asistentes debe
prepararse y publicar el acceso público a la PWA, manteniendo las galerías y el
panel protegidos por Supabase/RLS y MFA. Ese cambio de audiencia no se ha hecho.

## Fuentes oficiales

- https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-apple
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/self-hosting/self-hosted-oauth (contrato público de settings)
- https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web
- https://developers.brevo.com/docs/supabase-smtp-integration
