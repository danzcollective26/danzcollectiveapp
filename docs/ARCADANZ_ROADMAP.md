# DANZ: mejoras y próximos juegos

Actualizado: 16 de noviembre de 2026. Este documento distingue el trabajo actual de las propuestas de futuro. Las diez mejoras están aceptadas como línea de trabajo progresiva; Arena y Persecución están publicados dentro de DANZ Collecta; DANZPORTER (antes Kart Mini) tiene tres modos locales, presentación 3D, garaje mecánico, daños y boxes publicados (PR 34–38), con validación GPU pendiente.

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
primer prototipo de Arena DANZ ya incluye duelo local. La nueva Persecución se integra dentro de DANZ Collecta; Kart tiene beta local publicada en PR 34; los modos online siguen pendientes. La biblioteca, Yeppo y `/test` ya tienen una primera entrega publicada; el
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

J10 beta publicada en PR 34 (`92564a94`): Crew Race, Contrarreloj y duelo
local con dos mandos enfrentados, dos circuitos, tres vueltas, derrape/impulso,
colisiones, pausa y récord local por circuito. Integrado en biblioteca y `/test`.
M06 incorpora materiales en Jack, rig/cabinas Groove y personajes/suelo en
Collecta. Las portadas aprobadas y los marcos compactos se conservan.
P05 recoge el inciso: DANZPOINTS como moneda visible y monedero del colectivo;
el canje real y el historial transaccional siguen pendientes, sin saldos ficticios.
Build y 227 pruebas internas correctos; producción READY y revisión pública
completada para la entrega base. El monedero se revisa anónimo, sin inventar
saldo ni ejecutar canjes.
Detalles: `DANZ_KART_MINI_2026-11-15.md`.

## Kart premium — 16/11

PR 35 publicado (`50eb18d7`, producción READY): Three.js 0.186.0, kart/piloto originales, escenario de muelle, materiales
CC0 locales, cámara cercana o completa, minimapa, audio original, cuatro
carrocerías, podio y ajustes persistentes. Corrección de trazados para impedir
solapamientos, parrilla más espaciada y contacto ajustado al vehículo.

Build y 229 pruebas internas pasan; render CPU de la geometría auditado. El
navegador conectado tiene WebGL desactivado: se comprueba fallback 2D, sin
afirmar validación GPU. T01/T04 conservan Android/iPhone, FPS, batería y
regresión de navegador/offline. Atajos, objetos, fantasma y online posteriores.
Detalles y fuentes: `KART_PREMIUM_2026-11-16.md`.

Cierre: producción `dpl_D78kxanrTCTboqnFrpBT2JgdKpL2`. Carrera, duelo horizontal,
menú pequeño, monedero anónimo y actualización de PWA comprobados públicamente.
El navegador no dispone de WebGL: vista compatible probada y geometría 3D
auditada en CPU; validación GPU y móvil físico pendientes. CI 201 no ejecuta
pasos ni genera logs, por lo que T04 sigue abierto.

## Evolución a DANZPORTER

Nombre y portada con el nuevo protagonista aprobados el 16/11. Se integra la
imagen exacta, con identidad visual propia de conducción nocturna. Pendientes
activos: gas/freno, daños/boxes, tres chasis y seis tipos de ruedas con stats,
color/piloto, ambientes del circuito y horizontal solo donde resulte útil.
No se implementan compras con DANZPOINTS ni online en este bloque.

Portada/nombre publicados en PR 36 (`e0a3a359`), producción READY.
Mecánicas K02–K05 y A06 implementadas en revisión: 240 pruebas internas y
36 configuraciones/circuitos completados por simulación. Pedales, daños y
boxes reales; piezas con estadísticas y récords separados. No modifica Snake
competitivo, puntos, permisos ni las portadas aprobadas.


## DANZPORTER — ampliación de conducción y garaje

