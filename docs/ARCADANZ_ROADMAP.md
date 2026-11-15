# DANZ: mejoras y próximos juegos

Actualizado: 15 de noviembre de 2026. Este documento distingue el trabajo actual de las propuestas de futuro. Las diez mejoras están aceptadas como línea de trabajo progresiva; los juegos nuevos todavía no están implementados.

## Bloque actual

- Integrar las dos portadas exactas aprobadas: Jack con camiseta roja persiguiendo al cable vivo; Groove Ninja con su propio protagonista, gafas negras y katana con flor. Sin generar nuevas portadas.
- Biblioteca ARCADANZ con imágenes completas y apertura de cada juego en una vista inmersiva.
- Yeppo: conservar su flor y sus tres paseos; calcular el acercamiento desde una tarjeta real, alinear la mano y sincronizar la reacción. Cancelar el recorrido al desplazarse o cambiar el tamaño de la pantalla.
- Conservar Vinyl Cut y Scratch Session como modos de Groove Ninja.

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

## Tres juegos aprobados: jugar contra otra persona

El usuario quiere juegos 1 contra 1 en un mismo móvil y también conectándose online. Prioriza un juego original inspirado en la mecánica de Bomberman, Yeppo Pilla-Pilla y DANZ Kart Mini. Quiere una estética propia con acabado premium: personajes reconocibles, escenarios cuidados, animaciones fluidas, efectos claros y menús consistentes.

| Propuesta | Dirección visual y controles locales | Futuro modo online |
| --- | --- | --- |
| Arena DANZ, nombre provisional | Vista superior con profundidad; arenas de club, obstáculos destructibles, flor y explosiones de sonido/pétalos. Controles en extremos opuestos del móvil horizontal. Arte, personajes y niveles originales. | Sala por código, una persona en cada móvil y partidas sincronizadas. |
| Yeppo Pilla-Pilla | Arenas legibles, Yeppo animado, amagos, persecución y cambio de roles. Dos zonas de control para compartir pantalla. | Duelo de persecución, con sincronización de posiciones y capturas. |
| DANZ Kart Mini | Circuitos desde arriba o isométricos, karts personalizados, derrape y efectos de velocidad. Evaluar aceleración automática para que dos personas puedan manejarse cómodamente en un móvil. | Cada jugador con su propio móvil y controles completos. |

Pong encaja muy bien en pantalla compartida. Pinball, Dominó y Memoria permiten competir por turnos. Flor Blocks y Break the Beat admiten variantes de duelo, que necesitarían diseño adicional.

Los modos online requieren además de los gráficos: salas, conexión y reconexión, sincronización de estado y validación de resultados. No se presentan como disponibles hasta implementarlos y probarlos.

El usuario ha confirmado los tres: arena original inspirada en Bomberman, Yeppo
Pilla-Pilla y DANZ Kart Mini. La aprobación corresponde a su desarrollo; los
juegos nuevos y su modo online todavía no están implementados. El orden de
trabajo es cerrar la biblioteca/Yeppo y QR Studio, después preparar la dirección
visual y el primer prototipo de duelo, empezando por la arena si no hay otra
preferencia. Las portadas existentes aprobadas no se vuelven a generar.

## Hugging Face y QR Studio

El 15/11/2026 el usuario autorizó buscar e integrar herramientas útiles de Hugging
Face y pidió dejar la preferencia gratuita como regla permanente. Se ha añadido
`AGENTS.md` y un QR Studio administrativo: QR local, integración de Gradio en el
servidor, secretos fuera del navegador y comprobación del contenido escaneado.
Guía: `docs/QR_ARTISTICOS_HUGGING_FACE.md`. El estado de publicación y las pruebas
del bloque se registran al terminar su validación; la existencia del código no
equivale a que esté publicado.
