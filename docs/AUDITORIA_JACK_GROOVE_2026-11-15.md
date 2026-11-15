# Jack y Groove Ninja — mejoras del 15 de noviembre de 2026

Arena DANZ tiene una beta local publicada (PR 27, commit `14cc38d`). Este bloque
continúa los dos juegos existentes y corrige el Instagram oficial comunicado por
el usuario: **@danz.collective**.

## Aplicado

| Juego / área | Mejora |
| --- | --- |
| Jack: tablero | Índices Map/Set para segmentos, caras y paredes, en lugar de buscar en todas las listas para cada una de las 361 casillas. Casillas memorizadas con propiedades simples: las que no cambian conservan su representación. |
| Jack: lectura | Indicador de cinco objetivos hacia el siguiente nivel, puntuación con reacción breve, paredes más distinguibles y borde que señala la dirección de la flor. |
| Jack: control | Pausa y liberación del gesto al desenfocar u ocultar la pestaña; limpieza al perder captura; teclado WASD también en mayúsculas. Pausa identificada como EN PAUSA. |
| Groove: Combo Disc | Prepara una pasada de puntuación doble durante cuatro segundos de tiempo activo. Un gesto sin aciertos no consume el bonus. Los segmentos de la misma pasada comparten el bonus; no se reaplica a otra pasada. |
| Groove: Split Disc | El disco crea dos objetivos pequeños con trayectorias propias y puntuación adicional. Sus colisiones respetan el tamaño. Los minivinilos son bonus: dejarlos caer no resta vidas. |
| Groove: feedback | Especiales identificables por símbolos y colores, contador de bonus en el marcador, mitades a la escala del disco y multicortes con texto mayor y sacudida breve de dos píxeles. |
| Groove: móvil | Vinilos memorizados para no reconstruir sus surcos al cambiar solo su posición. En pantallas táctiles se eliminan desenfoques superpuestos; se conserva el sombreado SVG. Se respeta reducir movimiento. |
| Instagram | El enlace de vinculación y el texto de destinatario apuntan a `https://www.instagram.com/danz.collective/`. Revisadas las demás referencias: los perfiles individuales de artistas se conservan. |
| Prueba móvil | `/test` explica las novedades y abre los juegos reales. |

Las reglas del Snake competitivo y su repetición en servidor no se modifican.
Groove conserva sus tres armas, cinco vidas, sesiones de 60 segundos y récord
local por modo. Las portadas aprobadas no se cambian.

## Validación

- Compilación de producción correcta y **191 pruebas internas superadas**.
- Cinco pruebas nuevas cubren consumo y caducidad del Combo Disc, pausa,
  bonus de multicorte, trayectorias, tamaño, puntuación y caídas de los minivinilos.
- Prueba de navegador añadida para cortar Split Disc, puntuar sus hijos y
  alcanzar Combo Disc mediante controles reales. Las pruebas existentes cubren
  gestos nativos, tamaños, armas, Scratch, galería de caras y los doce laberintos.
- Se amplían las comprobaciones de pausa de Jack y del enlace de Instagram.
- El resultado de navegador y modo offline del commit final se registra en la PR.
- Revisión visual con el navegador conectado; tamaños y juego se vuelven a
  comprobar en CI. No se presentan como una medición de FPS en un móvil físico.

## Herramientas y pendientes

Context7: documentación oficial actual de React sobre memoización y limpieza.
GitHub y Vercel: código, pruebas y despliegue. Hugging Face: búsqueda de recursos
gratuitos, sin un Space de sprites adecuado. Runway: conexión autenticada y
catálogo accesible, sin kit de marca DANZ guardado; no se generan recursos ni se
consumen créditos. Ningún recurso privado del colectivo se envía a generadores.

Pendiente: medir FPS, batería y comodidad en Android/iPhone físicos; afinar
efectos tras esa prueba. El seguimiento de BPM de música real y los estilos
cosméticos desbloqueables siguen siendo mejoras posteriores. No se afirma que
los complementos no utilizados hayan pasado una prueba funcional completa.
