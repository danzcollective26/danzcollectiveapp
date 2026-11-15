# Auditoría Collecta: lore y joystick — 15/11/2026

Estado: publicado en PR 31; verificación local y manual completada con
limitaciones de automatización enumeradas abajo.
Código: `3fea5cb0740a465c8c738ecdca7b3381a7739080`.
Producción READY: `dpl_DB97o26nPtSGXPW6TaXTAgZD69ZD`.
Base: main a584950f61365da7273a30f1502a3693e6bde5f5.

## Historia y opciones

El hub da voz al encargado y sitúa el juego al terminar el set. Arena se llama
Cierre de pista; Persecución, Pasa el marrón. Hay avisos, etiquetas de factura,
roles, diálogos de pausa/resultado y sello de trámite. La portada exacta aprobada
permanece intacta. Los personajes siguen siendo las flores beta.

Cada persona elige flechas o joystick, con persistencia local. La elección se
mantiene al entrar y volver de los modos; si no hay almacenamiento, funciona en
memoria durante la página. No se añaden dependencias ni servicios externos.
Arena conserva sus casillas; Persecución tiene entrada analógica y diagonal.

## Entrada, recursos y rendimiento

- Context7 consultado para React y Phaser 4.2.1; MDN para matrices SVG, captura
  de punteros y cancelación/orientación.
- Coordenadas calculadas con la inversa de la matriz real del SVG girado.
  Cada joystick captura su dedo, incluido el segundo puntero no primario.
- Zona central del 16 %, magnitud acotada y estabilización cerca de diagonales
  en Arena. Retorno al centro al soltar, cancelar, perder captura/foco, pausar,
  girar o desmontar el componente.
- Entradas en referencias y actualización directa del pequeño SVG; sin un
  render React por cada movimiento del dedo. El HUD y el bucle Phaser mantienen
  sus frecuencias anteriores y se duermen en pausa.
- La factura es un dibujo vectorial pequeño. Los textos de Phaser solo cambian
  cuando cambia el rol; no se regeneran texturas de texto cada frame.
- Duración, puntuación, colisiones, cargas de sprint y reglas de victoria de los
  dos motores conservadas. Ninguna puntuación local concede premios.

## Verificación

- Build local correcto.
- Pruebas nuevas de zona central, magnitud, orientación, precisión cardinal,
  velocidad proporcional y preferencias inválidas/almacenamiento no disponible.
- 211 pruebas internas correctas.
- Preview: juego real revisado dentro de ventanas de Arena 320×568/390×844 y
  Persecución 844×390. Ambos jugadores se desplazan hacia el lado esperado,
  regresan a cero al soltar, y los mandos miden 96×96. Disco, sprint y pausa
  accesibles. Las instrucciones y el botón de empezar caben en 320×568.
- Preferencias comprobadas tras recargar, retorno entre modos y teclado enfocado
  en Arena. Se conserva `/test-collecta-layouts.html` para repetir la revisión
  visual sin permitir fullscreen dentro de las ventanas de tamaño fijo.
- Producción: hub, opciones, partida iniciada, desplazamiento de P1 (110 → 290),
  pausa y retorno comprobados. Portada aprobada conservada.
- **Bloqueado:** CI 184/185 falla antes de ejecutar cualquier paso y no genera
  logs. La causa no se ha podido obtener mediante la conexión disponible.
  El navegador local falla al crear socket con Operation not permitted.
  No se cambian protecciones ni se activan recursos de pago para sortearlo.
- Escritos, pero aún no ejecutados: escenarios de dos dedos con una tercera
  acción, captura fuera del mando, cancelación, rotación y uso offline.
  La regresión completa de navegador/offline de esta entrega queda pendiente
  en T04. Las 705 comprobaciones del bloque anterior no validan este código.
- El código usa referencias para entradas/estela y reutiliza gráficos; el
  bloque Phaser compartido continúa siendo pesado (~1,37 MB sin comprimir).
  Medir tiempos reales y comodidad en Android/iPhone sigue en T01.
- No se han medido FPS o batería en dispositivos físicos.

## Siguiente trabajo conservado

DC03, rival contra la máquina; acabado de personajes (DC04); online, música/BPM
real de Groove, Kart y el resto del registro. QR y stems siguen aplazados.
