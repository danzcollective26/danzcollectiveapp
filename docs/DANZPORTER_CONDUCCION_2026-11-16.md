# DANZPORTER — conducción, garaje, boxes y horizontal

## Publicado en PR 37; ajuste de altura en PR 38

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

Preview READY de PR 37 revisada manualmente con el juego real en 390×844,
320×568 y 844×390. El garaje conserva chasis, ruedas, pintura y piloto al
recargar; P2 mantiene piezas independientes. GAS táctil pasa de 0 a 83 km/h y
FRENO vuelve a 0; teclado W/S también funciona con joystick enfocado. Choque
real reduce estado a 90%; pausa mantiene tiempo/daño y calidad no duplica
canvas ni pierde piezas. Solicitud de boxes entra al carril y regresa con estado
100% sin sumar vueltas. Mandos horizontales de 112 px, girados ±90°.
Collecta inicia con flechas 48×48; Groove inicia y pausa, armas 52 px de alto.
No se afirma multitoque simultáneo o giro físico del dispositivo.

Render de geometría separado en Blender/Cycles CPU: 498 objetos, 100 pares de
geometría/material, vista general y estación. Carril y canopy no bloquean pista;
las piezas de diferentes configuraciones se conservan. Materiales/iluminación
aproximados. El navegador conectado tiene WebGL desactivado y activa compatible
2D: estas imágenes no son captura del renderer WebGL ni prueba de rendimiento.

Código PR 37: dc5fe5e8d793bf0cb7e33c37f44da1fa7ef2d03a. Producción READY
dpl_DxeWwfqsggzAE9AxdKcTvWXF9w3r. Nombre, portada 720×960 cargada y
garaje/ambiente comprobados en la URL pública. PR 38, 49a55708, corrige un
solapamiento del garaje largo detectado en esa revisión: fila reducible y panel
con alto máximo relativo. Preview escritorio y 320×568: cabecera termina en
y48, panel desde y54, 10 px al borde inferior; inicio y opciones alcanzables.

Escenarios de navegador escritos: acelerador, foco del joystick, garaje
persistente, boxes, mandos opuestos, orientación y calidad. CI 207 termina con
cuatro jobs sin steps/logs; no contarlos como automatizados ejecutados (T04).
T01 conserva GPU, Android/iPhone físicos, audio escuchado, FPS y batería.
La revisión de componentes mantiene estado de simulación/entradas en refs,
HUD acotado, renderer diferido, materiales agrupados y limpieza de capturas,
eventos, audio y timers. Sin dependencias nuevas en este bloque.

## Cierre público final

PR 38 publicado: `49a5570816fe06ed48d957d8425806a24de9eda7`; producción READY
`dpl_21m1nYH7Bto3eNNYpXVeNweVJGJB`. URL pública comprobada:
https://danzcollectiveapp.vercel.app/test?seccion=arcade&juego=kart

Garaje expandido desde y54 bajo cabecera y48, sin solapamiento; las preferencias
de Sprint/Endurance y Último servicio sobreviven a la navegación. Inicio real
en Contrarreloj, boxes guiados, retorno con salud 100% y cero vueltas falsas,
pausa, salida a biblioteca y reapertura correctos. Portada aprobada cargada a
720×960 en biblioteca. Captura del garaje público conservada en la sesión.

Build final correcto, 68 archivos del shell; versión local `18f644eafd8fc32a`.
Las 240 pruebas internas verifican la mecánica; el cambio final solo ajusta CSS
más el nombre de la ventana de revisión. CI 209 vuelve a terminar sin ejecutar
pasos (cuatro jobs, sin logs); T04 sigue abierto sin causa confirmada. T01/T04,
contenido adicional y online conservan los límites descritos arriba.