Nombre definitivo y portada exacta aprobados/publicados PR 36 (e0a3a359).
PR 37 (dc5fe5e8): gas manual, freno, auto opcional, tres chasis y seis ruedas,
pintura libre y tres pilotos, daño/degradación, boxes y recuperación con grúa.
Tres ambientes, récords por piezas mecánicas y migración de preferencias.
Horizontal con controles mayores en Kart/Collecta y botones laterales de Groove;
Jack conserva tablero cuadrado. Build, 240 pruebas internas y 36 combinaciones
de carreras correctos; revisión manual de tres tamaños y geometría CPU.
PR 38 (49a55708) encaja el garaje desplegado bajo la cabecera. T01/T04 siguen
abiertos para GPU/móvil físico y CI que no arranca pasos. La versión local abre
piezas sin compras: catálogo, canjes y movimientos reales de DANZPOINTS siguen
pendientes en P03/P05; online y contenido extra del Kart conservan su estado.


## Menús clásicos y nuevas vistas — 16/11

A07/A08 publicados en PR 39 (49f571e5): menús de consola con carruseles, teclado,
swipe, foco contenido y apertura inmersiva. Pantalla completa nativa solicitada
con gesto; fallback CSS comprobado en tres tamaños. Portadas exactas preservadas.
PR 40 revisa retorno de Destrucción a Groove y rutas públicas del worker. CI
ahora ejecuta pasos y conserva sus fallos explícitos en T04 hasta resolverlos.

K06/K07 publicados en PR 41 (11868c04): vista Rally isométrica, materiales/suelo y vegetación,
primera persona 3D más compatible por software, volante y giro relativo. Se
conservan carrera, piezas, daño y boxes; duelo con pista completa para ambos.
La cámara no altera récords ni añade un modo online. CI 225: 246 pruebas internas,
552 escenarios de navegador y 16 offline correctos. Primera persona, gas,
cambio de vista sin reinicio, preferencia y duelo revisados en la URL pública.
T04 queda cerrado; T01 conserva GPU, móviles físicos, FPS, batería y audio.
Ver auditoría de cámaras.


## Groove — sentido del corte y secuencias (G05)

Publicado PR 43 el 16/11 (2ac95f3c): arriba/abajo/izquierda/derecha se validan por
el sentido real del gesto. Secuencias de dos/tres discos numerados con +300 al
completarlas; orden y dirección incorrectos permiten reintento, y perder una
secuencia cuesta una vida. Flechas de teclado eligen dirección y 1–4 cortan.
Corregido el trazo lento por acumulación de muestras pequeñas. Se conserva
práctica local, portadas aprobadas, menús, `/test`, Scratch y Destrucción.
CI 230: 253 internas, 564 navegador y 16 offline correctas. Capturas en tres
tamaños y apertura pública revisadas; auditoría en
GROOVE_CORTES_DIRIGIDOS_2026-11-16.md. G02/G03/G08 y las pruebas físicas de
T01 siguen pendientes.


## Groove — música protegida autorizada, 16/11

Código y reproducción de Funky Fiesta/WTHIMH autorizados con acceso protegido,
sin botón de descarga y sin audios en GitHub. Ambos MP3 ya están en Storage
privado y sus URLs públicas se rechazan. Implementados selector, reloj media,
oleadas/Scratch a 127 BPM aproximados, pausa y récord por tema/modo. El servidor
valida sesión y emite enlaces de 120 s; Ensayo sigue sin cuenta y offline.
Publicado PR 46: CI 235 pasa build, 267 internas, 582 navegador y 16 offline.
Backend protegido y apertura pública comprobados; T01 conserva prueba física. Ver
GROOVE_MUSICA_PROTEGIDA_2026-11-16.md.

## Groove — intro de cinco segundos, 16/11

En `feature/arcade-intros`, todavía sin publicar. Una película aprobada se
reproduce una vez por sesión, a pantalla completa, antes del menú de cabina.
Saltar o el final del vídeo entran al juego. Movimiento reducido no la
reproduce. Jack, Collecta y DANZPORTER no tienen intro. El archivo no se
precacha. Registro G09.
