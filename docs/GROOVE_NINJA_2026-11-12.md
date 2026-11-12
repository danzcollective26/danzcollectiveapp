# GROOVE NINJA — decisión del propietario

Nombre definitivo elegido el 12/11/2026: **GROOVE NINJA**, guiño a Fruit Ninja. El propietario prefiere la idea de cortar sonidos y scratch a un clon de Guitar Hero; un modo de pulsaciones al ritmo puede añadirse más adelante.

## Entrega vigente — dos modos independientes de la música por capas

El propietario pidió seguir con el juego y reforzó expresamente un modo como Fruit Ninja: **cortar vinilos y una estética potente**. Después decidió **dejar en pausa construir canciones durante la partida**, hasta disponer de las pistas por capas. Esta última orden prevalece sobre los borradores de reconstrucción musical.

- **VINYL CUT:** sesión de práctica de 60 segundos, cinco vidas y tres tramos de intensidad. Los vinilos describen arcos y se cortan con el segmento completo del gesto al mover el dedo, sin esperar a levantarlo. Se separan en mitades por la dirección del corte, con estela, fragmentos, etiquetas y multiplicador hasta ×4. Los acoples rojos se esquivan; perder un vinilo o cortar un acople consume una vida y rompe la racha. No se interrumpe con retos de scratch.
- **SCRATCH SESSION:** una sesión dedicada a sujetar el disco y cambiar de dirección tres veces sin soltar. Tras el acierto llega otro plato; el margen baja de 3,8 a 3,2 y 2,6 segundos por tramo. Cinco vidas, combos y récord propio. No depende de stems ni intercala vinilos que haya que cortar.

Puntuación y récord local separados por modo. Al perder: **PARTY OVER**. Al llegar al minuto: sesión completa. Pausa y salida, fullscreen nativo con fallback, controles a 320×568 y 844×390, teclado alternativo y preferencia de sonido. Respeta reduced-motion en los efectos decorativos. Récords validados y tolerancia al almacenamiento bloqueado.

**Música de fondo independiente de los aciertos.** La base actual está sintetizada para ensayo; no es un tema del colectivo ni incluye muestras de DJs. Se podrán incorporar sus temas completos cuando los entregue el propietario. El contexto de audio se abre tras una acción del usuario, se suspende al pausar/ocultar/salir y se cierra al desmontar. No hay construcción de capas ni modificación del tema por puntos. El medidor FLOW representa la racha de juego.

`src/arcade/groove.ts` contiene reglas y geometría; `GrooveNinja.tsx` interfaz y ciclo de vida; `GrooveAudio.ts` síntesis; `groove.css` presentación. SVG y Web Audio, sin dependencias ni servicios nuevos. El juego se carga como módulo separado. Incluido en el precaché público. El service worker admite solo las navegaciones públicas exactas de ARCADANZ y su juego; callbacks, tokens, URLs firmadas, parámetros desconocidos/duplicados y tráfico privado conservan el bypass. No se guardan respuestas de red dinámicas.

Práctica sin registro, sin DANZPOINTS ni clasificación oficial nueva. La competición y verificación del Snake se conservan. ARCADANZ añade accesos para elegir juego. Enlace: `?seccion=arcade&juego=groove-ninja`. Atrás/adelante respeta el juego seleccionado; Snake se pausa, conserva su modo y no recibe las teclas de Groove Ninja. Volver a otra sección retira el parámetro de juego.

## En pausa — Reconstruye el tema

La idea de reconstruir lanzamientos por capas queda aparcada hasta que el usuario entregue los stems. No fingirla con temas inventados ni presentarla como disponible. Las bromas, artistas, música y enlaces se concretarán con él. SoundCloud puede enlazar un lanzamiento; un enlace no equivale a tener pistas separadas para manipularlas. No se han conectado ni publicado temas reales.

## Portada

Se generó una ilustración original con la portada aprobada de Snake como referencia de estilo: 3D cartoon, estudio industrial, luz magenta/amarillo, DJ haciendo scratch, vinilo expresivo cortado por una estela musical y flor blanca. Título exacto añadido en HTML para ser legible y accesible. Asset público `public/arcade/groove-ninja-cover-v1.webp` (1200×800). Se ha generado con la herramienta integrada de imágenes y convertido/reducido a WebP; sin edición fotográfica manual.

La tarjeta de ARCADANZ ahora abre la primera sesión jugable e indica que usa sonido de ensayo. El modo de reconstruir lanzamientos reales está en pausa por decisión del propietario. Idle Studio y el plataformas continúan en Grok, separados de esta implementación. Perfiles de EQUIPO siguen pendientes del usuario.
