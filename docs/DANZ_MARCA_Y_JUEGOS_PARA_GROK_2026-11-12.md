# DANZ Collective — memoria de marca y juegos
Edición: 12/11/2026. Guía de continuidad para crear juegos en Grok y entregarlos para integrar en Danzcollectiveapp. Contiene decisiones de diseño y comportamiento, no la transcripción del chat. Lo pendiente se señala expresamente.

## 1. Qué es DANZ
Colectivo creativo de música, DJs, fiestas, ropa, vídeo, diseño y 3D. La app une la experiencia del evento: entrada por QR, pasaporte/sellos, galerías privadas, descargas, ropa, comunidad y juegos. El tono es directo, cómplice y con humor de cabina; no infantil ni corporativo. Las bromas deben nacer de los cables, scratches, mezclas y situaciones del colectivo.

### Departamentos
| Nombre visible | Función |
|---|---|
| DANZ IN | DJs y música |
| DANZFLOR | Ropa y colección |
| DANZERS | Fiestas/eventos, no la pestaña de equipo |
| ARCADANZ | Juegos |
| DANZPOINTS | Recompensas, saldo, reglas y sugerencias |

Todos los títulos de pestañas van en MAYÚSCULAS. La estructura de EQUIPO sigue pendiente de nombres/perfiles del propietario: DJs forman parte del equipo y también de música, mediante una identidad/perfil compartidos; evitar duplicarlos en pestañas. Hay otros cinco integrantes creativos cuyos datos no deben inventarse.

## 2. Sistema visual
Base sobria en negro/blanco cálido y acentos que cambian por departamento, colección o evento. Arcade admite más color y animación. La app real usa estos tokens:

| Token | Valor | Uso |
|---|---|---|
| Fondo | #101011 | Base de la app |
| Blanco | #f3f0e8 | Texto principal |
| Gris | #aaa9a3 | Texto secundario |
| Línea | #38383c | Separadores discretos |
| Ácido | #d9ff6b | Acción/Arcade |
| Rosa | #ff789f | Acento |
| Violeta | #ba9efa | Acento |
| Agua | #8dd8c8 | Acento |

Títulos grandes, densos y con carácter; actualmente Impact / Arial Narrow / Arial, sin obligar a cargar fuentes externas. Cuerpo claro y legible. Jerarquía editorial fuerte, aire suficiente y controles fáciles de tocar. No convertir toda la app en una interfaz de videojuego multicolor.

### Marcas y flor
Usar los archivos proporcionados. El símbolo central es la flor blanca de seis pétalos. No deformarla ni sustituirla por una flor genérica. ARCADANZ ya tiene marca: ARCA pixelado + flor central + DANZ fluido. Mantenerla; no volver a llamarla simplemente Arcade. El wordmark principal tiene sus proporciones originales.

### Fotografías y prendas
- DJs: fotos con su color original, ajuste mínimo de contraste, bordes neutros finos, fondo limpio y enlaces discretos. El usuario rechazó los marcos gruesos de colores y aclaró que NO exige blanco y negro para los retratos de DJs.
- DANZFLOR: producto recortado y transparente sobre el fondo de la app, sin panel papel ni marco alrededor. Las fotos de producto actuales ya llevan alfa; conservar imagen, estampado y color. Las fotos de campaña mantienen su fondo fotográfico.
- Galería de eventos: respetar formato de subida vertical u horizontal y adaptar la visualización a la pantalla. Descargar el archivo original con sus dimensiones/calidad y marca de agua existente; no imponer recorte Instagram. Stories es una salida distinta. Guardado Android ya confirmado por el propietario; no rehacerlo para introducir juegos.

## 3. ARCADANZ: lenguaje de las portadas
Ilustración 3D cartoon con comedia, perspectiva dinámica y materiales con textura. Cabina/estudio industrial, hormigón, altavoces, iluminación magenta y amarillo ácido. Objetos musicales expresivos que parecen tener vida. Humor enérgico y pícaro. La portada de Snake es la referencia aprobada: un cable de audio escapa de una mano humana que intenta atraparlo. Evitar violencia gráfica, estética genérica de casino, una copia de Fruit Ninja o una portada sin relación con la música.

Las portadas son paisaje 3:2. La escena debe leerse a tamaño móvil. Dejar zona adecuada para título superpuesto en HTML, legible y accesible; no depender de texto horneado en una ilustración. GROOVE NINJA tiene una portada generada siguiendo esa línea (DJ haciendo scratch, vinilo expresivo, estelas, flor); su nombre es definitivo, la ilustración puede recibir más ajustes si el propietario los pide.

## 4. Juego 001: LA QUE HAS LIAO, JACK
Nombre definitivo elegido por el propietario, con coma en la interfaz: **LA QUE HAS LIAO, JACK**. HUD abreviado LIAO, JACK. La serpiente es un cable de sonido; cabeza con la flor de DANZ. Al perder: **PARTY OVER**, sustituyendo GAME OVER. No recuperar los nombres descartados JACK A LA FUGA o DANZ Snake como título principal.

