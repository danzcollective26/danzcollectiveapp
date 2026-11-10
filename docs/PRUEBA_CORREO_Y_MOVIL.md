# Probar el correo y la demo en móvil

Revisión: 9 de noviembre de 2026. Proyecto Supabase
`ttgehdknhnrxtddxpknc`. URL de demo: `https://danz-collective-demo.right-vine-9666.chatgpt.site` (demo privada publicada y confirmada el 9 de noviembre de 2026).

## Qué falta para el enlace de acceso

**Actualización:** el editor de plantilla aparece deshabilitado en las capturas.
La restricción de Free para proyectos nuevos con SMTP predeterminado impide
editarlo hasta configurar un servicio propio. El dominio lo administra otra
persona. La decisión del 10 de noviembre es mantener la app independiente;
la vía provisional con Gmail requiere una contraseña de aplicación autorizada
por su titular, sin DNS ni enlace a la web. Sigue pendiente de activación.
Ver [Activación del correo](ACTIVACION_CORREO.md) antes de pedir pegar
HTML o prometer que los correos ya incluyen un código numérico. Los pasos de
abajo siguen siendo la prueba limitada con el enlace PKCE predeterminado.

La app solicita el enlace con `emailRedirectTo` igual a la raíz del dominio
desde el que se abre: `https://danz-collective-demo.right-vine-9666.chatgpt.site/` (incluida la barra final).
Usa PKCE. No requiere una ruta `/auth/callback` adicional en esta versión.

El ajuste mínimo para esta demo es este:

1. Abrir [Authentication → URL Configuration](https://supabase.com/dashboard/project/ttgehdknhnrxtddxpknc/auth/url-configuration).
2. En **Redirect URLs**, pulsar **Add URL** y añadir la URL HTTPS exacta de
   `https://danz-collective-demo.right-vine-9666.chatgpt.site/`. Conservar las URLs existentes y guardar.

**Site URL** es el destino predeterminado cuando no se envía un redirect.
Si todavía apunta a localhost y esta demo será el único destino, se puede
poner la misma URL de demo. Si ya apunta a un sitio vigente, conservarlo:
para el flujo actual basta añadir la URL en **Redirect URLs**, porque la app
manda el destino explícitamente. No usar comodines amplios como `https://**`.

No hace falta enviar claves ni contraseñas por chat. La demo de Sites está
configurada como privada: primero hay que entrar con la cuenta ChatGPT dueña
del sitio. Esa sesión es independiente de la cuenta DANZ en Supabase.

## Qué correo sirve para la primera prueba

Si el proyecto usa el **SMTP predeterminado de Supabase**, solo entrega a
direcciones que sean miembros del equipo de la organización Supabase.
Una cuenta de la app o una cuenta de GitHub por sí solas no bastan.
Otros destinatarios pueden recibir el error **Email address not authorized**.
El servicio predeterminado tiene límites bajos y no garantiza entrega.

Para una prueba personal, usar la dirección de un miembro ya existente del
equipo Supabase. No añadir personas como administradoras de la organización
para darles acceso a DANZ. El correo general para asistentes requerirá un
SMTP propio configurado en [Authentication → SMTP Settings](https://supabase.com/dashboard/project/ttgehdknhnrxtddxpknc/auth/smtp).
No se ha comprobado si este proyecto tiene SMTP propio; no se han leído sus
credenciales ni se han cambiado proveedores, plantillas o configuración.

## Prueba mínima en el teléfono

1. Abrir la URL de la demo en Chrome o Safari y entrar en **Cuenta**.
2. Solicitar acceso usando el correo autorizado del equipo Supabase.
3. Abrir el enlace del correo **en el mismo navegador y teléfono donde se
   solicitó**. Si el correo abre su navegador interno, elegir abrirlo en
   Chrome/Safari correspondiente. PKCE necesita el verificador que guarda
   ese navegador; pedirlo en el ordenador y abrirlo en el móvil no valida
   ese flujo.
4. Confirmar que vuelve al dominio de demo, aparece la cuenta y se conserva
   al recargar. Cerrar sesión para comprobar la salida.

Si la plantilla incluye un código numérico, la app también permite
introducirlo. No asumir que el correo lo muestra: las plantillas no se han
inspeccionado. No es necesario cambiar la plantilla para probar un enlace
predeterminado funcional. No pegar en chat enlaces de acceso, códigos OTP
ni capturas que los revelen.

Si aparece una galería vacía tras entrar, eso no demuestra un fallo de
correo: una cuenta necesita asistencia autorizada a un evento con fotos
publicadas. No subir imágenes reales ni adjudicar permisos para sortear la
comprobación de acceso durante esta prueba.

## Qué pudo automatizarse y qué no

Se revisaron todas las herramientas Supabase disponibles. Permiten SQL,
metadatos de proyecto, claves publicables y despliegue de funciones, pero
**no exponen lectura/edición de Auth config** (`site_url`, `uri_allow_list`,
plantillas o SMTP). No hay una herramienta genérica autenticada para invocar
el API de configuración de Auth.

La Management API documenta `GET/PATCH /v1/projects/{ref}/config/auth`, con
permisos OAuth Auth Read/Write. La conexión de herramientas no ofrece esa
operación ni un token reutilizable autorizado para hacerlo desde shell.
No se intentó extraer tokens del conector ni leer secretos del entorno.
Los ajustes de URL anteriores son la alternativa mínima de Dashboard si no
se habilita una vía de gestión de Auth compatible.

No se enviaron correos ni se modificó Auth durante la investigación inicial.

**Prueba posterior confirmada el 9 de noviembre de 2026:** el propietario
comprobó el acceso por correo y la conservación de la sesión al recargar
en su móvil. Supabase registró una cuenta con correo confirmado y un inicio
de sesión reciente. El acceso privado de Sites requirió usar la cuenta
ChatGPT propietaria; la cuenta DANZ es independiente. Esta prueba individual
no valida todavía envío a otros asistentes, otros dispositivos o navegadores.

## Fuentes oficiales consultadas

- [Redirect URLs y Site URL](https://supabase.com/docs/guides/auth/redirect-urls).
- [Correo sin contraseña y OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
- [SMTP predeterminado, destinatarios y SMTP propio](https://supabase.com/docs/guides/auth/auth-smtp).
- [Permisos OAuth de Management API](https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes).
- [Changelog de Supabase](https://supabase.com/changelog.md).
