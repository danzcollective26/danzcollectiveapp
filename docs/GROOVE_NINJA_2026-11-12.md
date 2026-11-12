# GROOVE NINJA — decisión del propietario

Nombre definitivo elegido el 12/11/2026: **GROOVE NINJA**, guiño a Fruit Ninja. El propietario prefiere la idea de cortar sonidos y scratch a un clon de Guitar Hero; un modo de pulsaciones al ritmo puede añadirse más adelante.

## Entrega vigente — dos modos independientes de la música por capas

El propietario pidió seguir con el juego y reforzó expresamente un modo como Fruit Ninja: **cortar vinilos y una estética potente**. Después decidió **dejar en pausa construir canciones durante la partida**, hasta disponer de las pistas por capas. Esta última orden prevalece sobre los borradores de reconstrucción musical.

- **VINYL CUT:** sesión de práctica de 60 segundos, cinco vidas y tres tramos de intensidad. Los vinilos describen arcos y se cortan con el segmento completo del gesto al mover el dedo, sin esperar a levantarlo. Se separan en mitades por la dirección del corte, con estela, fragmentos, etiquetas y multiplicador hasta ×4. Los acoples rojos se esquivan; perder un vinilo o cortar un acople consume una vida y rompe la racha. No se interrumpe con retos de scratch.
- **SCRATCH SESSION:** frases de tres o cuatro gestos con dirección, recorrido corto/largo y un pulso concreto a 120 BPM. Baby Scratch, Long Pull, Double Time y Boomerang; primero entran dos patrones y después los cuatro. La ventana por gesto baja de ±230 a ±190 y ±160 ms; PERFECTO exige ±95 ms. Los puntos se conceden al completar la frase; el movimiento aleatorio, levantar el dedo o hacer un recorrido insuficiente no la completa. Un pulso perdido cuesta una vida; levantar el dedo solo permite recolocarlo. Cinco vidas, combos y récord propio. No depende de stems ni intercala vinilos que haya que cortar.

Puntuación y récord local separados por modo. Al perder: **PARTY OVER**. Al llegar al minuto: sesión completa. Pausa y salida, fullscreen nativo con fallback, controles a 320×568 y 844×390, teclado alternativo y preferencia de sonido. Respeta reduced-motion en los efectos decorativos. Récords validados y tolerancia al almacenamiento bloqueado.

**Música de fondo independiente de los aciertos.** La base actual está sintetizada para ensayo; no es un tema del colectivo ni incluye muestras de DJs. Se podrán incorporar sus temas completos cuando los entregue el propietario. El contexto de audio se abre tras una acción del usuario, se suspende al pausar/ocultar/salir y se cierra al desmontar. No hay construcción de capas ni modificación del tema por puntos. El medidor FLOW representa la racha de juego.

`src/arcade/groove.ts` contiene reglas y geometría; `GrooveNinja.tsx` interfaz y ciclo de vida; `GrooveAudio.ts` síntesis; `groove.css` presentación. SVG y Web Audio, sin dependencias ni servicios nuevos. El juego se carga como módulo separado. Incluido en el precaché público. El service worker admite solo las navegaciones públicas exactas de ARCADANZ y su juego; callbacks, tokens, URLs firmadas, parámetros desconocidos/duplicados y tráfico privado conservan el bypass. No se guardan respuestas de red dinámicas.

Práctica sin registro, sin DANZPOINTS ni clasificación oficial nueva. La competición y verificación del Snake se conservan. ARCADANZ añade accesos para elegir juego. Enlace: `?seccion=arcade&juego=groove-ninja`. Atrás/adelante respeta el juego seleccionado; Snake se pausa, conserva su modo y no recibe las teclas de Groove Ninja. Volver a otra sección retira el parámetro de juego.

## Acabado visual — referencia Fruit Ninja aportada por el propietario

El propietario aportó un ejemplo HTML/Canvas y pidió acercar los gráficos a Fruit Ninja. Se adapta esa dirección al juego existente: cabina de madera con vetas, herrajes dorados y platos; vinilos con relieve, surcos y reflejos; marcador con un disco de etiqueta dorada que gira durante la partida y se detiene al pausar.

