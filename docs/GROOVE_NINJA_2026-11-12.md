# GROOVE NINJA — decisión del propietario

Nombre definitivo elegido el 12/11/2026: **GROOVE NINJA**, guiño a Fruit Ninja. El propietario prefiere la idea de cortar sonidos y scratch a un clon de Guitar Hero; un modo de pulsaciones al ritmo puede añadirse más adelante.

## Primera sesión jugable — VINYL CUT

El propietario pidió seguir con el juego y reforzó expresamente un modo como Fruit Ninja: **cortar vinilos y una estética potente**. Se implementó una sesión de práctica de 60 segundos, cinco vidas y tres tramos de intensidad (20 s cada uno). Los vinilos describen arcos, se cortan con el segmento completo del gesto al mover el dedo —sin esperar a levantarlo— y se separan en dos mitades según la dirección del corte. Estela, fragmentos, etiquetas y multiplicador hasta ×4; los acoples rojos se esquivan.

Tres ventanas de scratch (10, 30 y 50 segundos): sujetar el disco grande y cambiar tres veces de dirección sin soltar. El acierto mejora las cuatro capas; un vinilo perdido baja una capa y consume una vida. Al perder: **PARTY OVER**. Al llegar al minuto: sesión completa. Pausa y salida, fullscreen nativo con fallback, controles que caben en 320×568 y 844×390, teclado alternativo y preferencia de sonido. Respeta reduced-motion en los efectos decorativos. Récord local validado y tolerancia al almacenamiento bloqueado.

Sonido original de **ensayo sintetizado** mediante Web Audio: beat, bajo, sinte y aire. Cada capa gana presencia según los aciertos. El contexto se abre tras una acción del usuario, se suspende al pausar/ocultar/salir y se cierra al desmontar. Se evita reproducir una cola antigua de audio al recuperar una pestaña. Esta base NO es un lanzamiento del colectivo ni incluye muestras de DJs.

`src/arcade/groove.ts` contiene reglas y geometría; `GrooveNinja.tsx` interfaz y ciclo de vida; `GrooveAudio.ts` síntesis; `groove.css` presentación. SVG y Web Audio, sin dependencias ni servicios nuevos. El juego se carga como módulo separado. Incluido en el precaché público, sin añadir datos privados. Práctica sin registro, sin DANZPOINTS ni clasificación oficial nueva. La competición y la verificación del Snake se conservan.

ARCADANZ añade accesos para elegir juego. Enlace dedicado: `?seccion=arcade&juego=groove-ninja`. Atrás/adelante respeta el juego seleccionado; Snake se pausa, conserva su modo y no recibe las teclas de Groove Ninja. Volver a otra sección retira el parámetro de juego. Los recursos de la portada se conservan.

## Siguiente fase musical — pendiente de pistas reales

Vinilos y muestras salen al ritmo. Cortar dispara sonidos; ida/vuelta produce scratch. Combos construyen una mezcla, esquivando acoples/cables y situaciones cómicas de cabina. Modo **Reconstruye el tema**: los aciertos incorporan o limpian batería/bajo/voz hasta escuchar el lanzamiento original. Los fallos disparan sonidos o música graciosa pendientes de decidir. Sin bromas definitivas ni muestras inventadas.

El propietario puede aportar más adelante los temas por capas en su mayoría; no hacen falta ahora para terminar Snake. Enlazar cada lanzamiento con SoundCloud y ficha del DJ; para control preciso de capas usar audio original/stems autorizados. Un enlace/embed de SoundCloud no equivale a acceso a pistas separadas. No se han conectado ni publicado temas todavía.

## Portada

Se generó una ilustración original con la portada aprobada de Snake como referencia de estilo: 3D cartoon, estudio industrial, luz magenta/amarillo, DJ haciendo scratch, vinilo expresivo cortado por una estela musical y flor blanca. Título exacto añadido en HTML para ser legible y accesible. Asset público `public/arcade/groove-ninja-cover-v1.webp` (1200×800). Se ha generado con la herramienta integrada de imágenes y convertido/reducido a WebP; sin edición fotográfica manual.

La tarjeta de ARCADANZ ahora abre la primera sesión jugable e indica que usa sonido de ensayo. El modo de reconstruir lanzamientos reales sigue pendiente de stems y no se presenta como disponible. Idle Studio y el plataformas continúan en Grok, separados de esta implementación. Perfiles de EQUIPO siguen pendientes del usuario.
