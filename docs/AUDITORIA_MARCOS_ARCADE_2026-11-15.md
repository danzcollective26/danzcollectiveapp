# Marcos compactos del Arcade — 15/11/2026

Petición A05: reducir el marco exterior de todos los juegos. PR 33.
Código publicado: `e981c8dc567047ed137056744268d71ee4e17585`.
Producción Vercel READY: `dpl_2o4AJoSkBXo6HoB4yaq5XEQ8jNqo`.

## Cambios

- Contenedor de presentación compartido: el borde acompaña al tablero y su
  pausa/introducción, sin enmarcar el espacio vacío que deja su proporción fija.
- Marcos de 1 px, márgenes inmersivos de 4 px o área segura y menos sombras.
- Jack usa unidades de contenedor en lugar de una resta fija de altura.
- Groove conserva su SVG 640×760. Collecta conserva 11×9 y Persecución 880×600.
- Destrucción reduce también margen de página y adapta el título en móvil.
- Reglas, puntuación, portadas aprobadas y perspectivas enfrentadas conservadas.

## Comprobación visual y de uso

Juego real en iframe de tamaño fijo, sin permiso de fullscreen dentro del iframe.
No se simula que esto equivalga a un teléfono físico. Página repetible:
`/test-arcade-frames.html`. Medidas CSS en píxeles, redondeadas:

| Juego | Ventana | Marco | Dibujo interior | Borde |
| --- | --- | --- | --- | --- |
| Jack | 320×568 | 312×312 | tablero cuadrado | 1 |
| Groove Vinyl | 390×844 | 382×454 | SVG 380×452 | 1 |
| Groove Scratch | 390×844 | 382×454 | SVG 380×452 | 1 |
| Arena duelo | 320×568 | 298×244 | canvas 295×242 | 1 |
| Último turno | 390×844 | 382×313 | canvas 380×311 | 1 |
| Último turno | 844×390 | 389×318 | canvas 386×316 | 1 |
| Persecución | 390×844 | 382×260 | canvas 379×258 | 1 |

Destrucción: etapa y tablero con borde de 1 px y relleno de etapa de 5 px.
Persecución inicia, consume sprint (LISTO → 3 s), pausa y muestra el menú sobre
el tablero. Botones cardinales 44×44. Las zonas de control quedan accesibles.
Vinyl y Scratch se abren en su cabina; Jack mantiene cuadrícula y salida.

## Rendimiento y límites

`npm run build` y `git diff --check` correctos. Shell estático de 58 archivos,
versión `95973f6d41fa5697`. Contenedor puro sin listeners, intervalos o bucles
de resize; no se añaden dependencias. El motor conserva su tamaño lógico.
No se ha medido FPS, batería o multitoque de teléfono físico.

CI 193 (`43755045143`) termina con error antes de ejecutar pasos: los cuatro
jobs devuelven steps y logs_url nulos. No se atribuye una causa no comprobada
ni se cuenta esa batería como correcta. Chromium local no puede crear socket.
T04 mantiene la automatización pendiente y T01 la prueba de dispositivos reales.
Las 219 pruebas internas de PR 32 son históricas, no reejecutadas en este cambio
de presentación. El aviso previo de tamaño del chunk Phaser sigue presente.

## Cierre público

Producción verificada: Collecta solo inicia y pausa con marco 382×313 y canvas
380×311 en 390×844. Captura del juego completo con joystick. Destrucción tiene
margen lateral de 4 px y título de 36,66 px sin desborde (ancho 367 px).
`/test` carga la zona de pruebas y los accesos a los juegos tras actualizar y
recargar la PWA desde el diálogo normal. No quedan procesos de captura activos.