El corte conserva la dirección del gesto y la rotación y velocidad del vinilo. Sus dos mitades continúan el movimiento, se separan, giran y caen; la estela blanca/cian, las chispas y las notas musicales refuerzan el impacto. Los acoples se representan como altavoces sobrecargados. Ese fue el alcance visual de web 50. La entrega siguiente añade las mecánicas descritas a continuación.

Se mantiene SVG dentro de React, con física en tiempo transcurrido y Pointer Events para ratón, lápiz y táctil. No se copia el bucle Canvas incompleto ni sus errores de `touches`; se conservan los cortes por segmento completo, la pausa, el cierre de audio y los dos modos. Los efectos decorativos y el giro del marcador se desactivan con reduced-motion. Sin dependencias, fuentes remotas o pagos nuevos.

Esta entrega aplica la nueva dirección visual a GROOVE NINJA. El plataformas que el propietario está creando en Grok conserva la instrucción de no rediseñarlo.

## Ampliación jugable — petición posterior del propietario

El propietario pidió que scratch tenga lógica y desafío, y más variedad en el modo de cortes. La cabina muestra el patrón completo, el gesto actual, su recorrido, una línea de tiempo con ventanas doradas y un aro de pulso. El disco sigue la mano. Hay respuesta PERFECTO/A TIEMPO/AL OTRO LADO/ESPERA EL PULSO y resumen de frases y gestos perfectos. Se conserva la música de ensayo completa; los gestos no construyen canciones ni requieren stems. La animación recupera el tiempo de los fotogramas activos para mantener el pulso visual con el audio; los sonidos de arrastre se limitan para no saturar los eventos táctiles.

VINYL CUT permite cambiar de arma en la partida: **Katana**, 100 puntos y alcance equilibrado; **Doble Filo**, 80 puntos, más alcance y mayor riesgo de tocar acoples; **Aguja**, 125 puntos y contacto más preciso. Cada arma tiene su estela y silueta. Q/W/E cambian; 1–4 cortan horizontal, Mayús+1–4 vertical. Los botones funcionan también durante la sesión en móvil.

Las oleadas alternan solos, parejas, abanicos y lanzamientos de distinta altura. **Dorado**: triple puntuación; tres dorados dan un bonus único de 750. **Hielo**: ralentiza solo el vuelo tres segundos, sin cambiar el minuto ni la música. **Flecha**: exige el eje marcado (horizontal o vertical), conserva el disco si se intenta el incorrecto y da el doble de puntos. **Multicorte**: +100 por cada disco adicional en un mismo gesto, incluso entre muestras táctiles; cuenta una sola pasada en las estadísticas. Se conservan los altavoces peligrosos. Los tres tramos añaden luces ámbar, azul y magenta.

Las nuevas reglas de scratch sustituyen las tres reversas sin ritmo de web 49/50. Los récords siguen siendo locales y separados por modo. No se ha añadido competición, DANZPOINTS, pagos, dependencias ni modificaciones a otros juegos.

## En pausa — Reconstruye el tema

La idea de reconstruir lanzamientos por capas queda aparcada hasta que el usuario entregue los stems. No fingirla con temas inventados ni presentarla como disponible. Las bromas, artistas, música y enlaces se concretarán con él. SoundCloud puede enlazar un lanzamiento; un enlace no equivale a tener pistas separadas para manipularlas. No se han conectado ni publicado temas reales.

## Portada

Se generó una ilustración original con la portada aprobada de Snake como referencia de estilo: 3D cartoon, estudio industrial, luz magenta/amarillo, DJ haciendo scratch, vinilo expresivo cortado por una estela musical y flor blanca. Título exacto añadido en HTML para ser legible y accesible. Asset público `public/arcade/groove-ninja-cover-v1.webp` (1200×800). Se ha generado con la herramienta integrada de imágenes y convertido/reducido a WebP; sin edición fotográfica manual.

La tarjeta de ARCADANZ ahora abre la primera sesión jugable e indica que usa sonido de ensayo. El modo de reconstruir lanzamientos reales está en pausa por decisión del propietario. Idle Studio y el plataformas continúan en Grok, separados de esta implementación. Perfiles de EQUIPO siguen pendientes del usuario.