### Caras y estética
Diez personas, tres expresiones por persona = 30 variantes. Estilo fotográfico en blanco y negro, cabeza recortada, centrada, tamaño visual uniforme, transparencia real y contorno blanco fino. Expresiones: alegre, sorprendido y picado. Los cuatro primeros también tienen tres. El hombre de la barba fue rehecho desde una nueva referencia; usar el atlas final, no el primer retrato descartado. No inventar nombres personales.

Los archivos face-01-emotions-v1.webp … face-10-emotions-v1.webp son atlas RGBA de 768×256: tres casillas de 256×256 en una fila. Mostrar solo una casilla, no las tres cabezas juntas. Se alternan persona y expresión en rondas sucesivas; las caras recogidas se intuyen en el cuerpo con baja opacidad, evitando saturación. Cada cinco caras aparece un objetivo simultáneo más, hasta cinco; se reponen en casillas libres y no se agotan.

### Reglas y sensación
- Tablero 19×19 (361 casillas), velocidad progresiva y tope de velocidad.
- Clásico + Laberinto. Doce mapas conectados: Islas, Pasillos, Circuito, Puentes, Órbitas, Cruces, Columnas, Túneles, Anillos, Zigzag, Patchbay y Backstage.
- Cada cinco caras se pasa al siguiente laberinto con salida segura y pausa explícita; el último continúa hasta choque o tablero lleno.
- Primer giro válido al instante; una segunda esquina puede quedar en cola. Evitar inversiones y sobrescritura de órdenes que frustren al jugador.
- Gestos reconocidos antes de levantar el dedo; botones opcionales, al presionar. Botón para mostrar/ocultar mando.
- JUGAR abre pantalla completa; fallback con viewport dedicado si el navegador no ofrece fullscreen. Vertical y horizontal.
- Salir, Escape u ocultar pestaña pausa. No reanudar automáticamente al volver.
- Práctica sin conexión y récord local; competir exige iniciar una partida desde COMPETIR y conexión al inicio/guardado. No subir récords antiguos de localStorage.

## 5. Competición y DANZPOINTS
La puntuación del juego y DANZPOINTS son unidades distintas. Recoger una cara da puntuación de partida, no puntos canjeables inmediatos. Clasificaciones semanal e histórica, mejor partida por cuenta, máximo un puesto por persona registrada; top 20 y puesto propio. Clásico y Laberinto se clasifican por separado; Laberinto competitivo empieza siempre en nivel 1.

### Modelo vigente
| Acción | DANZPOINTS |
|---|---:|
| Asistir al DANZERS piloto del 13/11/2026, con sello | 1.000 |
| Compra de ropa verificada | 5 por euro; máximo conjunto 600 por evento |
| Podio semanal de Clásico: 1.º / 2.º / 3.º | 50 / 25 / 10 |

Máximo tres semanas premiadas seguidas y veinte premios al año por cuenta, sumando TODOS los puestos del podio. El máximo anual posible son veinte primeros puestos = 1.000 puntos, lo mismo que una asistencia. Si alguien llega a un límite conserva el puesto pero no cobra esa semana; el premio no pasa al siguiente. Tras una semana sin premio se rompe la racha; el máximo anual se reinicia en el año natural del cierre.

Semana de lunes 00:00 a lunes 00:00, Europe/Madrid. Empates a favor de quien registró antes esa puntuación. Solo Clásico reparte este podio; no hay segundo premio por Laberinto. Cierre en servidor, recuperación de cierres pendientes y abonos idempotentes. Compras se verifican mediante personal con permisos y MFA; leer el catálogo Shopify no confirma un pedido ni lo premia automáticamente. Canjes y recompensas siguen por desvelar. Las sugerencias no dan puntos.

### Identidad obligatoria
Correo confirmado de DANZ + Instagram cuya titularidad se ha comprobado. Escribir un @ no verifica nada. Un código único emitido por el servidor se envía por el usuario desde su Instagram a DANZ o se muestra en su bio; el personal lo revisa con MFA en ADMINISTRAR. Es una revisión manual, no un OAuth Meta implementado. Un Instagram verificado se vincula a una sola cuenta DANZ. Cambiar el handle del perfil deja la vinculación sin validez hasta comprobarla. Código de siete días y cinco cambios de solicitud al día.

Asistencias, compras y premios quedan reservados mientras falte esa verificación; el servidor no los entrega como saldo disponible. La app no conoce ni comprueba el email privado con el que se creó Instagram: vincula el Instagram controlado con el correo confirmado de DANZ. No presume que varias cuentas Instagram sean personas físicas distintas.

### Seguridad de juegos externos
El servidor actual verifica el Snake a partir de ticket, semilla y movimientos; no acepta una puntuación que el cliente afirma haber ganado. No enviar DANZPOINTS directamente desde un juego creado por Grok. Los eventos de progreso del contrato son informativos y no acreditan puntos reales. Un juego nuevo necesitará su adaptador y validación antes de entrar en competición o generar premios. Nunca incluir service_role, claves, cuentas de prueba en producción ni acceso administrativo en el frontend.

