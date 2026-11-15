# DANZ: mejoras y próximos juegos

Actualizado: 15 de noviembre de 2026. Este documento distingue el trabajo actual de las propuestas de futuro. Las diez mejoras están aceptadas como línea de trabajo progresiva; Arena y Persecución están publicados dentro de DANZ Collecta; DANZ Kart Mini sigue pendiente.

Registro general de tareas, decisiones, dependencias y evidencia vigente:
[Revisión y pendientes de DANZ](REVISION_Y_PENDIENTES_DANZ_2026-11-15.md).
Consultar ese registro para el estado de entregas posteriores y los pendientes
de música, galería, cuenta, puntos y administración.

## Base conservada y ampliación actual

- Jack y Groove conservan sus portadas exactas. DANZ Collecta incorpora la portada aprobada «Día de cobro», con su protagonista de seguridad, en el bloque de PR 30.
- Biblioteca ARCADANZ con imágenes completas y apertura de cada juego en una vista inmersiva.
- Yeppo conserva su flor y sus tres paseos; se acerca a una tarjeta real, alinea la mano y sincroniza la reacción. El recorrido se cancela al desplazarse o cambiar el tamaño de la pantalla.
- Vinyl Cut y Scratch Session se conservan como modos de Groove Ninja.

## Las diez mejoras aceptadas

| Mejora | Trabajo previsto |
| --- | --- |
| 1. Acceso más sencillo | Revisar Google/correo y recuperación de cuenta. |
| 2. Fotos más rápidas | Mejorar carga, navegación y descarga. |
| 3. Buscador | Encontrar contenido con menos pasos. |
| 4. QR y pasaporte más fiables | Conservar y recuperar pases y sellos. |
| 5. DANZPOINTS más claros | Explicar saldo, progreso y canjes. |
| 6. Arcade más espectacular | Mejorar gráficos, animaciones y presentación. Este bloque avanza la biblioteca y las portadas. |
| 7. Armas diferenciadas | Dar personalidad y comportamiento a las armas. |
| 8. Yeppo más vivo | Ampliar movimientos e interacciones. Este bloque avanza el contacto con tarjetas. |
| 9. Administración más ágil | Mejorar gestión de contenido, incidencias y sugerencias. |
| 10. PWA más sólida | Revisar instalación, estabilidad y experiencia móvil. |

Son mejoras sobre funciones existentes; esta lista no afirma que todas estén terminadas.

## Diez ideas de juegos recuperadas

| Juego | En qué consiste |
| --- | --- |
| DANZ Pinball | Rebotes, rampas y combos en una mesa con vinilos, flor y motivos del colectivo. |
| Break the Beat | Romper bloques con una bola y una pala, con estética de cabina y música. |
| Yeppo Invaders | Defender la pista de oleadas de enemigos al estilo arcade espacial. |
| Flor Blocks | Encajar piezas que caen, con colores y motivos DANZ. |
| Pong Collective | Devolver una pelota con una pala y jugar duelos rápidos. |
| Backstage Maze | Recorrer laberintos, recoger objetos y encontrar la salida del backstage. |
| DANZ Dominó | Dominó con fichas personalizadas del colectivo. |
| Memoria de la Crew | Encontrar parejas de caras, logos y objetos de DANZ. |
| Yeppo Pilla-Pilla | Perseguir o escapar entre obstáculos, con rondas cortas y cambio de papeles. |
| DANZ Kart Mini | Carreras cortas con karts propios, derrapes, atajos y objetos. |

DANZ Idle Studio sigue siendo otro concepto previo, independiente de esta lista.

## Prioridades de duelos y estructura vigente

El usuario quiere juegos 1 contra 1 en un mismo móvil y también conectándose online. Prioriza un juego original inspirado en la mecánica de Bomberman, Yeppo Pilla-Pilla y DANZ Kart Mini. Quiere una estética propia con acabado premium: personajes reconocibles, escenarios cuidados, animaciones fluidas, efectos claros y menús consistentes.

