# Funcionamiento independiente y materiales del colectivo

Decisión del propietario, 10 de noviembre de 2026: seguir sin acceso a la web
ni al dominio del colectivo y dejar su conexión para después.

## Web y cuentas

`src/content/collective.json` contiene `websiteUrl: null`. DANZFLOR abre dentro
de la app sin depender de una tienda externa. Añadir una URL HTTPS verificada
en ese campo mostrará un enlace opcional; no cambia el dominio de la PWA,
el acceso Supabase, los usuarios, sus sellos ni sus galerías. La app utiliza
su propio origen para el retorno de los correos de acceso.

El correo necesita un servicio de envío autorizado. Esto es independiente
de enlazar la web. La vía provisional sin DNS y sus pasos están en
[Activación del correo](ACTIVACION_CORREO.md). No se ha activado SMTP.

## Material que falta recibir

- Paleta de colores y tipografía oficiales. El propietario no quiere los marcos
  de colores alrededor de los artistas; revisar su diseño al recibir estos
  materiales, sin anteponer ese cambio a los procesos del evento (11 de noviembre).
- Una foto por integrante, con su nombre o apodo y permiso para aparecer en
  el juego. No se necesitan sus credenciales ni cuentas de redes sociales.
- La flor original para la cabeza de Snake, cuando se incorpore la marca final.

Se han recibido e integrado los perfiles reales de Chicharro (ES), TonyDawgs,
Wizme y LEÖN; no se han recibido las caras completas para Snake.

## DJs integrados

Nombres artísticos contrastados con las respuestas oEmbed oficiales de los
cuatro enlaces Spotify facilitados por el propietario. Los tres enlaces cortos
de SoundCloud se resolvieron a `/chicharro-es`, `/tommy-podesta` y `/wizmemusic`.
El enlace a una pista de LEÖN se convirtió al perfil `/leoen-358114940`, como
pidió el propietario. Se eliminaron parámetros de seguimiento y enlaces de apps.

Todos tienen la misma tarjeta y el orden SoundCloud, Spotify, Instagram,
YouTube y MavelPoint cuando existe. El YouTube compartido por TonyDawgs es
DANZ IN Records y se identifica expresamente como tal. Chicharro (ES) y LEÖN
no llevan canal de YouTube: no se ha inventado ninguno. Solo se incorporó el
MavelPoint facilitado por el propietario, sin añadir perfiles por coincidencia
de nombre ni copiar biografías o estadísticas externas. Después, el propietario
pidió añadir retratos: se incorporan las cuatro fotos oficiales de Spotify,
con encuadre, blanco y negro y fondo común mediante CSS. Las fuentes constan
en [FUENTES_RETRATOS_DJS.md](FUENTES_RETRATOS_DJS.md). Las fotos, nombres y
botones son enlaces nativos en la misma ventana. Al volver desde una plataforma,
la URL `?seccion=musica` recupera esta sección. No se ha podido reproducir
el navegador concreto del teléfono del propietario; se elimina la dependencia
de abrir pestañas nuevas y se prueba navegación y retorno.

## Incorporar las caras

Preparar recortes cuadrados preferentemente de 256 × 256, JPG, PNG o WebP,
máximo 512 KiB por archivo. Guardar solo copias autorizadas y optimizadas en
`public/arcade/faces/`. Estos recursos serán públicos para quien pueda abrir
la app y se guardarán para jugar sin conexión; no usar fotos de galerías
privadas ni originales de alta resolución. La cabeza puede guardarse en
`public/arcade/brand/`.

Configurar cada cara con `id`, `name` e `image` (ruta `/arcade/faces/apodo.webp`)
dentro de `snake.faces`. `snake.headImage` admite una ruta de marca o `null`.
Snake alterna las caras como comida; al recogerlas, aparecen atenuadas en el
cuerpo. Sin materiales conserva las casillas de colores. Si una imagen no
carga, la casilla original sigue visible y la partida funciona. Las animaciones
individuales de gestos siguen pendientes.

La compilación rechaza rutas ajenas a Arcade, tipos no permitidos, archivos
inexistentes, firmas incorrectas e imágenes mayores de 512 KiB. Solo precarga
las imágenes expresamente indicadas, nunca todas las fotos de una carpeta.

## Incorporar perfiles

Cada entrada de `artists` lleva `id`, `name` y `links` (lista de URLs).
DANZ IN muestra el nombre y botones oficiales. Se admiten perfiles directos
Spotify `/artist/…`, SoundCloud `/nombre`, Instagram `/nombre`, YouTube
`/@nombre` o `/channel/…` y MavelPoint `/artist/nombre/overview`.
No se admiten enlaces abreviados ni pistas en lugar de perfiles.
`youtubeChannelName` permite identificar el nombre de un canal compartido.

Los enlaces eliminan parámetros de seguimiento. Las plataformas solo se abren
al pulsar su botón; no se cargan reproductores, cookies o recursos externos al
entrar en la sección. Los nombres son texto, no HTML. Añadir otra plataforma
requiere extender la lista de dominios y comprobar el perfil con el propietario.

Después de añadir material: `npm test`, `npm run build` y la comprobación visual
del tablero y las tarjetas en móvil. No introducir tokens, contraseñas, enlaces
privados de acceso ni credenciales en este archivo de contenido.
