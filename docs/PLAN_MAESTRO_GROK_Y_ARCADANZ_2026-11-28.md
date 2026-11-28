# Plan maestro — hilos de Grok + ARCADANZ (28/11/2026)

Fuente: 14 hilos del proyecto Grok «Danz app» (11–23/11/2026), leídos completos
por su enlace público de compartir, cruzados con el repositorio (ramas, PR, docs)
y con la auditoría visual del 27/11 (`PROPUESTA_JUEGOS_PREMIUM_2026-11-27.md`).
Las decisiones posteriores del propietario prevalecen sobre las anteriores.

## 1. Cronología de los 14 hilos

| # | Fecha | Hilo | Qué se decidió | Qué existe en GitHub |
|---|---|---|---|---|
| 9 | 11–17/11 | DANZ Idle Studio (Phaser → Habbo) | Idle de estaciones estilo Habbo; Música, Moda, Vídeo, Los Primos, Sello (60 niveles); Cocina, Sala, Seguridad (Mono), Baño (menores, ~10 niveles); producto cada 20 niveles (USB → vinilo → platino); operador cada 30; personaje creable con camisetas reales de danzcollective.com; equipo: Luitzmi/Chicharro, Roncero/Juanfran, Cosa/Alpi, Mike/Jokano, León/Tommy, Mono, «la rata» | **Sí**: `src/arcade/idle` en `main` + ramas `work/idle-studio*`. Gráfico: prototipo, el propietario lo considera muy mejorable |
| 7 | 12–17/11 | Plataformas 2D «Mix & Miles» → **Ron0 / el gran Roncero** | París primero (mochila olvidada → aviso de bomba), mundos Festival, Aeropuerto, Sudeste asiático, España rural, Ibiza; flor = vida (3); camisetas = poderes; manager dudoso (tratos poder↔vida), sombra que persigue; dificultad Chill/Normal/Ayvala; «menuda bajona, nen» al perder vida | **No**. Gráficos fallidos; biblia de diseño solo en Grok |
| 13 | 12–17/11 | Estudio de la app con ChatGPT | Yeppo (flor, vacilón), ideas: rachas de asistencia, wishlist DANZFLOR, notificaciones, QR de artista, ranking de outfits; **nada en tiempo real durante el evento**; juego de cartas **SEIS** (de la mañana, qué jaleo): Panas, Jack cruzado, Vinilo rallado, Luz estroboscópica, Flor blanca; Yeppo da consejos | **Sí, duplicado**: PR #50 `feature/seis` (integrado, 1–3 rivales, tests) y rama `feat/seis-game` (motor básico) |
| 5 | 16–17/11 | Conectar Grok a GitHub + revisión Collecta | Collecta: personaje arcade del encargado basado en la foto de la portada; Arena principal con juice contenido; Persecución más limpia; rival propuesto (portero rubio platino) **pendiente de tu OK** | Hoja de personaje solo en Grok |
| 10 | 16–17/11 | Repo privado y complementos | Linear (proyecto + issues DAN-1…27), Notion, Drive conectados en Grok; Apple Sign-in requiere cuenta Apple Developer (de pago) | Linear existe fuera del repo |
| 4 | 16–17/11 | Rediseño app | Respetar paleta real (lima `#d9ff6b`), logo ARCADANZ real, flor **siempre 6 pétalos**, nº de socio simple (00001), Yeppo más vivo pero flor de la bolsa; mínimo uso del móvil durante la noche | **Sí**: `docs/DESIGN_DIRECTION_2026-11.md`, migración de nº de socio |
| 6 | 16–17/11 | **After Drop** (runner rítmico + extracción) | Juego independiente, 3 carriles al beat, PERFECTO/combo, EXTRAER LOOT; prototipos HTML rechazados | **No** (la rama `feature/afterdrop` nunca se creó) |
| 11 | 16–17/11 | **Vinyl Survivors** (oleadas) | Cenital tipo Vampire Survivors, 6–7 habilidades, 3 por partida, niveles + evolución; Metal Slug como posible segundo modo | **No**. Cuestionario a medias |
| 8 | 16–17/11 | Festival Tycoon → **NomeNoConEso** | Modo de **Collecta**: control de puerta (ficha, cacheo, escáner con riesgo), aforo, vibe, game over duro, varias noches, progresión local | **Sí**: PR #57 (esqueleto) |
| 14 | 16–17/11 | **Manager Heist** | Extracción + bluff; MVP pixel rechazado («mega cutre»); nuevo lore **apocalipsis zombi con estética club**, estilo **3D cartoon**; FPS como juego aparte futuro | PR #52 (MVP aparcado). La rama zombie-club **no existe** |
| 3 | 16–23/11 | After Among Us + Festival Builder | Among Us → posible modo de Collecta; Festival Builder → **fusionar con Idle Studio** («idea 1»: zona After que consume los productos del estudio) | Doc de fusión solo en Grok |
| 1 | 16–23/11 | Intros de 3 s | Flor del logo → **morph** → **portada real** de cada juego, elegante, golpe/splash sin música infantil | Ramas `feature/arcade-intros`, PR #51; versiones de Grok en vídeo solo en Grok |
| 2 | 16/11 | Catan del Festival | 20–30 min, umbral + límite de rondas, recursos atractivos para todos, primero local/solo | **No** |
| 12 | 16–17/11 | Pinball **Two Hands Jokano** | Afterparty postapocalíptico, Jokano + bola, 1 mesa densa, modos **Jokano Rage** y **3D Chaos**, tabla de puntuación y layout cerrados | **No** |

## 2. Lo que se pisa y cómo resolverlo