| Propuesta | Dirección visual y controles locales | Futuro modo online |
| --- | --- | --- |
| Arena DANZ, nombre provisional | Vista superior con profundidad; arenas de club, obstáculos destructibles, flor y explosiones de sonido/pétalos. Controles en extremos opuestos del móvil horizontal. Arte, personajes y niveles originales. | Sala por código, una persona en cada móvil y partidas sincronizadas. |
| Yeppo Pilla-Pilla | Arenas legibles, Yeppo animado, amagos, persecución y cambio de roles. Dos zonas de control para compartir pantalla. | Duelo de persecución, con sincronización de posiciones y capturas. |
| DANZ Kart Mini | Circuitos desde arriba o isométricos, karts personalizados, derrape y efectos de velocidad. Evaluar aceleración automática para que dos personas puedan manejarse cómodamente en un móvil. | Cada jugador con su propio móvil y controles completos. |

Pong encaja muy bien en pantalla compartida. Pinball, Dominó y Memoria permiten competir por turnos. Flor Blocks y Break the Beat admiten variantes de duelo, que necesitarían diseño adicional.

Los modos online requieren además de los gráficos: salas, conexión y reconexión, sincronización de estado y validación de resultados. No se presentan como disponibles hasta implementarlos y probarlos.

El usuario ha confirmado los tres: arena original inspirada en Bomberman, Yeppo
Pilla-Pilla y DANZ Kart Mini. La aprobación corresponde a su desarrollo; el
primer prototipo de Arena DANZ ya incluye duelo local. La nueva Persecución se integra dentro de DANZ Collecta; Kart y los modos online siguen pendientes. La biblioteca, Yeppo y `/test` ya tienen una primera entrega publicada; el
bloque actual reúne Arena y Persecución en DANZ Collecta. Las portadas existentes aprobadas no se vuelven a generar.

## Hugging Face y tareas aplazadas

Se mantiene la preferencia por herramientas gratuitas útiles y las reglas de
consulta de documentación y complementos recogidas en `AGENTS.md`.

El usuario ha aclarado que no quiere trabajar ahora en nuevos QR. La integración
artística de Hugging Face se reserva para cuando la necesite. El trabajo previo
queda conservado en Git en la rama `future/qr-art-hugging-face`; no se incluye ni
se activa en esta entrega. El bloque actual sigue siendo Arcade, Yeppo y `/test`.

## Arena DANZ — primer prototipo local

- Duelo para dos personas en el mismo móvil, con dos mandos independientes y teclado.
- Pista simétrica de club, cajas destructibles, altavoces que frenan las ondas,
  discos con mecha de 1,9 segundos, explosiones en cadena y mejoras de alcance/capacidad.
- Rondas de hasta 60 segundos; gana el primero en conseguir tres victorias.
- Ilustración vectorial propia, personajes flor y renderer Phaser 4.2.1 cargado
  bajo demanda. No se sustituyen los motores ni las portadas de Jack y Groove.
- Beta local: sin salas online ni recompensas competitivas. El rival automático
  se incorpora después en Último turno (PR 32).
- Accesible desde la biblioteca y `/test`. Auditoría y límites en
  `docs/AUDITORIA_ARENA_DANZ_2026-11-15.md`.


## DANZ Collecta — decisión e integración posterior del 15/11/2026 (vigente)

El propietario reúne Arena y Pilla-Pilla bajo **DANZ Collecta**, una sola portada
con selección de modos. La portada «Día de cobro», con el protagonista de
seguridad y la factura pagada, ha sido aprobada para implementación. El tono
mezcla orden en las fiestas y humor con cuentas/facturas; los protagonistas de
las otras portadas mantienen su identidad. Jack y Groove no se rediseñan.

- Arena conserva el motor de discos, cajas, cadenas y rondas. Persecución añade
  un minuto de persecución con captura, cambio de papeles, obstáculos y sprint.
- En ambos, mandos enfrentados: izquierda/derecha girados en horizontal y
  arriba/abajo en vertical. Las direcciones se interpretan desde cada jugador;
  girar el móvil pausa y libera las entradas.
- Biblioteca y `/test` abren Collecta. Los enlaces directos `juego=arena` y
  `juego=pilla-pilla` se conservan. `juego=collecta` abre sus modos.
