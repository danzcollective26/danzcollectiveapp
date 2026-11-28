# DANZ COLLECTIVE · CONTEXTO COMPLETO DEL PROYECTO (para Claude)

Preparado por **Danz Collective Dev** (el bot de Cursor que trabaja en el repo) el **28/11/2026** para Tronco. Todo sale de fuentes: los hilos del proyecto de Grok «Danz app», el repositorio, los documentos de diseño y las decisiones que Tronco ha tomado en el chat con el bot. Cuando algo no está confirmado, se dice.

---

## 0. Cómo usar este paquete

**Archivos**
- `00-LEEME-DANZ-CONTEXTO.md` (este): el documento maestro. Empieza por aquí.
- `01-…md` a `17-…md`: las conversaciones del proyecto de Grok «Danz app», limpias de texto de la interfaz y con etiquetas 🟢 TRONCO / 🤖 GROK. Cada una lleva una cabecera con su enlace, de qué trata y los huecos de la captura.
- `ANEXO-SEIS-transcripcion-hilo13.md`: el diseño de SEIS, sacado del hilo 13 en una lectura anterior (falta en la captura actual).
- `ANEXO-MANAGER-HEIST-SPEC.md` y `ANEXO-MANAGER-HEIST-DESIGN.md`: los documentos que escribió Grok en el hilo 14.
- `ANEXO-TWO-HANDS-JOKANO-DESIGN.md`: el diseño del pinball.
- `ANEXO-PLANTILLA-JUEGOS-DANZ.md`: la plantilla para el colectivo. Sirve como inventario de los nombres, textos y frases reales de cada juego.
- `ANEXO-NOTAS-LECTURA-16-11.md`: notas de la lectura del proyecto del 16/11, que cubren partes que hoy faltan.

**Proyecto de Grok:** https://grok.com/project/5018f54b-7ecd-4787-a480-bfd51b7d82ca
**Repositorio:** https://github.com/danzcollective26/danzcollectiveapp (público a 28/11/2026). En Claude se puede conectar GitHub para leer el código real.

**Cómo de completo es.** La copia de los hilos está **incompleta**. Casi todas las capturas llegan solo hasta el 4.º mensaje de Tronco y las respuestas de Grok a esos mensajes. En los hilos 03, 05, 07, 08, 09, 10, 13 y 15 hay pruebas de que la conversación seguía (ver sección 12). Además, el 16/11 el proyecto tenía 19 hilos y hoy solo aparecen 17. Lo que falta se ha completado aquí con las notas del 16/11, los anexos y el repo, siempre diciendo de dónde sale. **Si una decisión no aparece en ninguna fuente, no la des por tomada: pregunta a Tronco.**

**Prioridad entre fuentes.** Lo último que decide Tronco manda sobre los documentos antiguos. La misma regla está escrita en `AGENTS.md`.

---

## 1. Qué es Danz Collective y qué es la app

**DANZ Collective** es un colectivo creativo de música, DJs, fiestas, ropa, vídeo, diseño y 3D (fuente: `docs/DANZ_MARCA_Y_JUEGOS_PARA_GROK_2026-11-12.md`).
- El nombre correcto es **DANZ**, no «Dance». Grok se confundió en los hilos 01 y 13.
- El dominio es danzcollective.com. La web del colectivo está **desactivada en la app** (`websiteUrl: null`), por decisión del 10/11.
- En las fiestas o colecciones aparecen Tracks & Cocktails, Disco Culture y Club House. Las dos últimas son camisetas reales de DANZFLOR.

**Departamentos.** Los nombres visibles siempre van en MAYÚSCULAS.

| Nombre | Qué es |
|---|---|
| DANZ IN | DJs y música, también el sello DANZ IN Records |
| DANZFLOR | Ropa y colección |
| DANZERS | Fiestas y eventos: pases, QR y sellos |
| ARCADANZ | Juegos. Nunca se llama solo «Arcade» |
| DANZPOINTS | Recompensas, saldo y reglas |

**La app** es una PWA (web instalable) en https://danzcollectiveapp.vercel.app. Está abierta al público desde el 10/11/2026. Su primera versión se hizo en ChatGPT: el hilo 13 habla de la «versión 51». Después se recuperó y siguió en Codex, y hoy la trabajan varias IA.

**Qué hace hoy, en `main`** (según el README y el código):
- **Inicio** con la flor y la marca.
- **DANZ IN:** perfiles de Chicharro (ES), TonyDawgs, Wizme y LEÖN.
- **DANZERS:** pases por QR o código, canje validado en el servidor y **Pasaporte** de sellos por cuenta. Desde el PR #60 (19/11) el Pasaporte es un libro editorial que se pasa por páginas, con número de socio por orden de alta. El fundador es el #000001.
- **Galerías privadas:** fotos por evento con enlaces firmados de corta duración; la descarga da el original.
- **Cuenta:** acceso por correo sin contraseña o con Google. Apple está preparado pero no activo. Instagram se verifica a mano con un código.
- **Administración:** eventos, pases y fotos, con permisos y MFA.
- **Radio o hilo musical** y **Yeppo** (la mascota).
- **ARCADANZ:** Jack, Groove Ninja, DANZ Collecta, DANZPORTER y Idle Studio.
- Ruta **`/test`** para probar juegos y Yeppo desde el móvil.

**Regla de producto de Tronco (hilo 04), vigente en todo el proyecto:** *durante la noche la app no existe*. La gente está bailando. Lo único que se hace en la fiesta es picar el QR del sello y guardar el móvil. La app es el recuerdo y la identidad, el sitio al que se vuelve al día siguiente para ver fotos, jugar, mirar artistas o DANZFLOR. Por eso las ideas «en directo» (por ejemplo «Cabina en vivo» o «Pasaporte Rush» del hilo 13) chocan con esta regla.

---

## 2. Stack técnico y repositorio

**Stack**
- React 19, TypeScript y Vite, como PWA con su propio service worker (`scripts/build-service-worker.mjs`).
- Supabase: autenticación, Postgres con RLS, Storage privado y Edge Functions. Proyecto Supabase `ttgehdknhnrxtddxpknc`, según el PR #97.
- Phaser 4.2.1 y Three.js 0.186 para juegos. Por ejemplo, DANZPORTER usa 3D con fallback 2D.
- Node 24.
- Despliegue en Vercel, equipo `danzcollectiveapp-5608`, proyecto `danzcollectiveapp`. Cada PR tiene su preview.

**Comandos:** `npm ci`, `npm run dev`, `npm test` (node --test), `npm run build`, `npm run test:e2e` (Playwright) y `npm run test:pwa`. La CI de GitHub Actions corre las pruebas internas, offline y `browser-tests` en móvil, tablet y escritorio.

**Estructura útil**
- `src/arcade/`: cada juego tiene su motor y su componente, entre ellos `arena/`, `chase/`, `kart/` e `idle/`. Junto a ellos están `ArcadeChooser.tsx` y `CollectaHub.tsx`.
- `src/yeppo/`, `src/cloud/` (galerías), `src/events/`, `src/points/`, `src/auth/` y `supabase/migrations`.
- `docs/`: decisiones y auditorías. Los más importantes son `ARCADANZ_ROADMAP.md`, `REVISION_Y_PENDIENTES_DANZ_2026-11-15.md` (el registro general de pendientes) y `DANZ_MARCA_Y_JUEGOS_PARA_GROK_2026-11-12.md`.

