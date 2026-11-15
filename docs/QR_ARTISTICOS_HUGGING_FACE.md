# QR Studio y Hugging Face

QR Studio está en Administración para cuentas con `codes.manage`, tras verificar
dos pasos. Crea QR clásicos localmente y diseños artísticos mediante el Space
público gratuito `huggingface-projects/QR-code-AI-art-generator`.

La conexión de Hugging Face del asistente ya permite buscar y leer modelos y
Spaces. Esa conexión es independiente de las credenciales del servidor de DANZ;
no hay que editar la configuración de Codex desde el móvil.

## Activación y uso en tres pasos

1. Abrir Administración → QR Studio. Escribir un enlace público o texto y el
   estilo visual. El QR clásico funciona sin token ni servicio de IA.
2. Pulsar **Generar con IA**. La app usa su servidor `/api/qr-art` y el Space
   gratuito; puede haber cola y cuotas. Si Hugging Face exige autenticación o se
   quiere usar la cuota de una cuenta, añadir `HF_TOKEN` como secreto del proyecto
   en Vercel (o en `.env` al desarrollar). Nunca usar `VITE_HF_TOKEN`, guardar la
   clave en Git ni enviarla por un chat. La plantilla `.env.example` no tiene
   credenciales reales. Reiniciar el servidor local o desplegar después del cambio.
3. Descargar el PNG cuando aparezca la vista previa. El servidor decodifica los
   píxeles del diseño y exige que el contenido coincida exactamente con lo pedido.
   Si no se lee, permite reintentar o crear el clásico. Comprobar el cartel final
   impreso con otro móvil antes de distribuirlo.

## Arquitectura y límites

- React envía contenido, prompt y el JWT DANZ a una función Node de Vercel. El JWT
  no se envía a Hugging Face. Auth valida el token y después se comprueban `aal2`,
  pertenencia administrativa y permisos actuales mediante `danz_admin_context`.
- El servidor utiliza el cliente oficial `@gradio/client` 2.8.0 y el endpoint
  `/inference`, comprobado en `/config` y `/info` del Space el 15/11/2026. No se
  han contratado GPU, Endpoints dedicados ni recursos de pago.
- `HF_TOKEN` es opcional mientras el Space permita solicitudes anónimas. Tener
  token no elimina límites. Solo se envía al Space configurado, nunca al navegador.
- Los parámetros `HF_QR_SPACE` y `HF_QR_ENDPOINT` permiten cambiar a un Space
  compatible. Un modelo con otro contrato necesita adaptar sus parámetros; el SDK
  general de inferencia no sustituye automáticamente una API de Gradio.
- Se usa el QR original como guía, corrección alta y contraste fuerte. Si el
  modelo devuelve arte que no se decodifica, se refuerza localmente la cuadrícula
  del contenido solicitado conservando la textura, sin otra llamada de IA. No se
  afirma que todo diseño generado sea escaneable: jsQR comprueba el PNG y rechaza
  el resultado si no coincide. La comprobación en pantalla no garantiza todas las
  condiciones de impresión, tamaño, luz o cámara.
- Los pases y códigos privados conservan su generación local en «Códigos y QR»;
  nunca se envían automáticamente a un Space. QR Studio informa de qué se envía y
  bloquea enlaces de pase y credenciales reconocibles.
- Un máximo de 600 bytes de contenido y 700 caracteres de prompt, PNG hasta 2 MiB
  y 2048×2048 píxeles; esperas acotadas y cancelación. No se guardan prompts, JWT,
  claves ni imágenes de asistentes. Cambiar el texto retira la vista previa anterior.
- El desarrollo Vite usa el mismo manejador de API. El alojamiento estático
  antiguo de Sites no ejecuta la función Node; la URL actual es Vercel.

## Otras mejoras desde Hugging Face

`AGENTS.md` registra la revisión de opciones gratuitas antes de nuevas funciones.
Los próximos candidatos se evaluarán por utilidad real para los gráficos de los
tres juegos, audio y búsqueda. La licencia debe permitir el uso del colectivo.
No se incorpora un modelo pesado ni se envían galerías privadas por el mero hecho
de estar disponible. Los retratos y portadas aprobados se conservan.

Fuentes: [Space y código](https://huggingface.co/spaces/huggingface-projects/QR-code-AI-art-generator),
[cliente JavaScript de Gradio](https://gradio.app/docs/js/js-client),
[funciones Node de Vercel](https://vercel.com/docs/functions/runtimes/node-js),
[validación de usuario](https://supabase.com/docs/reference/javascript/auth-getuser).