## 6. Juego 002: DANZ Idle Studio — en creación en Grok
Concepto: estudio del colectivo con música, ropa, vídeo, diseño y 3D. Empezar con un puesto sencillo, producir, comprar mejoras y desbloquear otro puesto. Moneda virtual de juego separada de DANZPOINTS. La app solo muestra PRÓXIMAMENTE y una carátula provisional; no hay una implementación Idle entregada por este proyecto. El propietario está creándolo en Grok y puede aportar fotos del estudio más adelante.

Primer entregable recomendable: bucle jugable pequeño (tocar para producir, mejora con coste correcto, desbloqueo del segundo puesto, guardado/carga robustos, salida y pausa). Probar fondos insuficientes, doble pulsación, recarga, guardado corrupto y pestaña oculta. El contrato adjunto es una base de integración propuesta, no una API de premios.

## 7. Juego 003: GROOVE NINJA — primera sesión jugable
Nombre confirmado: **GROOVE NINJA**, guiño a Fruit Ninja con temática DANZ. VINYL CUT ya tiene una sesión de práctica de 60 segundos: cortar vinilos al vuelo, combos hasta ×4, cinco vidas, acoples que esquivar y tres ventanas de scratch por ida y vuelta. Hay tres tramos de intensidad, récord local, sonido opcional, pausa y pantalla completa con alternativa para móvil. Los vinilos se parten por la dirección del gesto, con estela y fragmentos. La derrota dice PARTY OVER.

La base sonora actual es **sintetizada para ensayo**: beat, bajo, sinte y aire se van construyendo con aciertos. No contiene temas, voces o stems reales del colectivo. La sesión es práctica, no otorga DANZPOINTS ni tiene competición oficial. El selector de ARCADANZ y el parámetro `juego=groove-ninja` permiten abrirla sin mezclar controles con Snake. El código propio utiliza SVG y Web Audio; no ha requerido añadir dependencias o un plan de pago.

**Reconstruye el tema** sigue siendo la fase musical favorita: cada acierto añade o limpia batería, bajo, voz… hasta escuchar el lanzamiento original. El propietario puede aportar temas por capas más adelante. Las bromas sonoras, artistas, lanzamientos y sus enlaces SoundCloud aún no están definidos; no inventarlos. Un enlace de escucha no equivale a los archivos necesarios para manipular pistas.

Un modo tipo Guitar Hero es una variante futura; se priorizan cortes y scratch. No afirmar que el juego ya reconstruye música real. Idle Studio y el plataformas son proyectos independientes que el propietario está creando en Grok; no rehacerlos ni rediseñarlos como parte de este juego.

## 8. Comportamiento común que debe conservar Grok
1. Móvil primero, legible a 320 px, táctil inmediato, objetivos de toque de al menos 44 px y soporte horizontal.
2. Animaciones con propósito; respetar reduced-motion. Evitar parpadeos, interfaces ruidosas y gasto constante de batería.
3. Sonido solo tras gesto del usuario y con control de silencio; parar audio, RAF, listeners y temporizadores al pausar/salir/ocultar.
4. No interceptar teclado de formularios, no bloquear la navegación de la app ni dejar overflow oculto al salir.
5. Usar un namespace de guardado por juego (danz-idle- / danz-groove-). Validar JSON y tener fallback para datos corruptos o almacenamiento bloqueado.
6. Estados claros: esperando, jugando, pausado, fin, error/reintento. PARTY OVER es el mensaje de derrota aprobado. Sin falsos “guardado”, “verificado” o “premiado” antes de respuesta real.
7. No crear otro registro ni base de usuarios. La app anfitriona gestiona identidad, cuenta, privacidad, rankings y puntos.
8. Mantener URLs/rutas relativas y assets de tamaño moderado. No depender de redes externas para controles o arte esencial del juego.
9. Entregar archivos completos, dependencias fijadas, README de ejecución y comprobaciones útiles. No un fragmento con huecos o marcadores ficticios.

## 9. Entrega a Grok
Adjunta el ZIP entero y pide: “Lee primero esta guía y el contrato. Conserva las decisiones confirmadas. Crea el juego solicitado como componente independiente, reutiliza los assets pertinentes y entrega un ZIP completo con código, recursos y README. Señala las decisiones nuevas que propones; no simules integración de puntos o Instagram.”

Incluir una captura o vídeo corto del avance de Grok ayuda a revisar estética y sensaciones; antes de integrarlo se revisarán código, tamaño de assets, guardado, controles, audio, pausa y seguridad. No hace falta copiarle toda la conversación ni enviar claves o datos privados de asistentes.

## 10. Qué sigue pendiente
Nombres/perfiles del equipo; reglas de otras actividades; catálogo de premios/canjes; archivos de audio y bromas de GROOVE NINJA; juego Idle producido en Grok; integración y validación de juegos nuevos. Las carátulas y el kit no significan que esos juegos estén implementados. Las preferencias futuras explícitas del propietario prevalecen sobre esta edición.
