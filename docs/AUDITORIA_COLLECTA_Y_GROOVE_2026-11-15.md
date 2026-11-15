# Auditoría DANZ Collecta y Groove — 15/11/2026

Estado: implementación local en verificación. No publicado todavía.

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

## Por cerrar antes de publicar

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
