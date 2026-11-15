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
