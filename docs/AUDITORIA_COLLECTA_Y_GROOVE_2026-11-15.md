# Auditoría DANZ Collecta y Groove — 15/11/2026

Estado: publicado en producción y verificado en navegador conectado.

## Alcance

- Portada exacta «DANZ Collecta — Día de cobro» aprobada por el propietario,
  optimizada a WebP 600×800, 200.798 bytes (el PNG original ocupa 3.871.854).
  Se conserva el encuadre 3:4 completo en biblioteca, modos y `/test`.
- Una entrada Collecta, dos modos: Arena y Persecución. Salida a modos y de allí
  a biblioteca, conservando enlaces directos antiguos.
- Mandos en extremos opuestos, rotación conjunta y direcciones relativas por
  persona. Pausa y liberación de entradas al cambiar de orientación.
- Persecución: 60 s, capturas que intercambian papeles, protección breve contra
  devolución instantánea, obstáculos y sprint con recarga.
- Groove: cabina con equipamiento estático memoizado, efectos suaves y cosmético
  Trazo Club después de 20 cortes, guardado local y sin cambio de colisiones,
  puntuación, tres armas, cinco vidas o minuto de sesión.

## Verificación realizada

- Context7 consultado para Phaser 4.2.1 y React: ciclo de escena, pausa/escala,
  referencias de entrada, limpieza y elementos visuales estáticos.
- Herramientas conectadas: GitHub confirmó main `629f30e9`; Vercel confirmó la
  base publicada. Hugging Face no ofreció una mejora gratuita pertinente para
  el renderer y no se enviaron fotos privadas a Spaces.
- 205 pruebas internas correctas: incluyen colisiones, obstáculos, sprint,
  capturas, cambios de papel, pausas, tiempo, simetría, direcciones relativas y
  preferencias corruptas/desbloqueos de Groove.
- Motores Phaser cargados bajo demanda y compartidos; no duplicar el motor de
  Arena. React recibe HUD de los duelos aproximadamente a 10 Hz; la simulación
  y las entradas permanecen en referencias. Listeners, observadores y canvas
  se destruyen al salir. En pausa se duerme el bucle de Phaser.

## Comprobaciones previstas (completadas al cierre)

- Build final, CI de navegador en escritorio/tableta/móvil y shell offline.
- Auditoría visual conectada: portada, hub, mandos, dos dedos/sprint, ajustes,
  corte y salida. Comprobar 320×568, 390×844 y 844×390.
- Confirmar commit, despliegue READY y prueba de producción.

## Límites y próximos pasos

- La emulación y la inspección conectada no son una prueba en móvil físico;
  batería, FPS y comodidad simultánea en Android/iPhone siguen por medir.
- Arena contra la máquina está solicitado y pendiente. Online y recompensas
  competitivas no forman parte de esta beta. No se modifican QR.
- Los personajes dentro de las partidas siguen siendo flores beta; la portada
  ya define el protagonista. Lore/animaciones dentro del juego siguen pendientes.
- Groove conserva música sintetizada de ensayo; el seguimiento de BPM real y
  las pistas asignadas aún no están conectados. Sus resultados son locales.


## Primer cierre de navegador y correcciones

- CI 179: 205 pruebas internas y las 14 offline correctas. En móvil, 161 de
  162 escenarios correctos: la ventana de ajustes de Groove quedaba debajo del
  botón de salida e impedía cerrar con el dedo. Se elevó la ventana por encima
  de esa barra y se añadió comprobación de hit target en los tamaños compactos.
- Tableta: otra espera virtual de un test de Snake avanzaba antes de estar
  activa la partida autenticada. Se espera ahora la clase de partida activa y
  el botón de pausa antes de avanzar el reloj; se conservan los cuatro pasos y
  el replay exacto RRRR. No se cambia el motor ni se rebaja la expectativa.
- La inspección conectada confirma portada completa, biblioteca y modos,
  orientación ±90° de los mandos, botones de al menos 44 px, movimiento y pausa
  de Persecución. Groove abre los ajustes en pausa, cambia a efectos suaves y
  Escape devuelve el foco a AJUSTES sin salir del juego.
- Se adjuntan capturas de Arena y Persecución a los escenarios de tres tamaños
  para inspección visual de sus resultados de CI, además de sus aserciones.


## CI 180 y capturas de tres tamaños

- Código `f4df5c82`: build, 205 internas y 14 offline correctas. Escritorio:
  162/162; tableta y móvil: 161 a la primera y el desbloqueo de 20 cortes pasó
  al reintentar después de agotar el límite general de 30 s del test largo.
  No se interpreta esto como FPS ni medición de latencia física.
- Las capturas de 320×568, 390×844 y 844×390 confirman mandos enfrentados,
  textos y acciones accesibles. En horizontal se detectó el reloj demasiado
  cercano al título de Persecución: se coloca junto al botón de pausa, con
  separación explícita, y se comprueba la ausencia de solapamiento en ambos
  modos. No cambia la simulación.
- La prueba larga de 20 cortes conserva cada interacción y cada aserción; se
  le asigna 60 s de ejecución para evitar el límite de 30 s bajo carga de CI.
- El navegador conectado confirmó que el botón Cerrar de Groove ya funciona y
  devuelve el foco sin salir de la partida. Siguiente: verificar el CSS final,
  cerrar CI y publicar.


## Validación final y release

- CI 181 sobre `33ac292eb9c40305717950a5160135ab9c4539b3`: **205 internas,
  486 escenarios de navegador (162 en cada perfil) y 14 offline**, todos correctos
  a la primera. Total: **705 comprobaciones**, además de la compilación.
- Las capturas finales de Arena y Persecución en 844×390 confirman el reloj
  separado del título y del botón de pausa. También revisadas las capturas de
  320×568 y 390×844: mandos arriba/abajo con P2 a 180°, acciones de 44 px o más,
  tablero y comienzo de partida accesibles. Los dos dedos y la tercera acción
  de sprint/disco pasan por eventos táctiles nativos de Chromium en CI.
- Preview Vercel READY: `dpl_2pqpkVntRGCi8NJAJnWricQCK6hU`, fuente `33ac292e`.
- PR 30 integrado: `ae4c838db05a27e1adae4ff07c0c896c09e37051`.
- Producción READY: `dpl_DXk5CgXTHEM4nNqFyXTbjyLgoZTY`, fuente `ae4c838d`.
  El navegador conectado abrió la portada completa de 600 px en la URL pública
  de `/test`, inició Persecución, movió P1, pausó y volvió a sus modos.
  Se conservó la vista publicada como resultado para el propietario.


## Cierre

Publicado y comprobado en
https://danzcollectiveapp.vercel.app/test?seccion=arcade&juego=collecta .
La pasada final CI 181 no necesitó reintentos. No se han ejecutado de nuevo los
escenarios por los cambios posteriores que solo actualizan documentación.
Siguiente desarrollo de Collecta: rival contra la máquina (DC03), sin perder
música/BPM de Groove, Kart, entregas externas y los demás pendientes del registro.
