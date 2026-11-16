# DANZPORTER — cámaras y acabado, 16/11/2026

Petición K06/K07: tomar la referencia enviada de Rush Rally Origins como guía
para acercar la vista isométrica y naturalizar materiales; añadir primera persona.
Solo se recibió la captura de referencia de Rally; no se inventa una segunda imagen.

## Implementación publicada — PR 41

- Isométrica diagonal cercana con horizonte estable y minimapa. Suelo con grano,
  manchas de desgaste, vegetación/piedras instanciadas fuera de trazado y boxes;
  iluminación cálida y superficies menos metálicas. Recursos originales, sin
  copiar modelos, logos ni recursos del juego de referencia.
- Primera persona con PerspectiveCamera real, ojo a altura del piloto, plano
  cercano de 2 unidades y FOV adaptado al aspecto. Se oculta solo el kart propio
  para evitar atravesar cabeza/carrocería; volante y salpicadero originales.
- Perspectiva compatible por Canvas 2D cuando no hay WebGL, con recorte del plano
  cercano, asfalto/pianos, barreras, karts y boxes de la misma simulación. Es una
  presentación por software, con simplificaciones visuales; no se etiqueta como GPU.
- Mover joystick a los lados gira respecto al piloto; pedales separados. Las
  otras vistas conservan dirección global. Duelo mantiene pista compartida y
  mandos enfrentados, aunque la preferencia de primera persona queda guardada.
- Cambio de cámara en pausa conserva tiempo, piezas, salud y circuito. Modo
  compatible limitado a 30 actualizaciones visuales por segundo; RAF duerme en
  menús/pausa; shaders y entorno se preparan solo al salir a pista. ResizeObserver y recursos se limpian al salir. Sin cabeceo ni shake.
- Calidad automática cambia a compatible tras tres renders consecutivos de más
  de 95 ms durante carrera/cuenta atrás. No se considera una medición de FPS
  física ni cambia la calidad elegida por el usuario en ajustes.

## Evidencia disponible

Build correcto, 246 pruebas internas correctas: incluyen recorte de polígonos,
200 posiciones/orientaciones de cámara, dirección relativa, guardia de duelo,
preferencia persistida y worker con rechazo de consultas privadas. Escenarios
de navegador escritos para cambiar cámara sin reiniciar la carrera y guardar la
preferencia sin romper duelo; resultado de CI se añadirá al cierre.

Auditoría CPU de geometría: 576 objetos, 102 geometrías, 67.668 triángulos, vistas
isométrica y cabina renderizadas con Blender/Cycles, materiales/luces aproximados.
No equivalen a captura del navegador, prueba de shader/WebGL, FPS ni móvil físico.
Preview READY c75b4be8 revisado con el juego real en 390×844, 320×568 y 844×390:
gas pulsado, joystick relativo con gas de teclado, retorno a cero, minimapa,
pausa, cambio de vista sin perder 8.233 ms ni piezas (club:street), un canvas,
persistencia tras recarga y duelo que fuerza pista compartida. Botones de gas
44 px de alto en 320×568, sin overflow horizontal. El navegador tiene WebGL
desactivado: estas capturas muestran la perspectiva compatible. El 3D se revisa
por CPU; T01 conserva shader/GPU, dispositivo físico, FPS y multitoque real.
Publicación y revisión pública completadas en el cierre siguiente.

## Cierre público y CI

- Código `11868c0400fb10fb05fd8cebe178bd8a65008090`, PR 41. Producción
  READY `dpl_CHucH5XqQwHZfL2XLTvWdrkFRa7h` y alias público comprobados.
- CI 225: 246 internas, 552 escenarios de navegador y 16 offline correctos.
  Los 31 archivos modificados coinciden con la copia local por hash.
- Revisión pública: conducción, minimapa y un canvas en 320×568 y 844×390;
  menú, preferencia y duelo en 390×844. Sin desborde en los tres tamaños. Los
  cuatro botones de pedales/boxes conservan 44 px en el tamaño menor.
- Cambiar de cámara en pausa mantiene 9.541 ms, piezas `sprint:endurance`
  y salud 0,796. El duelo fuerza pista compartida; volver a carrera restaura
  la primera persona guardada. Inicio directo `/test` comprobado.
- PR 40 recupera la regresión completa (546 escenarios de navegador y 16
  offline). Las medidas de layouts se hacen antes de iniciar la ronda para
  no perder contra la crew durante las comprobaciones. T04 queda cerrado.
- El navegador público usa la perspectiva compatible 2D. La vista previa
  privada fue bloqueada por la revisión automática al redirigir a Vercel;
  se verifica la app pública sin cambiar permisos. GPU, teléfonos físicos,
  FPS, batería, audio escuchado y pantalla completa nativa permanecen en T01.

## Cómo comprobarlo

Abrir `/test?seccion=arcade&juego=kart` → AJUSTES → CÁMARA. Elegir PRIMERA PERSONA,
salir a pista, acelerar y girar a los lados. Pausar, cambiar a PISTA COMPLETA y
reanudar: el tiempo y el kart continúan. Elegir DUELO LOCAL: ambos ven la misma
pista y cada mando conserva su punto de vista. En 2D también hay primera persona.