| Conflicto | Propuesta |
|---|---|
| SEIS en dos ramas (#50 y `feat/seis-game`) | Seguir **sobre #50** (ya integrado y con tests); rescatar de `feat/seis-game` solo lo que falte y cerrar esa rama. |
| Tower defense duplicado de Grok (#85 y #86) | Uno solo o ninguno por ahora. Ningún hilo los pide: aparcar. |
| Tres «constructores de festival» (Festival Builder, Catan del Festival, fusión Idle) | Festival Builder **dentro de Idle Studio** (zona After). Catan, juego aparte **posterior** (necesita rivales IA u online). |
| Collecta acumula modos (Arena, Persecución, Último turno, NomeNoConEso, Among Us) | NomeNoConEso sí (en marcha). **Among Us aplazado** hasta tener online: con IA local pierde la gracia. |
| Universo zombie-club (Heist, FPS) frente a Vinyl Survivors | Mismo motor y mismos assets 3D cartoon cenitales: **primero Vinyl Survivors** (solo, bucle probado), luego Heist reutilizándolo. FPS al final o nunca. |
| Reparto disperso (Ron0, Jokano, Mike, León, Tommy, Mono, Chicharro…) | Crear **biblia de personajes** única en el repo para todos los juegos. |
| Tres gestores de tareas (docs, GitHub Issues, Linear) | **Una sola fuente**: GitHub Issues + este registro. Linear como espejo opcional solo si se conecta. |
| Intros: varias ramas y vídeos | Hacerlas **en código** (gratis, ligeras, sin vídeo): flor SVG de 6 pétalos → máscara → portada aprobada + golpe sonoro. Sin regenerar portadas. |
| Rediseño de Collecta del hilo 5 frente a portada aprobada | Portada intacta; el personaje arcade solo para los sprites de juego, tras tu OK a la hoja de personaje. |

## 3. Lo que falta o se ha perdido

1. **Biblias de diseño** de Pinball, Manager Heist, After Drop, Ron0, Vinyl Survivors y la fusión Idle-Festival: solo en el espacio de Grok. Se pueden **reconstruir desde las respuestas de los hilos**; lo hace Claude, sin trabajo tuyo.
2. **Hoja de personajes de Collecta** (encargado + rival): falta tu OK.
3. **Fotos y descripciones** del equipo del Idle Studio y de Jokano: prometidas, sin entregar.
4. **Apple Sign-in**: requiere cuenta Apple Developer (de pago, unos 99 USD al año). Solo si se decide.
5. **Pipeline de arte**: el motivo de casi todos los fracasos de Grok fue dibujar a mano con código. Hace falta un flujo de assets con estilo coherente: CC0 (Kenney, Quaternius) e imágenes generadas con modelos gratuitos de Hugging Face, ya recortadas y en `public/`.

## 4. Reevaluación de los juegos actuales con las herramientas nuevas

| Juego | Qué cambia con Hugging Face, assets CC0 y el kit de jugo |
|---|---|
| Jack | Comida y pista temáticas con sprites generados; brillo del cable. Kit de jugo ya aplicado (PR #97). |
| Groove Ninja | Vinilos partidos en dos mitades, estelas por arma, textos sin solapes; fondos de cabina generados. |
| Collecta | Sprites 2,5D del encargado/rival a partir de la hoja aprobada; tiles de escenario CC0; explosiones con jugo. |
| DANZPORTER | Cielo, luces y público con modelos CC0 low-poly; coordinar con #89–#92. |
| Idle Studio | **El mayor salto posible**: muebles y personajes isométricos generados con un estilo único (tipo Habbo, no copia), en lugar de dibujarlos por código. |

## 5. Orden de trabajo recomendado

| Bloque | Contenido | Quién |
|---|---|---|
| A | Probar en Android y fusionar #87; actualizar #97 encima y fusionar | Tú pruebas; Claude integra |
| B | Orden de la casa: cerrar o aparcar duplicados (#85/#86, `feat/seis-game`), biblia de personajes, reconstruir las biblias de diseño de los hilos en `docs/` | Claude |
| C | Intros flor → portada en código, para los 5 juegos | Claude; tú eliges |
| D | Pulido premium de los juegos actuales (Groove → Collecta → Idle Studio → DANZPORTER) con el pipeline de arte | Claude; tú validas en el móvil |
| E | Terminar **SEIS** (#50): poco gráfico, diseño cerrado | Claude |
| F | **NomeNoConEso** (#57) dentro de Collecta | Claude |
| G | **Two Hands Jokano** (pinball, Phaser con física Matter) | Claude; tú das la foto de Jokano |
| H | **Vinyl Survivors** (completar el cuestionario) → base del universo zombie-club | Tú respondes un test; Claude construye |
| I | After Drop → Manager Heist zombie-club → Ron0 plataformas → Catan del Festival | Más adelante |
| — | Among Us, FPS, online | Cuando exista multijugador |

Cada bloque: rama propia, `npm run build`, `npm test`, Playwright, capturas antes/después
y preview para tu aprobación en el móvil antes de `main`.

## 6. Reglas del propietario recogidas en los hilos

- Durante la noche la app casi no existe: picar QR del sello y nada más.
- Flor del colectivo: siempre **6 pétalos**. Paleta y logo ARCADANZ reales; no inventar.
- Preguntas siempre en **formato test marcable**, el máximo de preguntas de una vez.
- No pedirle mover archivos ni pasos que la IA pueda hacer; guiarle con enlaces exactos.
- Enseñar un boceto o maqueta antes de cambios gráficos importantes.
- Gráficos: nada de «cutre» ni píxel pobre; Grok falló con el dibujo procedural, así que se usan assets reales.
