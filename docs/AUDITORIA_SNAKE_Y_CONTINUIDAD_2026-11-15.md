# Snake y continuidad — auditoría del 15 de noviembre de 2026

## Problema y corrección

El propietario comunicó que la serpiente y los rostros habían pasado a verse
encerrados en cuadros. Se reprodujo en la versión pública: cabeza sobre una
casilla lima con borde blanco y rostro con aro y resplandor rectangular.

Había dos causas en la cascada CSS: el borde/fondo de la cabeza añadido en el
pulido anterior y la animación heredada `snake-food-glow`. Esta última seguía
animando `box-shadow` aunque otra regla declarase `box-shadow:none`.

Se retiran fondo, borde y sombra de casilla de cabeza, objetivos y cuerpo; se
elimina el aro del objetivo y se desactiva esa animación. La flor y las caras
conservan sus recursos transparentes y el cuerpo conserva el cable continuo.

## Auditoría visual y jugable

- Navegador conectado: reproducción antes y revisión en la vista previa del
  commit `9bac7bad13333644aefb5955b1d6efc5628d7a7b`.
- El tablero muestra flor y rostro recortados, sin marcos. Inspección de estilos
  calculados: fondo transparente, imagen de fondo inexistente, bordes de 0 px,
  sin box-shadow ni pseudoaro; la comida no tiene animación de sombra.
- Se observa una partida que recoge un rostro, suma 10 puntos y termina en
  PARTY OVER; la revancha vuelve al tablero. La cara recogida conserva la
  integración en el cable.
- La prueba de regresión recorre además giro, imagen cargada y movimiento
  reducido; adjunta una captura por tamaño al informe de navegador.
- No se modifican las reglas de juego, la validación competitiva, las portadas,
  los demás motores ni los permisos de la app.

## Rendimiento y móvil

- Se conserva la memoización y las búsquedas Map/Set del tablero.
- Se elimina una animación infinita de sombras de objetivo; no se añaden
  temporizadores, peticiones de red, recursos o dependencias.
- Las pruebas existentes revisan giros táctiles nativos, cola, mando, pausa,
  controles y tablero a 320×568 y 844×390; el nuevo caso corre también en los
  perfiles móvil, tableta y escritorio de CI.
- La revisión visual del navegador conectado usa su viewport de escritorio.
  Los tamaños de CI son emulación, no dispositivos físicos.
- Pendiente: FPS sostenidos, consumo/batería y comodidad en Android/iPhone reales.
  No se atribuyen cifras de FPS a esta corrección.

## Continuidad y mejoras aplicadas

- Registro general con identificadores, estados, evidencia y próximos pasos:
  `REVISION_Y_PENDIENTES_DANZ_2026-11-15.md`.
- Seguimiento permanente añadido a `AGENTS.md` y referencia desde las hojas de ruta.
- Corregidas dos contradicciones: portadas ya integradas y Pilla-Pilla como
  persecución/escape, en lugar de tocar apariciones.
- Memoria y kit de Arena para Gemini comprobados. ZIP de 31.260 bytes,
  15 archivos, CRC correcto y cuatro archivos principales del módulo presentes.
- Conservados como pendientes BPM/música y cosméticos de Groove, nuevos juegos,
  funciones de fotos/cuenta/admin, puntos, tienda y fases posteriores.
- Nuevos QR artísticos y reconstrucción por stems siguen aplazados.

## Herramientas y límites

Context7: documentación actual de React sobre memoización. GitHub: contraste de
la base publicada, diff, PR y CI. Vercel: proyecto, commit y vista previa READY.
Navegador conectado: revisión visual y jugable real de esa vista previa.
La corrección usa los recursos existentes; no requiere generar diseños ni
consumir créditos en servicios visuales.

Chromium local no pudo arrancar: el host rechazó la apertura de su socket con
`Operation not permitted`. Se usaron CI y el navegador conectado como alternativas;
no se solicitó una escalada ni se declaró una prueba local de navegador superada.

## Validación y publicación

- Build local correcto; 19/19 pruebas de reglas de Snake correctas.
- CI 176: 191 pruebas internas, build y 12 pruebas PWA/offline correctas.
- CI 176 (`43719582339`), código `9bac7bad`: 465 casos de navegador correctos,
  155 por perfil, incluida la regresión de casillas sin marcos en los tres.
  Total: 668 comprobaciones (sin sumar de nuevo las 19 locales).
- PR 29 incorporada a `main` como `2a5483f8169da78a54825488139279aa362513b5`.
  Despliegue `dpl_5zXEq6h7PxdKeGjRJe7JHbR8owXU` confirmado READY/production.
- Navegador conectado: verificación final en
  `https://danzcollectiveapp.vercel.app/test?seccion=arcade&juego=jack`, con estilos
  transparentes y sin sombras/bordes; revancha y captura del tablero correctas.
- Revisión adicional de radio: Sashi Mixed reprodujo con `currentTime` avanzando,
  duración 349 s y sin error del elemento audio. Just a Feeling cargó metadatos
  con duración 337,64 s. No se acreditan escucha completa, mezcla auditiva o
  reproducción individual de todos los temas por esos dos checks.
- El cierre posterior solo actualiza documentación; el código ejecutable es el
  mismo que pasó CI y se inspeccionó en producción.