- **Contra la máquina — Último turno** está publicado en PR 32. Rival local
  real con búsqueda de rutas, previsión de cadenas y el mismo motor de Arena.
- El lore de los modos está publicado en PR 31. La integración gráfica del
  protagonista humano sigue pendiente; las flores actuales son personajes beta.
- Groove recibe cabina detallada, efectos suaves y Trazo Club, cosmético local
  desbloqueable con 20 cortes. BPM/música reales y ranking siguen pendientes.

Estado de este bloque: publicado y verificado, PR 30. CI 181: build, 205
pruebas internas, 486 de navegador y 14 offline correctas sin reintentos.
Auditoría conectada y comprobación pública completadas en
`AUDITORIA_COLLECTA_Y_GROOVE_2026-11-15.md`. Rival IA y acabado de personajes
siguen pendientes; no se presentan como terminados.


## Nuevo bloque: turnos de Collecta y joystick

- **Arena — Cierre de pista**: el encargado frente a la crew, flightcases con
  etiquetas de cuentas y discos de aviso. Victoria en tres rondas, como antes.
- **Persecución — Pasa el marrón**: quien persigue lleva la factura; al pillar
  se la entrega al rival, aparece «Trámite cerrado» y cambian los papeles. Gana
  quien más capturas haga en 60 segundos; llevar la factura al final no decide
  por sí solo el resultado.
- Portada exacta conservada. Introducción, diálogos de pausa/resultado, objetos,
  roles y señalética siguen el mismo tono del encargado y el cierre de fiesta.
- Cada jugador elige flechas o joystick en el hub. Joystick analógico para
  Persecución y cardinal para Arena, enfrentados y sin movimiento al soltar.
- Publicado en PR 31 (`3fea5cb0`), producción READY y revisión pública correctas.
  Build y 211 pruebas internas correctos; revisión manual de tres tamaños.
  CI no arranca: multitoque/rotación/offline automatizados pendientes (T04).
  No incluye la IA rival, online ni un rediseño de los personajes humanos.


## Continuación: Contra la máquina — Último turno

Publicado en PR 32 (DC03), `df97f676`. Rival automático que busca
caminos, rompe flightcases y prevé cadenas para escapar antes de colocar disco.
Un mando P1 derecho, flechas/joystick y teclado, sin cambiar las reglas del duelo.
Build y 219 pruebas internas correctos. Auditoría:
`AUDITORIA_COLLECTA_SOLO_2026-11-15.md`. Producción READY y partida pública
comprobadas. Joystick, teclado, rival, pausa y retorno revisados en tres tamaños.
La batería automatizada de navegador/offline sigue pendiente por el fallo de
arranque de CI (T04); esto no equivale a una prueba de teléfono físico.

## Marcos exteriores compactos (A05)

Publicado en PR 33, `e981c8dc`. El borde sigue el tamaño real del tablero en
Collecta y Groove; Jack usa el espacio disponible y Destrucción reduce márgenes,
sombras y rellenos. Borde de 1 px y margen inmersivo de 4 px respetando áreas
seguras, sin cambiar coordenadas ni controles. Build correcto y revisión visual
en tres tamaños; auditoría `AUDITORIA_MARCOS_ARCADE_2026-11-15.md`.
CI 193 no ejecuta pasos (T04). Teléfonos físicos y FPS siguen pendientes en T01.

## Gráficos y Kart — bloque solicitado después de los marcos

J10 implementado en beta y en verificación: Crew Race, Contrarreloj y duelo
local con dos mandos enfrentados, dos circuitos, tres vueltas, derrape/impulso,
colisiones, pausa y récord local por circuito. Integrado en biblioteca y `/test`.
M06 incorpora materiales en Jack, rig/cabinas Groove y personajes/suelo en
Collecta. Las portadas aprobadas y los marcos compactos se conservan.
P05 recoge el inciso: DANZPOINTS como moneda visible y monedero del colectivo;
el canje real y el historial transaccional siguen pendientes, sin saldos ficticios.
Build y 227 pruebas internas correctos; revisión visual y publicación en curso.
Detalles: `DANZ_KART_MINI_2026-11-15.md`.
