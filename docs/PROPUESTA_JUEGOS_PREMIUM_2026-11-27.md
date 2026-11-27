# ARCADANZ premium — auditoría y propuesta juego por juego

**Fecha:** 27/11/2026 · **Rama:** `claude/danz-apo-analysis-nfzou2`
**Petición del propietario:** continuar el trabajo de Codex, resolver primero los
P0 y llevar los juegos a una sensación «mega premium», sobre todo en gráficos y
jugabilidad. Primero opciones gratuitas; de pago solo si no hay alternativa y con
coste bajo.

## 0. Cómo se ha auditado (y qué no)

- Compilación local de `main` + arreglo #67, servida con `vite preview`.
- Capturas Playwright/Chromium en Pixel 7 emulado con WebGL por software
  (SwiftShader). Capturas en `docs/evidence/2026-11-27-auditoria-juegos/`.
- Lectura del código de cada motor y de las ramas de Grok y Cursor.
- **No probado:** teléfono físico, FPS reales, vibración, audio escuchado,
  rendimiento de GPU. El contador de `requestAnimationFrame` (61/s en todos)
  es de navegador sin cabeza y **no** equivale a FPS en móvil.
- **Hilos de Grok:** no hay acceso desde esta sesión. Solo se han visto sus dos
  ramas en GitHub (PR #85 y #86). Para revisar sus hilos hace falta que el
  propietario comparta enlaces públicos de conversación o exporte el texto.
- **Hugging Face:** sin conexión disponible en esta sesión; no se ha podido
  consultar Spaces. Queda pendiente antes de generar arte con IA (regla de
  `AGENTS.md`).

## 1. Diagnóstico común (lo que más resta sensación premium)

1. **El tablero ocupa poco y el resto es negro plano.** Jack, Arena y
   Persecución usan entre el 35 % y el 45 % de la altura útil; el resto son
   mandos y cabeceras. El ojo percibe «prototipo».
2. **Formas vectoriales planas.** Arena y Persecución dibujan con
   `Phaser.GameObjects.Graphics` (rectángulos y círculos) sin luz, sombras ni
   texturas. Phaser 4.2.1 ya trae *filters* (glow, blur, color matrix),
   partículas, luces 2D y *render textures*: hoy pagamos 357 kB comprimidos
   de Phaser y usamos una fracción mínima.
3. **Falta «jugo» (game feel):** temblor de cámara, *hit-stop* de 40–80 ms,
   destellos, partículas al recoger/golpear, números que vuelan con física y
   transiciones entre ronda y resultado. Groove es el único que tiene parte.
4. **Textos que se pisan.** Groove muestra «MULTICORTE +100» duplicado y
   superpuesto con la puntuación; en Jack «0010 RÉCORD 0010» se lee como una
   sola cifra.
5. **Inconsistencias de marco.** Idle Studio se abre dentro del shell normal
   (cabecera y pie de la app) mientras el resto es inmersivo; además el botón
   de Yeppo «HABLA CONMIGO» tapa «Entrar al estudio».
6. **Derrota sin aviso.** Groove y Jack terminan en ~5 s si el jugador nuevo no
   toca nada. Un primer intento debe tener periodo de gracia o tutorial vivo.

## 2. «Kit premium» compartido (hacer una vez, sirve a todos)

| Pieza | Qué es | Coste |
| --- | --- | --- |
| `arcade/feel/juice.ts` | `shake(intensidad)`, `hitStop(ms)`, `flash(color)`, `popScore(x,y,texto)` con física, respetando movimiento reducido | Gratis, código propio |
| Partículas comunes | Chispas, confeti DANZ, humo, pétalos de la flor; presets Phaser y un equivalente Canvas para Jack | Gratis |
| Post-proceso | 2D: filtro *glow* + viñeta de Phaser 4. 3D: `EffectComposer` + `UnrealBloomPass` de `three/examples` (ya instalado, sin dependencia nueva) | Gratis |
| Sonido | SFX generados con jsfxr o sfxr.me (dominio público) y CC0 de Kenney/Freesound; mezcla con `GrooveAudio` existente | Gratis |
| Haptics | `navigator.vibrate` en golpes, capturas y meta (ya existe la base en PF01) | Gratis |
| Pantalla de resultado | Plantilla única animada: récord, medalla, «revancha» en un toque, compartir imagen del resultado | Gratis |
| Presupuesto de rendimiento | Tope de partículas, `devicePixelRatio` adaptativo (bajar a 1,5 si baja el ritmo), pausa al ocultar pestaña | Gratis |

## 3. Propuesta juego por juego

Cada juego indica: **visto hoy**, **gráficos**, **jugabilidad**, **primer bloque
recomendado** (3–4 mejoras, según `AGENTS.md`).

### 3.1 LIAO, JACK (Snake) — Canvas/React

**Visto hoy:** portada y menú de consola muy buenos. En partida, tablero
19×19 oscuro casi negro, cable fino y pequeño, mucho espacio vacío; la caída es
inmediata y sin aviso.

- **Gráficos:** cable con *glow* neón y degradado por segmento; rejilla de pista
  de baile que se ilumina al paso (latido a BPM); comida = objetos del club
  (vinilo, pulsera, chupito) con brillo; caras de la crew más grandes con
  emoción al comer; fondo con luces de sala desenfocadas (*parallax* lento).
  Tablero a ancho completo y mando más compacto.
- **Jugabilidad:** primera partida con 3 s de cuenta atrás y una «vida de
  cortesía»; *near-miss* (rozar pared) con cámara lenta 150 ms; combos por comer
  seguido; modo Fiebre cada 10 piezas (×2 y color).
- **Primer bloque:** tablero ampliado + glow del cable · comida temática con
  partículas · cuenta atrás y vida de cortesía · marcador legible.

### 3.2 GROOVE NINJA — React/Canvas

**Visto hoy:** el más rico visualmente (cabina, vinilos dorados, armas). Textos
de combo duplicados y superpuestos; se pierde en segundos sin tocar.

- **Gráficos:** vinilo cortado en dos mitades con giro y física (hoy se ve la
  pieza entera); estela del arma con color por arma; *bloom* suave en los
  dorados; luces de cabina que siguen el beat real de la pista (ya hay BPM).
- **Jugabilidad:** cola única de textos flotantes (un mensaje a la vez, sin
  solaparse); primera oleada lenta de demostración; *hit-stop* en multicorte;
  jefe final de 10 s en cada sesión («el vinilo rayado»).
- **Primer bloque:** corregir solapamiento de textos · corte en dos mitades ·
  oleada de gracia · *hit-stop* + vibración en multicorte.
- **No mezclar** con PR #88 (oleadas) sin revisarla antes.

### 3.3 DANZ COLLECTA — Arena / Persecución / Contra la máquina — Phaser

**Visto hoy:** reglas y mandos enfrentados funcionan; el tablero es plano,
personajes pequeños, Persecución está casi vacía (cuatro obstáculos).

- **Gráficos Arena:** baldosas con textura de escenario y sombras; flightcases
  con volumen (2,5D: cara superior + lateral); explosión de «disco» con onda
  expansiva, partículas y temblor; luces de color que barren el suelo.
- **Gráficos Persecución:** escenario real (barra, cabina, columnas, cuerdas
  VIP) con tiles CC0; estela del perseguidor; foco que sigue al «marrón»;
  «¡PASA EL MARRÓN!» con zoom y *hit-stop* al cambiar papeles.
- **Jugabilidad:** mejoras visibles en el suelo con icono; muerte súbita con
  pista que se cierra (encaja con «Cierre de pista»); revancha en un toque; el
  rival automático con tres niveles (fácil/normal/encargado).
- **Primer bloque:** tablero más grande (menos espacio muerto entre mandos) ·
  sprites 2,5D + sombras · explosiones con jugo · Persecución con 8–10 props.

### 3.4 DANZPORTER — Three.js (3D) + Phaser 2D

**Visto hoy:** el 3D low-poly ya tiene personalidad (karts, gradas, minimapa,
HUD claro). Faltan luz, cielo y entorno; la pista se ve gris y vacía.

- **Gráficos:** cielo nocturno con gradiente y estrellas; iluminación de focos
  y farolas (luces baratas con *lightmaps* o emisivos + bloom); polvo y chispas
  al derrapar; marcas de neumático; público y banderas instanciados
  (`InstancedMesh`, ya hay `batch3d.ts`); sensación de velocidad con FOV que
  se abre y líneas de viento.
- **Jugabilidad:** turbo por derrape largo (mini-turbo en tres niveles);
  *rubber-banding* suave en IA; fantasma del mejor tiempo guardado en local.
- **Coordinar** con PR #89, #90 y #92 (rediseño en curso, issue #91): no
  duplicar. Propuesta: revisar esas tres ramas antes de tocar el renderer.
- **Primer bloque:** cielo + bloom + emisivos · partículas de derrape y marcas
  · mini-turbo · fantasma local.

### 3.5 DANZ IDLE STUDIO — React/Canvas isométrico

**Visto hoy:** sala isométrica tipo «habitación» con buen encanto, editor de
personaje funcional. Se abre dentro del shell (no inmersivo); Yeppo tapa el
botón principal; tipografías y paneles parecen de otra app.

- **Gráficos:** pasar a marco inmersivo como el resto; animaciones *idle* de
  los operadores (teclear, bailar, cocinar); partículas de producto terminado;
  ciclo día/noche del club.
- **Jugabilidad:** recompensa al volver («mientras no estabas…» con
  animación); objetivos diarios locales; mejoras con antes/después visible.
- **Primer bloque:** marco inmersivo + ocultar Yeppo en juego · animaciones de
  operadores · pantalla de regreso.

### 3.6 Ramas de otras IA pendientes de decisión

| Rama / PR | Autor | Estado | Recomendación |
| --- | --- | --- | --- |
| #86 It's Mike's fault | Grok | Esqueleto de *tower defense*, 246 líneas | **Fusionar con #85 en un único juego**: comparten el mismo camino y la misma lógica casi línea por línea. Después, arte de torres/enemigos y oleadas en Phaser. |
| #85 Collecta Drop Defense | Grok | Esqueleto de *tower defense*, 213 líneas | Igual que #86. No abrir otra tarjeta de biblioteca: si va dentro de Collecta, como modo. |
| #50 SEIS | Cursor | 2.156 líneas, sin revisar desde 16/11 | Decidir si entra en la biblioteca; si no, cerrar y conservar la rama. |
| #52 MANAGER HEIST | Cursor | MVP jugable, 1.899 líneas | Igual. Prioridad por debajo de pulir los cinco juegos actuales. |
| #56 Cabezones DANZPORTER | Cursor | 1.259 líneas | Revisar junto al rediseño #89–#92; puede chocar. |
| #57 NomeNoConEso | Cursor | Modo de puerta para Collecta | Revisar tras el bloque Collecta. |

**Recomendación general:** antes de añadir juegos nuevos, llevar los cinco
actuales a nivel premium. Un juego pulido vende más la app que tres esqueletos.

## 4. Coste: gratis primero, después opciones rentables

**Gratis (cubre el 90 % de lo propuesto):**
- Código propio + Phaser 4 / Three.js ya instalados (filters, partículas,
  bloom, instancias).
- Recursos CC0: Kenney.nl (sprites, UI, SFX), Quaternius y Poly Pizza
  (modelos 3D low-poly), OpenGameArt (filtrar CC0), jsfxr para efectos.
- Hugging Face Spaces públicos gratuitos para bocetos o texturas (consultar
  primero, verificar licencia; nunca subir fotos privadas).

**Si algo no se puede resolver gratis (opcional, pedir autorización antes):**
- Un pack de assets de pago puntual en itch.io (normalmente 5–20 €) si se
  necesita un estilo coherente que no exista en CC0.
- Créditos sueltos de un generador 3D (p. ej. modelos de karts/personajes) solo
  si los low-poly CC0 no encajan; pago por uso, sin suscripción.
- Nada de GPU dedicada, endpoints de pago ni suscripciones.

## 5. Orden propuesto de bloques

1. **Bloque A (P0):** #67 arreglado en esta rama (falta configuración en
   Supabase/Vercel por el propietario) · validar en Android la PR #87 y
   fusionarla.
2. **Bloque B — Kit premium + Jack:** `juice.ts`, partículas comunes, pantalla de
   resultado y el primer bloque de Jack.
3. **Bloque C — Groove:** textos, corte en mitades, oleada de gracia, hit-stop.
4. **Bloque D — Collecta:** tablero ampliado, 2,5D, explosiones, props.
5. **Bloque E — DANZPORTER:** tras revisar #89–#92.
6. **Bloque F — Idle Studio** y decisión sobre ramas de Grok/Cursor.

Cada bloque: rama propia, `npm run build`, `npm test`, Playwright de juegos,
capturas antes/después y preview para aprobar en el móvil antes de `main`.