**Rutas de juego:** `?seccion=arcade&juego=` seguido de `snake`/`jack`, `groove-ninja`, `collecta`, `arena`, `arena-solo`, `pilla-pilla` (Persecución), `kart` o `idle-studio`.

**Contrato para juegos nuevos** (doc de marca §8 y `docs/DANZ_CONTRATO_JUEGO_PARA_GROK.ts`):
- Móvil primero, legible a 320 px, objetivos de toque de al menos 44 px.
- Respetar el movimiento reducido. El audio solo arranca tras un gesto.
- Pausa al ocultar la pestaña.
- Guardado con un prefijo por juego (`danz-<juego>-`).
- Al perder se muestra **PARTY OVER**.
- El juego no crea usuarios propios. **Un juego nunca da DANZPOINTS desde el navegador.** Los eventos de progreso llevan `claim: false` y el servidor valida (por ejemplo, Jack con ticket, semilla y movimientos).

**DANZPOINTS, modelo vigente:**
- Asistir al DANZERS piloto del 13/11 da 1.000.
- La compra verificada da 5 por euro, con un máximo de 600 por evento.
- El podio semanal de Jack Clásico da 50 / 25 / 10, con un máximo de 3 semanas seguidas y 20 premios al año.
- Para cobrar hace falta un correo confirmado y un Instagram verificado.
- SEIS (PR #50) propone 10 puntos por victoria validada, con un máximo de 3 por semana y 20 al año. No está fusionado.

**Estado del repo (28/11/2026):**
- El último commit en `main` es `d281e1d`, del 20/11/2026, con las reglas contra regresiones de la issue #62. **Desde entonces no se ha fusionado nada.**
- Hay 35 PR abiertos (sección 8) y 11 issues abiertas (sección 9).

---

## 3. Equipo y herramientas

- **Tronco:** el propietario, que lleva el proyecto. Escribe en español, a menudo por voz, y aprueba todo.
- **El colectivo:** las personas que salen en los juegos. La crew del Idle Studio la forman Luitzmi, Chicharro, Roncero, Juanfran, Cosa, Alpi, Mike, Jokano, León, Tomy, Mono, Sol, Pepe, Vero y Lux. Los DJs de DANZ IN son Chicharro (ES), TonyDawgs, Wizme y LEÖN. **No se inventan datos de personas.** Para meter a alguien en un juego hace falta su nombre o apodo público y su permiso.
- **Grok** (proyecto «Danz app»): es donde Tronco genera ideas y diseña juegos con cuestionarios tipo test. Las conversaciones están en los archivos 01–17. La memoria del proyecto es compartida entre hilos.
  - Al principio el conector de GitHub de Grok solo podía leer (error 403, hilos 05, 03 y 17).
  - Más tarde Grok sí escribió en el repo: el 23/11 hizo commits en `feat/collecta-drop-defense` y `feat/its-mikes-fault` con el autor «Grok».
- **ChatGPT / Codex:** donde nació la app. Codex está instalado como GitHub App (hilo 05) y fue el que integró el código. Tronco trabaja «en paralelo» en Codex.
- **Gemini:** trabajó en Arena DANZ, según `docs/REVISION_Y_PENDIENTES…`, sección 1.
- **Danz Collective Dev** (bot de Cursor, el que prepara este paquete): lo creó Grok en el hilo 17 para trabajar el repo. Hace el trabajo en PR con agentes en la nube y **nunca fusiona sin el OK de Tronco**. Suyos son, entre otros, los PR #45, #50 a #52 y #55 a #58 de los días 16 y 17/11.
- **Claude:** ya hay una rama `claude/danz-apo-analysis-nfzou2` con el PR #97 (27/11). Incluye una auditoría premium de ARCADANZ, el arreglo del login en previews (#67), un «kit de jugo» para juegos y una preferencia de trabajo de Tronco añadida a `AGENTS.md`.
- **Otros PR del 19 al 27/11** (#64 a #96, casi todos «[BORRADOR]»): están firmados en git como `danzcollective26`, sin indicar qué herramienta los hizo. No salen en los hilos capturados.
- **Conectores** que Grok dice tener (hilo 10): GitHub, Linear (proyecto «DANZ Collective App», issues DAN-5 a DAN-25), Notion, Vercel, Figma, Canva, Excalidraw, Google Drive, Automations y Voice.

---

## 4. El universo DANZ

### 4.1 Voz y tono
- Directo, cómplice y con humor de cabina. **No es infantil ni corporativo.**
- Las bromas salen de cables, scratches, mezclas y situaciones del colectivo, y las frases son cortas.
- Al perder se dice siempre **PARTY OVER**, nunca GAME OVER.
- Límites: sin violencia gráfica, sin estética de casino, sin copiar otros juegos, y con los menores no se bromea (en NomeNoConEso siempre se les deniega la entrada, con una frase seca).

### 4.2 Paleta y tipografía
Son los tokens reales de la app:
- Fondo `#101011`, blanco cálido `#f3f0e8`, gris `#aaa9a3`, línea `#38383c`.
- Ácido `#d9ff6b` (acción y Arcade), rosa `#ff789f`, violeta `#ba9efa`, agua `#8dd8c8`.
- En los hilos también se habla de acentos «coral, menta, lila, lima» y de la flor coral del chaleco del encargado.
- Títulos densos con carácter: hoy Impact, Arial Narrow o Arial.
- En el hilo 04 Tronco **rechazó un cambio de colores y tipografía**. Pidió volver al diseño gráfico original, la tipografía propia y el estilo de ARCADANZ con sus portadas e historias.

### 4.3 Marca
- El símbolo es la **flor blanca de seis pétalos**, que no se deforma.
- El wordmark de **ARCADANZ** es «ARCA» pixelado, la flor en medio y «DANZ» con letra fluida (`public/brand/arcadanz-wordmark-v2.webp`, aprobado el 12/11).

### 4.4 Lenguaje de las portadas
- Ilustración 3D cartoon con comedia y perspectiva dinámica.
- Cabina o estudio industrial, hormigón, altavoces, luz magenta y amarillo ácido, y objetos musicales que parecen vivos.
- La referencia es la portada de Jack.
- Las portadas aprobadas **no se regeneran ni se cambian sus protagonistas**: Jack, Groove Ninja, Collecta («Día de cobro», 15/11) y DANZPORTER (`danzporter-cover-v1.webp`, 16/11).
- Para juegos nuevos la dirección es 3D cartoon premium, como las portadas, con neones y humo. **Ni pixel art ni vóxel.** Esto lo decidió Tronco para Manager Heist.
- Para Collecta: 2D arcade moderno y premium, ni realista ni manga.

### 4.5 Lore compartido
**No hay un lore único escrito.** Lo que se repite entre juegos:
- el after o el club al cerrar (Collecta);
- el after podrido con zombis de resaca (Manager Heist, nueva dirección);
- el afterparty postapocalíptico (pinball de Jokano);
- el estudio del colectivo (Idle Studio).

Enemigos recurrentes: **haters**, **resacas**, **managers dudosos**, porteros o bouncers, la crew que se cuela, influencers, fact-checkers (Vinyl Survivors) y la rata del estudio.

Objetos recurrentes: vinilos, el cable Jack, flightcases, altavoces, la flor, la factura del cierre, sellos y pasaporte.

Si se quiere unificar todo en un universo, eso está abierto: lo pregunta la plantilla del colectivo.

### 4.6 Personajes
- **Yeppo:** la mascota. Es **una flor animada** basada en la flor de la bolsa de DANZFLOR. Tronco lo pidió en el hilo 04: «no es un Pokémon», menos cursi, una mezcla entre lo anterior y algo más vivo, que en el futuro sea una IA interactiva y no un salvapantallas.
  - Hoy pasea, habla con frases cortas y vacilonas, pone retos opcionales (Yeppo Challenge) y recoge sugerencias.
  - Hay que respetar el movimiento reducido.
- **El encargado de seguridad:** protagonista de DANZ Collecta, basado en el chico de la portada (Tronco pasó su foto). Rapado con degradado, barba, cejas marcadas y cara seria. Lleva chaleco táctico oscuro con la flor coral delante y detrás, pinganillo y botas. No tiene nombre.
- **El rival de Collecta** (propuesta del bot, con hoja de diseño hecha): portero de un club rival, rubio platino, gafas de sol de noche, bomber verde ácido con un vinilo de emblema, cadena de oro y sonrisa chulesca. **Tronco no lo ha aprobado de forma explícita**: la dirección del refresh sí está aprobada, este personaje no.
- **Jokano:** sale en el Idle Studio (taller Los Primos o impresión 3D, con Mike) y es el protagonista del pinball. Su aspecto depende de una foto que Tronco tiene que pasar.
- **Ron0:** DJ protagonista propuesto en Vinyl Survivors y del plataformas Mix & Miles (hilos 07 y 11). En el pinball se ofreció como opción «Ron0 u otro».
- **Los DJs de DANZ IN:** suenan en Groove y tienen cameos en NomeNoConEso (borrador).
- **Las caras de Jack:** 10 personas con 3 expresiones cada una, sin nombres en la app.

---

## 5. Juegos e ideas, uno por uno

Estados: **PUBLICADO** (en `main` y en la app) · **EN PR** (código en una rama o PR sin fusionar) · **DISEÑO** (definido pero sin código) · **SOLO IDEA** · **ELIMINADO**.

### 5.1 LA QUE HAS LIAO, JACK (Snake) · PUBLICADO
- **Qué es:** una serpiente que es un cable de sonido con la flor en la cabeza. Recoges caras de la crew.
- **Modos:** CLÁSICO y LABERINTO, con 12 recorridos: Islas, Pasillos, Circuito, Puentes, Órbitas, Cruces, Columnas, Túneles, Anillos, Zigzag, Patchbay y Backstage. Tablero de 19×19.
- **Competición:** semanal en el servidor, con replay validado. El podio de Clásico da DANZPOINTS.
- **Decisiones:**
  - El nombre lo eligió Tronco. Se descartaron «JACK A LA FUGA» y «DANZ Snake».
  - En el marcador aparece «LIAO, JACK».
  - La portada aprobada (un cable que se escapa de una mano) es la referencia de estilo de todo ARCADANZ.
  - Hay que quitar los recuadros raros de las caras (PR #29).
- **En PR:** #81 y #71 (gestos con varios dedos), #97 (partículas y vibración: kit de jugo).
- **Intro:** hay una versión v4 que espera la decisión de Tronco.
- **Abierto:** el lore (¿quién es Jack?) y el modo Power o Infinito independiente, propuesto en el hilo 13.
- **Hilos:** 01 (intro), 13 (mejoras), 15 (citado).

### 5.2 GROOVE NINJA · PUBLICADO
- **Qué es:** cortar vinilos al ritmo («guiño a Fruit Ninja»).
- **Modos:**
  - **VINYL CUT:** 60 s, cinco vidas, combos hasta ×4. Especiales: ORO ×3, HIELO, COMBO DISC y SPLIT DISC. Armas: KATANA, DOBLE FILO y AGUJA.
  - **SCRATCH SESSION:** patrones BABY SCRATCH, LONG PULL, DOUBLE TIME y BOOMERANG.
  - **DESTRUCCIÓN:** 8 armas, entre ellas el «Guante de Yeppo».
- **Música protegida** (decisión del 16/11): Funky Fiesta y WTHIMH suenan con acceso protegido y sin descarga. No se suben audios ni enlaces firmados a Git.
- **Decisiones:**
  - **Hilo 03:** Tronco dijo que «gráficamente no se ve como debería» y que el 2.º modo (Scratch) «no es fácil ni intuitivo». Grok propuso un trazo fantasma y feedback PERFECTO/CERCA. Esos archivos nunca llegaron al repo por el 403.
  - **Hilo 13:** queja de que Vinyl Cut se repite y de que Scratch no engancha. Tronco quiere algo «más tipo Guitar Hero».
  - **Hilo 17:** Groove con el BPM real de los temas sería el mayor «wow» del Arcade.
  - Construir canciones por capas queda en pausa hasta tener los stems.
- **Drop Defense** se iba a meter aquí como 4.º modo, pero Tronco lo movió a Collecta (hilo 03).
- **En PR:** #47 (Scratch con notas anticipadas), #69 y #88 (nuevos patrones de oleadas y gestos estables), #51 (intro de 5 s antes de la cabina, versión aprobada por Tronco).
- **Hilos:** 01, 03, 13, 17.

### 5.3 DANZ COLLECTA · PUBLICADO (y con un refresh premium aprobado)
- **Premisa:** «DÍA DE COBRO / EL ENCARGADO». Se acaba el set y el encargado cierra el club: pone orden, cobra y no deja que la crew se cuele. Las facturas son ficción.
- **Modos actuales:**
  - **ARENA:** «Cierre de pista», 1 vs 1, tipo Bomberman, con discos, flightcases y altavoces.
  - **PERSECUCIÓN:** «Pasa el marrón», 1 vs 1. Pillas al rival, le pasas la factura y te escapas.
  - **CONTRA LA MÁQUINA:** «Último turno», contra «la crew automática».
- **Controles:** cada jugador está en un extremo del móvil y elige flechas o joystick.
- **Historia:**
  - Arena (con Gemini) y Pilla-Pilla eran juegos aparte, y se unieron en Collecta el 15/11.
  - Grok rediseñó Collecta en el hilo 05, en una parte que hoy no se ve en la captura: 2D limpio, encargado basado en la foto, Arena tipo Bomberman, Persecución y «Último turno».
- **Refresh premium:**
  - Aprobado por Tronco: hero y rival en 2D arcade premium, Arena cenital tipo Bomberman con efectos contenidos, Persecución más limpia y el mismo look en Último turno.
  - La hoja de diseño existe (`collecta-sheet-v2.jpg`, 17/11) y Tronco ordenó implementarla.
  - **El trabajo en la nube que lo iba a hacer falló antes de crear la rama**, y espera a que Tronco diga si se relanza.
- **Modos nuevos dentro de Collecta:**
  - Drop Defense (5.8): en PR.
  - NomeNoConEso (5.7): esqueleto en PR.
  - Deducción social, «AFTER / SABOTAJE» o «VINYL HEIST» (hilo 02): solo idea.
- **En PR:** #68 (identificar al perseguidor), #82 (joystick multitáctil).
- **Intro:** versiones A y B, sin elegir.
- **Hilos:** 01, 02, 03, 05 (parte que falta), 08.

### 5.4 DANZPORTER (antes DANZ Kart Mini) · PUBLICADO, con una gran revisión en PR
- **Qué es:** carreras de reparto nocturno en el muelle. Lema: «EL ÚLTIMO FERRY ES TUYO».
- **Modos:** CREW RACE, CONTRARRELOJ y DUELO LOCAL.
- **Contenido:** circuitos AFTERHOURS DOCK y BACKSTAGE RING; garaje con chasis CLUB 01, SPRINT y TRANSPORT, ruedas y pinturas; boxes, daños y grúa; cámaras superior, Rally y primera persona.
- **Decisiones:**
  - El nombre y la portada los aprobó Tronco el 16/11 (es su foto).
  - Las vistas **PISTA COMPLETA** y **PRIMERA PERSONA** están aprobadas (PR #94).
- **En PR:**
  - **#56:** cabezones y estudio «Crea tu cabezón», con la cabeza a 2,12× y el dibujo hecho en el dispositivo. Tiene la CI en verde e incluye el arreglo del test de Groove. La migración Supabase **no está aplicada**. La generación con IA necesita los secretos `KART_HEAD_API_KEY`/`KART_HEAD_API_URL` y que Tronco elija proveedor.
  - **#89 a #96:** tercer circuito MIDNIGHT CHICANE, chasis rediseñados, showroom 3D, obstáculos y cámara de persecución dinámica, a partir de la revisión de Tronco del 27/11 con 4 capturas (issue #91).
  - **#70 y #80:** pedales multitáctiles.
- **Intro:** versiones A y B, sin elegir.
- **Hilos:** 01; casi todo lo demás se hizo fuera de Grok.

### 5.5 DANZ IDLE STUDIO · PUBLICADO (arte de prototipo)
- **Qué es:** un «hotel de gestión», como pidió Tronco en el hilo 09: un muñeco que se mueve por el estudio, empieza con una estación y la mejora con moneditas; los niveles cuestan cada vez más y desbloquean otras estaciones.
- **Estilo:** isométrico tipo Habbo («Jabotel», dice Tronco).
- **Moneda:** Loops, sin valor real y sin DANZPOINTS.
- **Espacios:** Música, Moda, Vídeo, Los Primos (impresión 3D), Sello, Seguridad, Cocina y Sala, más Envíos.
- **Malo:** la rata. **Seguridad:** Mono. Cada espacio tiene sus personajes y frases (ver plantilla).
- **Historia:**
  - Grok lo hizo en el hilo 09: primero un panel y después el taller con el muñeco.
  - Según las notas del 16/11, el commit local de Grok (`fe185e7`) nunca llegó a GitHub y se perdió.
  - Después se integró con los PR #48 y #49 (16/11).
  - Hoy es jugable en `?juego=idle-studio`. El arte es de prototipo.
- **Abierto:** **fusionarlo con Festival Builder / Tiny After** (hilo 02, fase Estudio más fase After). Grok lo recomendó y Tronco no ha respondido.
- **Hilos:** 02, 09.

### 5.6 SEIS (de la mañana, qué jaleo) · EN PR
- **Qué es:** un juego de cartas de descarte rápido. No es un clon de UNO. Se juega contra 1 a 3 IA.
- **Diseño:** se hizo en el hilo 13, en la parte que falta de la captura; está en `ANEXO-SEIS-…`.
- **Decisiones de Tronco:**
  - El nombre es SEIS, con el subtítulo pequeño.
  - «Backstage» pasa a llamarse **Panas**, y «Cable cruzado» pasa a ser **Jack cruzado**.
  - Yeppo ayuda con un nivel de intervención media.
  - **Regla SEIS estricta:** si no la dices con una carta, robas 2 y Yeppo te vacila.
  - Panas: el jugador elige protección o intercambio.
  - Cartas nuevas: Vinilo rallado, Luz estroboscópica, Flor blanca y Panas fuerte.
  - Se quita «Jack suelto».
  - «Primero el funcionamiento, luego la parte gráfica.»
- **Código: hay dos ramas.**
  - **PR #50** (`feature/seis`, del bot): mazo de 90 cartas, IA fácil, normal y difícil, y modo con premio validado en el servidor.
  - **`feat/seis-game`** (16/11, sin PR): motor básico.
  - Tronco pidió (t52u) integrarlo, todas las especiales, una IA más lista, la regla estricta y más frases de Yeppo. **No ha dicho en qué rama seguir.**
- **Hilos:** 13 (falta) y anexo.

### 5.7 NomeNoConEso · EN PR (solo el esqueleto)
- **Qué es:** el modo de puerta de DANZ Collecta, tipo Papers, Please. Eres quien decide quién entra al after.
- **Origen:** hilo 08, con el nombre provisional After Queue / DANZ Door. Grok le puso un 9/10.
- **Tronco pidió primero definirlo todo** con test y la mayor batería de preguntas posible, y preguntó si iba dentro de Collecta o aparte (hilo 08). La respuesta de Grok no está en la captura.
- **El nombre NomeNoConEso y el diseño completo** vinieron después, en el chat con el bot (t54u): modo hub de Collecta, jefe de puerta, inspección, escáner, tipos de gente, objetos prohibidos, métricas, 5 noches, progresión, eventos y DANZPOINTS más adelante.
- **PR #57:** tipos, datos, firmas y plan (`docs/NOMENOCONESO_PLAN.md`). Está oculto (`NOMENOCONESO_VISIBLE=false`).
- **El MVP jugable** se lanzó en la nube y **falló antes de subir nada**. Espera a que Tronco diga si se relanza.
- Los textos de gente, cameos y frases son un borrador del bot (ver plantilla).
- **Hilos:** 08, 02 (contexto).

### 5.8 DROP DEFENSE · EN PR (#85)
- **Qué es:** un tower defense rítmico. Colocas altavoces, luces y barreras de gente contra haters y resacas, y cada drop activa las defensas.
- **Recorrido:**
  - Grok lo propuso como 4.º modo de Groove y preparó archivos que no subió (403).
  - Tronco: **«Defense drop mételo en danzcollecta no en Groove»**.
  - Grok creó `feat/collecta-drop-defense` (commit `0f97148`) y la ruta `?juego=drop`.
  - El 23/11 Grok añadió más commits: recorrido en laberinto, máximo 10 defensas, niveles, economía de dinero y 2 evoluciones por defensa. Esas iteraciones no están en la captura del hilo.
- **El PR #85 lo hizo Tronco con Grok.** No tiene descripción y fallan los `browser-tests`.
- **Duración:** 10–15 min en la idea; 8–12 min en Collecta.
- **Abierto:** el nombre de las evoluciones y el escenario.
- **Hilo:** 03.

### 5.9 It's Mike's fault · EN PR (#86)
- **Qué es:** «juego independiente, esqueleto de tower defense», de Grok (23/11).
- Añade una tarjeta a `ArcadeChooser`. No tiene descripción y fallan los `browser-tests`.
- **No aparece en ningún hilo capturado.** Puede ser que Mike sea el de la crew (Los Primos), pero no está confirmado.
- Se solapa con Drop Defense: los dos son tower defense. **Hay que preguntar a Tronco qué es y si sigue.**

### 5.10 MANAGER HEIST · MVP PIXEL APARCADO (PR #52) y nueva dirección en DISEÑO
- **Hilo 14:** extracción más bluff. Entras en un after, coges botín de valor y sales vivo, aliándote o traicionando.
  - Tronco pidió **ampliar el universo**: no siempre managers ni vinilos.
  - Grok añadió facciones (bouncers, influencers, crews rivales, técnicos, resacas, groupies, suits y ecos de afters pasados), botín variado y extracciones móviles.
  - Escribió SPEC y DESIGN (anexos).
  - Tronco: «me fío de ti».
- **PR #52:** primer MVP en pixel art. **Tronco lo rechazó y está aparcado. No se toca salvo que lo pida.**
- **Nueva dirección (t50u y t51u, chat con el bot):**
  - Apocalipsis zombi con estética de club: el after se ha podrido, las resacas son zombis y los managers siguen haciendo tratos.
  - 3D cartoon estilizado y premium, como las portadas de ARCADANZ y los juegos de extracción cartoon. Neones, humo, cámara cenital. **Ni vóxel ni pixel.**
  - Se pidió un prototipo de una sala y una recomendación sobre un shooter en primera persona.
- **El prototipo en la nube falló sin publicar rama.** Espera a que Tronco diga si se relanza.
- **Shooter en primera persona zombi-club:** la recomendación del bot fue hacerlo como juego aparte en el mismo universo. Es solo una idea.
- **Ojo:** los anexos de Heist dicen «pixel art Metal Slug». Eso está **superado**.
- **Hilo:** 14.

### 5.11 TWO HANDS JOKANO (pinball) · DISEÑO
- **Hilo 12:**
  - Test 1 cerrado por Tronco: postapocalíptico o afterparty destruido; personaje visible más bola; 1 mesa completa; puntuación pura y highscore; multibola opcional; scoring arcade moderno (combos, chains, jackpots); todos los elementos de mesa; 1–2 modos; integración con todo (leaderboard, desbloqueos, vinilos/Groove); partidas de 3–5 min.
  - Antes, en el hilo 15, Tronco había dicho que de los clásicos solo le gustaba el pinball.
- **Documento** `ANEXO-TWO-HANDS-JOKANO-DESIGN.md`, escrito por el bot (t53u): física, scoring, jackpots, modos Jokano Rage y 3D Chaos, power-ups y desbloqueos.
  - **Los power-ups y varios nombres los propuso el bot sin aprobar.**
  - El nombre «Two Hands Jokano» no sale en la captura del hilo 12.
- **Pendiente:** el arte de la mesa y el aspecto de Jokano, que depende de una foto de Tronco.

### 5.12 Vinyl Survivors · DISEÑO (inicial)
- **Qué es:** Vampire Survivors en un after, con estilo Metal Slug, Ron0 o un DJ del colectivo como protagonista, haters, resacas y fact-checkers.
- **Tronco:** vista cenital con un pool de 6–7 habilidades, de las que se cogen 3 por partida y van subiendo de nivel. Oleadas cada vez mayores. Propuso **otro hilo para un Metal Slug clásico** o juntar los dos modos.
- **Estado:** solo hay una primera tanda de preguntas, y la última (sobre la cámara) está sin responder.
- Según el diseño de Manager Heist, los vinilos de Heist darían poderes aquí.
- **Hilo:** 11.

### 5.13 Catan del Festival · DISEÑO (sin responder)
- **Recursos propuestos:** Energía, Dinero, Vinilos, Influencia y Material.
- **El «ladrón»:** seguridad, lluvia o un rival.
- **Estado:** Grok hizo un cuestionario en 10 bloques y después en formato test marcable, porque Tronco no ha jugado nunca a Catan. **No hay respuestas.** El último mensaje de Tronco, «Me refiero a este estilo», queda sin respuesta.
- **Hilo:** 16 (y 15, donde nació).

### 5.14 After Monopoly · SOLO IDEA (elegida para desarrollar)
- **Qué es:** propiedades del after (Main Stage, Chill Zone, Bar, VIP…), mejoras y cartas de evento.
- Tronco dijo «en este hilo vamos a empezar a desarrollar el after monopoly». Según las notas del 16/11, quedó una pregunta sobre los modos sin responder (solo vs IA / hotseat / online Supabase / asíncrono).
- **Hilo:** 15.

### 5.15 Deducción social en el after (After Among Us) · SOLO IDEA
- **Qué es:** un modo de Collecta, «AFTER / SABOTAJE» o «VINYL HEIST», de 4 a 8 jugadores con 1 o 2 saboteadores y partidas de 8 a 12 minutos.
- **Estado:** pendiente del «sí» de Tronco.
- **Hilo:** 02.

### 5.16 Festival Builder / Tiny After · SOLO IDEA (fusión propuesta con Idle Studio)
- Ver 5.5. **Hilo:** 02.

### 5.17 Plataformas 2D Mix & Miles / Ron0 · DISEÑO y prototipos fuera del repo
- **Qué es:** un plataformas tipo Mario en el universo DANZ, en Vanilla JS. El plan inicial era pasarlo a PWA con ChatGPT.
- **Según las notas del 16/11:** muchas versiones HTML, documentos de diseño de la v5 a la v21, problemas con los assets y una última pregunta sobre el poder del casete o CD. **Casi todo esto falta en la captura.**
- El repo lo considera un proyecto propio de Tronco en Grok: **no se rehace desde otras herramientas.**
- **Hilo:** 07.

### 5.18 Intros animadas y splash · EN PR
- **Hilo 01:**
  - Tronco rechazó los clips de 3 s genéricos.
  - Quiere una transición **elegante y simpática** desde la flor del logo hasta la **portada real** de cada juego, sin música «family friendly» y con un golpe de sonido tipo splash.
- **Estado:**
  - Groove v3 aprobada (PR #51; se ve una vez por sesión).
  - Jack v4, Collecta A/B y DANZPORTER A/B esperan la elección de Tronco (issue #53).
  - La intro común de ARCADANZ está descartada.
  - El cierre de cada intro funde a blanco con la flor y el logo oficiales.
- **Splash de arranque (PR #55):** espiral líquida de 1,9 s, en un prototipo aislado. Espera la aprobación de Tronco antes de tocar el arranque real.

### 5.19 Otras ideas en los hilos (SOLO IDEA)
- **PULSE** (hilo 09): ritmo en 4 carriles, 1 minuto, con un módulo `danz-bridge` como contrato. Se quedó en propuesta y el hilo derivó al Idle Studio.
- **Clásicos de Windows** (hilo 15): Buscaminas, Solitario, JezzBall, SkiFree… Tronco los rechazó todos salvo el pinball.
- **Juegos de mesa** (hilo 15): Risk Afterparty / Small World con crews, Carcassonne del After, Diplomacy, Power Grid / Sound Grid.
- **Hilo 13** (prompts para ChatGPT): DANZ BATTLE (DJ contra DJ), FASHION DROP, PASAPORTE RUSH, MEMORIA DE LA NOCHE, «Set Builder». Ojo: PASAPORTE RUSH y «Cabina en vivo» chocan con la regla de que la app no se usa durante la noche.
- **Conecta el Cable:** mencionado en el hilo de SEIS, sin desarrollar.
- **Diez ideas recuperadas** (`docs/ARCADANZ_ROADMAP.md`): DANZ Pinball, Break the Beat, Yeppo Invaders, Flor Blocks, Pong Collective, Backstage Maze, DANZ Dominó, Memoria de la Crew, Yeppo Pilla-Pilla (hoy Persecución) y DANZ Kart Mini (hoy DANZPORTER).

### 5.20 AFTER DROP · ELIMINADO
- **Qué era:** un runner rítmico con extracción (hilo 06). Hubo 4 prototipos HTML y Tronco los rechazó todos («no se acerca ni loco», «ahora ni funciona»).
- El bot llegó a abrir el PR #58 (17/11).
- **Tronco ordenó quitarlo por completo:** el PR #58 se cerró sin fusionar y la rama se borró. No queda nada en el repo. **No retomarlo.**

---

## 6. La app fuera de los juegos: propuestas de los hilos y su estado

**Hilo 04: rediseño.**
- Grok propuso, a partir de webs premiadas, una navegación inferior de 5 pestañas, un Inicio con «WE ARE DANZ.», un Pasaporte visual y un tono dark premium.
- Tronco:
  - Primero quiere ver una **maqueta** antes de cualquier cambio gráfico.
  - Hay que respetar los nombres: ARCADANZ, DANZ IN y DANZFLOR.
  - El Pasaporte le gusta, con un número de socio simple (00001).
  - Yeppo es una flor animada.
  - Quiere volver a los colores y la tipografía originales.
- **En el repo:** el PR #60 (19/11) trajo el Pasaporte editorial por páginas, la navegación reducida y el número de socio por orden de alta con el fundador #000001. El PR #64 (borrador) sigue con el Pasaporte inmersivo y la tarjeta de socio.

**Hilo 13: estudio de la app.**
- El informe de ChatGPT (PWA v51) no se capturó.
- Grok preparó prompts para música real e hilo musical, Vinyl Cut más vivo, Scratch tipo Guitar Hero, seguridad (denuncias, códigos de recuperación de MFA, límite de peticiones, exportar y borrar la cuenta) y comunidad (favoritos, «Aquí salgo yo», notificaciones).
- Después añadió una batería de juegos y funciones: Historias de la noche, Wall of Fame, Retos DANZ IN, Aftermovie y Marketplace de DANZPOINTS.
- Hecho en el repo: música protegida (PR #46) y Combo/Split discs (PR #28).

**Hilo 17: «que se note el upgrade».**
- Tronco eligió los puntos 1 (feel nativo), 3 (galería premium) y 5 (Yeppo más vivo).
- Lo hizo el bot en el PR #45 (`feature/premium-feel`, fusionado el 16/11).
- Quedan pendientes: Groove con el BPM real y «Mi DANZ» (una línea de tiempo personal).

**Hilos 05, 10 y 17: GitHub y conectores.**
- Grok solo estaba autorizado por OAuth, no instalado como GitHub App. Por eso daba 403.
- Hacer el repo privado no le quita el acceso a Grok (hilo 10). **Hoy el repo es público.**

---

## 7. Cronología de decisiones clave

Fechas en hora de Madrid. Las de los hilos de Grok no llevan fecha en la captura y se sitúan por el repo.

| Fecha | Qué pasó |
|---|---|
| 08/11 | Se crea el repositorio en GitHub. |
| 10/11 | La PWA se abre al público. La web del colectivo queda desactivada en la app. |
| 12/11 | Nombre y logo ARCADANZ. Jack recibe su nombre definitivo. Se escribe la memoria de marca para Grok. |
| 13/11 | Primer PR (#1, portadas y entrada inmersiva). DANZERS piloto con sello y 1.000 DANZPOINTS. Yeppo y la radio (PR #2 a #8). |
| 14–15/11 | Yeppo crece (PR #9 a #25). Arena DANZ (PR #27; Gemini preparó después una mejora gráfica de Arena). Collecta: portada «Día de cobro», Persecución, lore y Último turno (PR #30 a #32). Kart Mini (PR #34 y #35). |
| 16/11 | DANZPORTER: nombre, portada, conducción y cámaras (PR #36 a #42). Groove con secuencias y música protegida (PR #43 a #46). Premium feel (PR #45, bot). Idle Studio entra en el repo (PR #48 y #49). El bot abre SEIS (#50), la intro de Groove (#51) y Heist pixel (#52). |
| 17/11 | Splash (#55), cabezones (#56), NomeNoConEso (#57) y AFTER DROP (#58). El #58 se cierra sin fusionar ese mismo día: Tronco ordena eliminar AFTER DROP por completo y la rama se borra. Diseño de Two Hands Jokano. Hoja de diseño de Collecta. |
| Tras el 17/11 (sin fecha exacta registrada) | Tronco rechaza el MVP pixel de Heist (#52, aparcado) y fija la dirección zombi-club en 3D cartoon. Aprueba el refresh premium de Collecta y pide el MVP de NomeNoConEso y el trabajo de SEIS. |
| 19/11 | Pasaporte editorial, navegación reducida e Instagram (PR #59 y #60, fusionados). |
| 20/11 | Reglas contra regresiones para todas las IA (issues #61 y #62, commit `d281e1d`). Es **el último cambio en main**. |
| 22–23/11 | PR de borrador de QA, controles táctiles y pruebas E2E (#64 a #84). Grok sube Drop Defense (#85) e It's Mike's fault (#86). |
| 27/11 | Gran revisión de DANZPORTER con las capturas de Tronco (issue #91; PR #87 a #96, más el candidato de integración #87). Claude abre el #97. |
| 27–28/11 | Plantilla para el colectivo y este paquete para Claude. Los trabajos en la nube de Collecta premium, NomeNoConEso MVP y Heist proto **fallaron** y esperan a Tronco. |

---

## 8. PR abiertos (28/11/2026)

Ninguno está fusionado. **Nada se fusiona sin el OK de Tronco.** «CI» indica el resultado de los checks de GitHub en el último commit; «browser-tests ✗» significa que fallan las pruebas de navegador (móvil, tablet y escritorio). En los PR #55 y #57 el fallo conocido es la prueba de proporción de Groove (`tests/e2e/groove.spec.ts`), que arregla el #56. En el resto no se ha revisado la causa.

| PR | Qué es | Rama | CI |
|---|---|---|---|
| #47 | Scratch: notas anticipadas y precisión | work/scratch-readable-pulse | ✓ |
| #50 | SEIS en ARCADANZ (bot) | feature/seis | ✓ (solo 1 check) |
| #51 | Intro de Groove Ninja (aprobada v3) | feature/arcade-intros | ✓ |
| #52 | Manager Heist MVP pixel. **Rechazado y aparcado** | feature/manager-heist | ✓ |
| #55 | Splash en espiral líquida (prototipo aislado) | feature/splash-liquid-spiral | browser-tests ✗ |
| #56 | Cabezones y «Crea tu cabezón» (arregla el test de Groove). **Recomendado fusionar el primero** | feature/kart-bigheads | ✓ |
| #57 | NomeNoConEso, solo el esqueleto | feature/collecta-nomenoconeso | browser-tests ✗ |
| #64 | [BORRADOR] Pasaporte inmersivo y tarjeta de socio | fix/passport-immersive-swipe-20261119 | ✓ |
| #68 | [BORRADOR] Collecta: perseguidor y sprint | feature/collecta-chase-readability-20261122 | browser-tests ✗ |
| #69 | [BORRADOR] Groove: patrones, teclado y gestos | feature/groove-pointer-stability-20261122 | browser-tests ✗ |
| #70 | [BORRADOR] DANZPORTER: estelas y pedal | feature/danzporter-speed-feedback-20261122 | browser-tests ✗ |
| #71 | [BORRADOR] Snake táctil y CI ARCADANZ | feature/snake-touch-safety-20261122 | browser-tests ✗ |
| #73 | [BORRADOR] AGENTS.md: ejecución por bloques | docs/long-autonomous-blocks-20261122 | browser-tests ✗ |
| #74 | [BORRADOR] Dependabot semanal | maintenance/dependabot-low-noise-20261122 | browser-tests ✗ |
| #76 | [BORRADOR] E2E de Cuenta y Pasaporte | fix/e2e-current-navigation-passport-20261123 | browser-tests ✗ |
| #77 | [BORRADOR] Visor de fotos por encima de la barra | fix/mobile-photo-viewer-nav-layer-20261123 | browser-tests ✗ |
| #78 | [BORRADOR] Yeppo no interrumpe Cuenta | fix/yeppo-account-uninterrupted-20261123 | browser-tests ✗ |
| #79 | [BORRADOR] Galería → Pasaporte (test) | fix/private-gallery-passport-test-20261123 | browser-tests ✗ |
| #80 | [BORRADOR] DANZPORTER: pedales multitáctiles | fix/kart-multitouch-pedal-ownership-20261123 | browser-tests ✗ |
| #81 | [BORRADOR] Jack: gestos con varios dedos | fix/snake-pointer-isolation-20261123 | browser-tests ✗ |
| #82 | [BORRADOR] Joystick al tocar otro botón | fix/versus-joystick-pointer-blur-20261123 | browser-tests ✗ |
| #83 | [BORRADOR] Integración QA (Cuenta, fotos y ARCADANZ) | integration/danz-mobile-qa-20261123 | ✓ |
| #84 | [BORRADOR] Yeppo: test del paseo | fix/yeppo-walkabout-visible-target-20261123 | browser-tests ✗ |
| #85 | Drop Defense en Collecta (Tronco con Grok, sin descripción) | feat/collecta-drop-defense | browser-tests ✗ |
| #86 | It's Mike's fault, tower defense (Grok, sin descripción) | feat/its-mikes-fault | browser-tests ✗ |
| #87 | [INTEGRACIÓN] DANZ estable: Cuenta, galería, Groove, Kart, Snake y Collecta | integration/arcadanz-stable-20261127 | ✓ |
| #88 | [BORRADOR] Groove: dos patrones más (sobre el #87) | feature/groove-two-new-wave-silhouettes-20261127 | ✓ |
| #89 | [BORRADOR] DANZPORTER: circuito MIDNIGHT CHICANE | feature/danzporter-midnight-chicane-20261127 | ✓ |
| #90 | [BORRADOR] DANZPORTER: chasis 2D/3D y circuito diferenciado | feature/danzporter-visual-identity-20261127 | ✓ |
| #92 | [BORRADOR] DANZPORTER: showroom 3D en el garaje | feature/danzporter-showroom-3d-20261127 | ✓ |
| #93 | [BORRADOR] DANZPORTER: obstáculos jugables | feature/danzporter-trackside-hazards-20261127 | ✓ |
| #94 | [BORRADOR] DANZPORTER: cámara de persecución dinámica | feature/danzporter-follow-camera-20261127 | ✓ |
| #95 | [INTEGRACIÓN] DANZPORTER: obstáculos y persecución | integration/danzporter-hazards-camera-20261127 | ✓ |
| #96 | DANZPORTER: cámara de seguimiento integrada | feature/danzporter-integrado | ✓ |
| #97 | [BORRADOR] Login en la propia preview (#67), kit de jugo, Jack y Yeppo (Claude) | claude/danz-apo-analysis-nfzou2 | browser-tests ✗ |

**Ramas sin PR que importan:** `feat/seis-game` (SEIS alternativo, 16/11).

**Cerrados que importan:** #58 AFTER DROP, cerrado sin fusionar y con la rama borrada.

---

## 9. Issues abiertas en GitHub

- **#91** DANZPORTER: rediseño integral (identidad 3D, cámaras, circuitos con personalidad).
- **#75 [P0]** Aislar las regresiones E2E de Cuenta y Pasaporte antes de integrar ARCADANZ.
- **#72** Auditoría de juegos del 22/11 (PR #68 a #71).
- **#67 [P0]** Android abre la PWA antigua al seguir la URL de una preview. El #97 lo arregla.
- **#66** Dirigir cada tarea al nivel de IA correcto y evitar costes duplicados.
- **#65** Login real en la versión de pruebas.
- **#63** Auditoría de herramientas, IA y calidad (P0, P1, P2).
- **#62 y #61** Regla permanente de no regresiones para todas las IA.
- **#54** ARCADANZ: pulido inmersivo, Groove a pantalla completa y DANZPORTER (colisiones y gráficos).
- **#53** Intros: versiones pendientes de elegir.

---

## 10. Decisiones pendientes de Tronco

1. **Fusiones.** Ningún PR está fusionado desde el 20/11. Se recomienda empezar por el **#56**, que arregla la prueba de Groove que pone en rojo otros PR. También hay que decidir qué hacer con los candidatos de integración #83, #87 y #95.
2. **Relanzar o no** los tres trabajos que fallaron: el refresh premium de Collecta, el MVP de NomeNoConEso y el prototipo zombi-club de Heist. Cada intento consume uso.
3. **SEIS:** seguir en el PR #50 o en `feat/seis-game`.
4. **El rival de Collecta:** aprobarlo o abrirlo al colectivo.
5. **Intros:** elegir Jack v4, Collecta A/B y DANZPORTER A/B. Aprobar el splash #55.
6. **Cabezones:** aplicar la migración, elegir proveedor de IA y poner los secretos, o quedarse con el dibujo local.
7. **Drop Defense (#85) e It's Mike's fault (#86):** qué es cada uno, si siguen y cómo encajan, porque los dos son tower defense.
8. **Idle Studio más Festival Builder:** fusionarlos o no.
9. **Juegos en diseño sin respuestas:** Catan (cuestionario), After Monopoly (modos), Vinyl Survivors (cámara y siguientes tandas), deducción social (sí o no) y NomeNoConEso (las preguntas del hilo 08).
10. **Material que falta:** foto de Jokano, fotos y permisos de la crew, stems y audios, paleta y tipografía oficiales, y las referencias del hilo 04 (foto de la bolsa y pasaporte).
11. **Yeppo como IA interactiva:** aplazado. Primero, presencia y animación.

---

## 11. Reglas de trabajo (cualquier IA, también Claude)

Salen de `AGENTS.md`, de las issues #61 y #62 y de lo que Tronco ha dicho en los hilos y en el chat.

1. **Nunca fusionar ni tocar `main` ni producción** sin la aprobación expresa de Tronco tras probarlo en el móvil. Todo va en una rama con commits pequeños y un PR.
2. **Proteger lo que funciona.** Leer el código y las decisiones antes de editar. No sustituir archivos enteros sin revisar las diferencias. No arreglar un fallo rompiendo otra cosa.
3. **Verificar.** Correr `npm run build`, `npm test` y Playwright cuando proceda. Separar lo implementado, lo probado, lo desplegado y lo aprobado. Una compilación correcta no demuestra que funcione en el móvil. No afirmar que algo se probó en un dispositivo físico, que se midieron los FPS o que el online funciona si no se ha hecho.
4. **Datos y seguridad.** Revisar RLS y migraciones antes de tocar perfiles, Instagram, fotos, puntos, sellos o cuentas. Las claves solo van en el servidor, nunca en Vite, Git ni el chat. Los juegos no dan puntos desde el cliente.
5. **Portadas y protagonistas aprobados no se cambian.** Respetar los nombres de marca y de sección.
6. **Cómo trabaja Tronco:**
   - Quiere **primero definir** con cuestionarios **tipo test marcable** (letras A, B, C…), con la mayor batería de preguntas posible, nunca de dos en dos, y después desarrollar.
   - Pide maqueta o boceto antes de cualquier cambio gráfico.
   - Confía en el criterio de prioridad de la IA, pero quiere propuestas antes de cambios grandes.
   - Quiere el **mínimo trabajo manual**: enlaces directos y conectores antes que copiar y pegar (preferencia del PR #97).
7. **Música protegida:** no se suben audios, copias ni enlaces firmados al repo.
8. **Hilos de Grok:** solo lectura. Nadie los modifica ni los «absorbe». Si alguna vez hubiera que escribir en uno, irá firmado como Danz Collective Dev.
9. **No inventar.** Ni datos de personas, ni decisiones, ni estados. Si falta algo, se pregunta a Tronco.
10. **Al proponer juegos nuevos,** reutilizar los juegos que ya existen si encaja («sin generar otro juego con pocas funcionalidades», hilos 02, 03 y 08).

---

## 12. Huecos y contradicciones detectados

**Huecos de la captura**
- **Capturas cortadas.** Casi todos los hilos terminan tras el 4.º mensaje de Tronco. Hay pruebas de que falta el final en:
  - **03:** faltan las iteraciones del 23/11, que sí están en el repo.
  - **05:** falta el rediseño de Collecta.
  - **07:** faltan las versiones de Mix & Miles y los documentos v5 a v21.
  - **08:** faltan las 16 preguntas y la del nombre.
  - **09:** falta el Idle Studio completo y el commit perdido.
  - **10:** falta la creación del proyecto en Linear (DAN-5 a DAN-25).
  - **13:** falta el diseño de SEIS; hay copia parcial en el anexo.
  - **15:** falta la respuesta a After Monopoly.
  - Pueden estar cortados también el **12** (pinball: falta de dónde sale el nombre «Two Hands Jokano») y el **16** («Me refiero a este estilo» sin respuesta).
- **Dos hilos que existían el 16/11 ya no aparecen en el proyecto:**
  - «Ideas para juegos y conexión con Codex» (`?chat=e3cb5a9d-b3c4-4875-a631-322dc66b623d`): tandas de ideas y mejoras para fiestas de un solo escenario (sellos, merch, entradas tipo Eventbrite).
  - «Recuperar conexiones GitHub en nuevo proyecto ChatGPT» (`?chat=2e25f1a0-9af7-47e9-b633-85acae8b2a16`): una sola conversación sobre conectores a nivel de cuenta.
  - Puede que se hayan movido o borrado. No se han leído ahora.
- **Adjuntos y medios que no están:**
  - el pasted-text.txt del hilo 07;
  - el informe de ChatGPT del hilo 13;
  - las capturas de pantalla de Tronco en los hilos 05 y 16;
  - las imágenes, vídeos y HTML que generó Grok (hilos 01, 04, 06, 11 y 14), que solo quedan como descripción.

**Contradicciones o cosas desactualizadas**
1. **Idle Studio:** los hilos 02 y 09, igual que `docs/ARCADANZ_IDENTIDAD.md` y el doc de marca del 12/11, dicen que es «Próximamente» o que no está implementado. **Hoy es jugable en `main`** (PR #48 y #49).
2. **Manager Heist:** el hilo 14 y los anexos dicen pixel art Metal Slug. **La dirección vigente es zombi-club en 3D cartoon**, y el PR #52 en pixel está aparcado.
3. **Drop Defense:** en el hilo 03 empezó como modo de Groove; la decisión final es Collecta. La duración pasó de 10–15 a 8–12 min. El PR #85 tiene más funciones (laberinto, niveles, evoluciones) de las que aparecen en la captura.
4. **It's Mike's fault (#86)** no sale en ningún hilo capturado y duplica el género de Drop Defense.
5. **Número de socio:** Tronco pidió algo simple, «00001» (hilo 04). El repo muestra el fundador como #000001 (seis cifras, PR #60).
6. **SEIS** tiene dos implementaciones paralelas (#50 y `feat/seis-game`).
7. **Two Hands Jokano:** el documento lo marca «LOCKED», pero en el hilo solo hay respuestas del Test 1. El resto lo propuso el bot.
8. **El repo es público.** En el hilo 10 Tronco hablaba de hacerlo privado y Grok le dijo que podía. Sigue siendo público.
9. **Grok y la escritura en GitHub:** en los hilos 03, 05 y 17 Grok no podía escribir (403). El 23/11 ya hizo commits.
10. **La tarjeta de Collecta** en la biblioteca dice «Arena + Persecución», pero el juego tiene tres modos (falta Último turno).
11. **El nombre:** los hilos 01 y 13 dicen «Dance Collective» y «dancecollective.com». Lo correcto es **DANZ Collective** y danzcollective.com.
