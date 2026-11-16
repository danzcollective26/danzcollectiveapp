# DANZPORTER — cámaras y acabado, 16/11/2026

Petición K06/K07: tomar la referencia enviada de Rush Rally Origins como guía
para acercar la vista isométrica y naturalizar materiales; añadir primera persona.
Solo se recibió la captura de referencia de Rally; no se inventa una segunda imagen.

## Implementación en revisión

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
Publicación y revisión pública pendientes antes del cierre.

## Cómo comprobarlo

Abrir `/test?seccion=arcade&juego=kart` → AJUSTES → CÁMARA. Elegir PRIMERA PERSONA,
salir a pista, acelerar y girar a los lados. Pausar, cambiar a PISTA COMPLETA y
reanudar: el tiempo y el kart continúan. Elegir DUELO LOCAL: ambos ven la misma
pista y cada mando conserva su punto de vista. En 2D también hay primera persona.
