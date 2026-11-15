# Collecta: Último turno — auditoría del rival automático

Estado: publicado, PR 32. Build y 219 pruebas internas correctos, auditoría
manual conectada y partida pública comprobadas; limitación de CI abajo.
Código: `df97f67643faeea6a04bb467a9d94f36bfb2a70f`.
Producción READY: `dpl_4h9beU62i7z1gogKrgffd2KxiSRt`. Base previa: `e3630aee`.

## Función

- Tercer modo de Collecta: Contra la máquina — Último turno. Se conserva la
  portada aprobada y el lore del encargado frente a la crew.
- Un mando P1, flechas o joystick, siempre derecho en vertical y horizontal.
  Flechas/WASD mueven al humano; F coloca disco. P2 no ofrece controles humanos.
- Primero en ganar tres rondas; 60 segundos por ronda, discos y daños propios
  conservados. Práctica local, sin resultados competitivos ni servicios nuevos.
- El rival usa la misma simulación que el jugador. Proyecta discos, cadenas y
  obstáculos destruidos, busca refugios en espacio/tiempo y solo coloca discos útiles
  con una ruta de escape prevista. Rompe flightcases y se acerca al encargado.

## Rendimiento y ciclo de vida

- Planificación acotada a 2,8 segundos en una pista de 99 casillas. Cadencia de
  movimientos, no un cálculo por cada frame. Cerebro y entradas en refs.
- Sin dependencias nuevas, APIs remotas, modelos de pago, temporizadores extra
  o lecturas de entradas ocultas. No se afirma que el rival sea invencible.
- Pausa al girar, ocultar pestaña, perder foco o salir de fullscreen. Limpieza
  al desmontar. Una key distinta separa la partida individual del duelo local.
- El bloque Phaser existente sigue cargándose bajo demanda y mantiene su peso;
  esta entrega no sustituye el motor ni añade recursos raster.

## Verificación

- Build y 219 pruebas internas correctos. Ocho pruebas nuevas comprueban
  inmutabilidad/determinismo, pausa, callejón sin salida, ondas inminentes,
  cadenas, victoria frente a rival inmóvil, ocho semillas con obstáculos y
  cadencias de 16/33/50 ms y variables. Escapes confirmados por el motor real.
- Escenarios de navegador: entrada desde el hub, rival que se mueve y coloca
  discos, pausa/reanudación, vuelta a 1vs1, mando vertical en tres tamaños,
  teclado del humano y modo sin conexión. Escritos; la ejecución automatizada sigue bloqueada. Hay revisión manual
  conectada de entrada, rival autónomo, ronda ganada por la crew, siguiente
  ronda, joystick, teclado, disco, pausa y retorno al duelo con P2 disponible.
- Revisados 320×568 y 390×844: joystick de 96×96, movimiento real P1,
  rival activo, disco y pausa. En horizontal se detectó pista demasiado pequeña: corregida
  con mando lateral en orientación normal para dar más altura a la pista.
  Comprobado 844×390: pista 381×312, mando sin girar, P1 1→5 con
  joystick y 5→3 con teclado; crew activa y pausa correcta. Producción: entrada desde Collecta,
  P1 1→4 con joystick, crew 9,7→3,7 autónoma, pausa y reinicio de modo correctos.
  CI 189 (`43751292360`) termina antes de ejecutar pasos, sin logs de los
  cuatro jobs; T04 sigue abierto. Los escenarios automatizados nuevos y el
  offline aún no se dan por ejecutados.
- Perfil local de 20 rondas simuladas con entradas humanas: 200 decisiones,
  media 0,30 ms y percentil 95 de 1,17 ms en Node. Son medidas del host, no de
  móvil ni de FPS. Sin mediciones de batería, comodidad o latencia física.

## Pendientes conservados

DC04, sprites humanos; T01, teléfonos reales; T04, automatización; salas online,
música/BPM de Groove, Kart y retorno de Gemini siguen separados. QR aplazados.
