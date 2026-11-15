# Collecta: Último turno — auditoría del rival automático

Estado: implementación local, build y 219 pruebas internas correctos;
pendiente de auditoría conectada y publicación. Base main `e3630aee`.

## Función

- Tercer modo de Collecta: Contra la máquina — Último turno. Se conserva la
  portada aprobada y el lore del encargado frente a la crew.
- Un mando P1, flechas o joystick, siempre derecho en vertical y horizontal.
  Flechas/WASD mueven al humano; F coloca disco. P2 no ofrece controles humanos.
- Primero en ganar tres rondas; 60 segundos por ronda, discos y daños propios
  conservados. Práctica local, sin resultados competitivos ni servicios nuevos.
- El rival usa la misma simulación que el jugador. Proyecta discos, cadenas y
  cover destruido, busca refugios en espacio/tiempo y solo coloca discos útiles
  con una ruta de escape prevista. Rompe flightcases y se acerca al encargado.

## Rendimiento y ciclo de vida

- Planificación acotada a 2,8 segundos en una pista de 99 casillas. Cadencia de
  movimientos, no un cálculo por cada frame. Cerebro y entradas en refs.
- Sin dependencias nuevas, APIs remotas, modelos de pago, temporizadores extra
  o lecturas de entradas ocultas. No se afirma que el rival sea invencible.
- Pausa al girar, ocultar pestaña, perder foco o salir de fullscreen. Limpieza
  al desmontar. Un key distinto separa la partida individual del duelo local.
- El bloque Phaser existente sigue cargándose bajo demanda y mantiene su peso;
  esta entrega no sustituye el motor ni añade recursos raster.

## Verificación

- Build y 219 pruebas internas correctos. Ocho pruebas nuevas comprueban
  inmutabilidad/determinismo, pausa, callejón sin salida, ondas inminentes,
  cadenas, victoria frente a rival inmóvil, ocho semillas con obstáculos y
  cadencias de 16/33/50 ms y variables. Escapes confirmados por el motor real.
- Escenarios de navegador: entrada desde el hub, rival que se mueve y coloca
  discos, pausa/reanudación, vuelta a 1vs1, mando vertical en tres tamaños,
  teclado del humano y modo sin conexión. Pendientes de ejecución conectada.
- Pendientes: auditoría visual en 320×568, 390×844 y 844×390 y producción.
  La limitación previa T04 de CI sigue abierta hasta comprobar esta ejecución.
- Sin mediciones de FPS, batería, comodidad o latencia en teléfonos físicos.

## Pendientes conservados

DC04, sprites humanos; T01, teléfonos reales; T04, automatización; salas online,
música/BPM de Groove, Kart y retorno de Gemini siguen separados. QR aplazados.
