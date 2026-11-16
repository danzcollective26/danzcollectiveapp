# DANZPORTER — conducción, garaje, boxes y horizontal

## Implementado, pendiente de revisión conectada y publicación de esta versión

- Gas manual, inercia al soltar y freno hasta detenerse. DERRAPE también aplica
  gas para jugar con dos pulgares; autoaceleración opcional. Giro suavizado y
  agarre/desgaste alteran la respuesta. Puede prepararse el mando en la cuenta
  atrás; no se mueve el kart antes de verde.
- P1: W/S gas/freno, A/D gira, F derrape, B boxes. P2: flechas, L y O. Joystick
  táctil mantiene punto de vista de cada extremo, incluidas etiquetas y acciones.
  El joystick enfocado delega el teclado al control de conducción. Al pausar,
  girar, perder foco o cancelar se sueltan entradas.
- Tres chasis (Club, Sprint, Transport) y seis ruedas (Street, Grip, Slide,
  Endurance, Light, Slick). Velocidad, salida, agarre, derrape, resistencia del
  chasis y durabilidad de neumáticos diferentes; las ventajas tienen costes.
  Tres pilotos y pintura libre cosméticos. Dos builds independientes en duelo.
- Golpes de cierre a velocidad suficiente dañan chasis y neumáticos; el contacto
  lento no quita vida. Recuperación de 650 ms entre daños evita aplicar un golpe
  en cada subpaso. El daño reduce rendimiento y el desgaste afecta dirección.
  La crew comparte reglas de daño y repara si lo necesita.
- BOXES solicita/cancela una parada; entra en la recta de salida a carril separado,
  limita velocidad, repara durante 3,5 s y vuelve a la misma secuencia de pasos.
  Con avería completa, grúa tras 3 s y reparación; pierde distancia de la vuelta
  en curso y tiempo, sin sumar vueltas ni reiniciar el cronómetro.
- Feedback 3D: pintura castigada, paragolpes torcido/desprendido, pieza breve y
  humo acotado. Compatible 2D: tinte, grietas, restos, humo y etiquetas. Movimiento
  reducido suprime efectos móviles. Audio sintetizado de impacto y servicio.
- Boxes y crew visibles en ambos renderers. Ambientes de muelle, terminal nocturna
  o paddock, con materiales/paleta/luces. No se cambian los trazados principales.
- Preferencias v3 migran gráficos, sonido y parejas de colores anteriores. Récord
  v3 por circuito/chasis/ruedas; pintura y piloto no cambian el récord. Las claves
  antiguas no se borran. No se conceden puntos competitivos desde el cliente.

## Decisiones de orientación

| Juego | Decisión y utilidad |
| --- | --- |
| DANZPORTER | Vertical/horizontal naturales, pedales mayores y joystick 112 px; en duelo cada mando sigue a su jugador. En pantallas horizontales muy bajas se reduce a 96 px para que quepa. |
| Collecta Arena/Persecución | Conservar giro enfrentado y ampliar en horizontal cuando hay altura: joystick 108 px, flechas 48 px y acción 56 px. Solo contra máquina mantiene mando derecho. |
| Groove Vinyl/Scratch | Mantener física y SVG original, con botones laterales 48–52 px y HUD más legible. Al girar se pausa y se cancela el gesto. |
| Jack | Mantener tablero cuadrado y controles existentes; no estirar el tablero ni cambiar geometría competitiva para anunciar una orientación que no da más juego. |

No se fuerza orientación del dispositivo ni se exige API de bloqueo. Las
piezas están abiertas en esta versión local: no hay catálogo o gasto de
DANZPOINTS inventado. Online, objetos y atajos siguen separados.

## Validación actual

Build y 240 pruebas internas correctos. Diez pruebas de conducción nuevas y
migración de preferencias; siguen las carreras de tres vueltas, cadencias
16/33/50 ms, límites y prevención de vueltas falsas. Se simulan 36 combinaciones
(18 builds × dos pistas): todas completan tres vueltas en 41,983–51,533 s.
Host 5,483 s para la batería; no es una medida de GPU, batería o móvil.

Escenarios de navegador escritos: acelerador, foco del joystick, garaje
persistente, boxes, mandos opuestos, orientación y calidad. No contarlos como
ejecutados sin CI. CI 205 de portada no arrancó pasos; T04 sigue pendiente.
El navegador conectado anterior tiene WebGL desactivado: validar vista
compatible y revisar geometría 3D en CPU, sin presentar ese render como captura
WebGL. T01 conserva prueba física y audio escuchado. Evidencia final al cerrar.
