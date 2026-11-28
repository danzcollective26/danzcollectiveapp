# ANEXO · TWO HANDS JOKANO — documento de diseño no gráfico

> Escrito por Danz Collective Dev (bot de Cursor) el 17/11/2026 a petición de Tronco, a partir del hilo 12 (pinball) y cerrando huecos por su cuenta. Lo marcado como LOCKED incluye partes propuestas por el bot que Tronco no ha confirmado una a una (por ejemplo, los power-ups). Ver 00-LEEME.

# TWO HANDS JOKANO — Design Document (no gráfico)
**Pinball · ARCADANZ · Danz Collective App**
Estado: **LOCKED** en todo lo no visual. Pendiente solo: arte de mesa y visual de Jokano (foto del usuario).

---

## 1. Visión — LOCKED
Pinball de una sola mesa densa en un afterparty post-apocalíptico: el club está destrozado, pero la cabina sigue sonando y Jokano sigue a dos manos. Puntuación pura y highscore. Empieza suave y acaba en caos total. Partidas de 3-5 minutos, móvil primero.

## 2. Personaje — LOCKED (visual pendiente)
- Jokano está presente en la mesa (figura junto al mini-playfield) y es también la bola (bola con su cara/sello).
- Reacciona a eventos: jackpots, drain, modos, tilt. Frases cortas tono DANZ (directo, cómplice, cabina).
- **Pendiente:** foto del usuario → visual de Jokano.

## 3. Layout de la mesa — LOCKED
- **Lower:** flippers L/R + slingshots, outlanes e inlanes, plunger a la derecha, captive ball encima del flipper izquierdo.
- **Mid-low:** 3 pop bumpers en el centro, 4 drop targets en el lado izquierdo-medio, entrada del loop izquierdo.
- **Mid-high:** rampa principal derecha, loop grande izquierdo con spinner, rampa secundaria hacia el mini-playfield, spinner secundario.
- **Upper:** mini-playfield arriba a la derecha, targets de activación de modos arriba en el centro (3 targets: **J-K-O**).

## 4. Física y controles — LOCKED
- **Física híbrida:** bola rápida con sensación de peso. Paso fijo de 120 Hz con subpasos para evitar túneles; velocidad máxima limitada; flippers con impulso según el momento del golpe (tap vs hold).
- **Controles configurables:**
  - Móvil: mitad izquierda/derecha de la pantalla = flipper L/R; deslizar abajo en la derecha = plunger; agitar o botón = nudge.
  - Teclado: Z/← y M/→ para flippers, Espacio/↓ plunger, X/C/B nudge izquierda/arriba/derecha (reasignables).
  - Mando (Gamepad API): gatillos = flippers.
  - Opciones: invertir lados, vibración on/off, sensibilidad de nudge.
- **Nudges:** 3 por bola. El 3.º activa "TILT WARNING"; un 4.º = **TILT** (flippers muertos, se pierde el bonus de la bola, no la partida). El contador se repone con cada bola nueva.
- **Ball save:** 8 s al lanzar cada bola y 5 s al empezar cada modo.

## 5. Scoring progresivo — LOCKED
Valores base (escalan con el multiplicador):

| Elemento | Puntos base |
|---|---|
| Slingshot | 110 |
| Pop bumper | 500 (+50 por cada 10 golpes, máx. 1.000) |
| Spinner (por vuelta) | 150 |
| Drop target | 1.000 (banco completo 10.000) |
| Rampa principal | 7.500 |
| Rampa secundaria | 5.000 + entrada al mini-playfield |
| Loop izquierdo | 6.000 |
| Captive ball | 3.000 (sube 1.000 cada golpe en la bola) |
| Target J/K/O | 2.500 |
| Inlane | 250 |

**Multiplicador (chains):**
- Cada shot mayor (rampa, loop, captive, banco de drops) en ≤4 s desde el anterior suma +1 a la chain.
- Chain 3 = ×2, chain 5 = ×3, chain 8 = ×4, chain 12 = ×5 (máx. ×5 fuera de modos).
- La chain se rompe a los 4 s sin shot mayor o en drain. El multiplicador alcanzado se mantiene hasta el drain (bonus de fin de bola × multiplicador).

**Jackpots progresivos:**
- **Mini Jackpot:** se ilumina en la rampa principal tras 2 bancos de drops completos. Valor 50.000 + 10.000 por cada Mini cobrado.
- **Super Jackpot:** se ilumina en el captive ball tras cobrar 3 Minis o completar un modo. Valor 250.000 + 50 % de los puntos del último modo.
- **Mega Jackpot:** se ilumina en el mini-playfield tras completar **los dos modos** en la misma partida. Valor 1.000.000 + 100.000 por bola extra conseguida en la partida.

**Bonus de fin de bola:** (rampas × 2.000 + loops × 1.500 + drops × 500) × multiplicador.

## 6. Bolas, extra balls y multiball — LOCKED
- 3 bolas por partida.
- **Extra ball** (máx. 2 por partida, luego se convierten en 100.000 puntos):
  - Al llegar a 1.000.000 y a 5.000.000.
  - Al completar cualquier modo por primera vez.
  - Se cobran en el loop izquierdo cuando están iluminadas.
- **Multiball (opcional, se activa jugando):**
  - Se bloquean bolas en el mini-playfield (3 entradas por la rampa secundaria = lock).
  - Con 2 bolas bloqueadas → **Afterparty Multiball** de 3 bolas. Ball save de 10 s.
  - Durante el multiball todos los jackpots valen ×2 y las chains no caducan.
  - **Bolas variables:** chains de 8+ durante el multiball añaden una bola más (máx. 4 a la vez).

## 7. Modos — LOCKED
No puede haber dos modos activos a la vez. Cualquier modo puede coincidir con el multiball (premio ×1,5).

### 7.1 Jokano Rage (60-90 s)
- **Activación:** completar el banco de 4 drop targets dos veces, **o** loop izquierdo + rampa principal seguidos (≤5 s).
- **Duración:** 60 s base, +10 s por cada objetivo cumplido (máx. 90 s).
- **Mecánica:** el rage multiplier empieza en ×2 y sube +1 cada 3 shots mayores (máx. ×6). Objetivo: 6 "golpes de rabia" (rampas o loops iluminados en rotación).
- **Completado:** cumplir los 6 golpes → bonus de 500.000 × rage multiplier final + ilumina Super Jackpot.
- **Fallo:** se acaba el tiempo → cobras lo hecho y vuelves a intentarlo con un golpe menos de requisito la próxima vez.

### 7.2 3D Chaos (45-75 s)
- **Activación:** 2 rampas + 10 vueltas de spinner en ≤10 s, **o** chain de los 3 targets J-K-O.
- **Duración:** 45 s base, +5 s por cada jackpot de chaos (máx. 75 s).
- **Mecánica:** chain rápido (la ventana baja de 4 s a 2,5 s). Contador **Chaos/Vinyl**: cada shot suma 1 vinilo; cada 5 vinilos sube el **Chaos Jackpot** (empieza en 100.000, +50.000 por escalón) y se cobra en el mini-playfield.
- **Completado:** 25 vinilos → Chaos Jackpot final ×2 + ilumina Super Jackpot.

### 7.3 Wizard (cierre de partida)
- Completar los dos modos ilumina **"LAST SONG"** en el mini-playfield: multiball de 4 bolas durante 45 s, con todo a ×3 y el Mega Jackpot iluminado de forma continua.

## 8. Power-ups — LOCKED
Se ganan jugando y se guardan en **1 slot**. Se usan con un toque largo, o con la tecla P/botón. Solo uno activo a la vez.

| Power-up | Efecto | Cómo se consigue |
|---|---|---|
| **Vinilo Escudo** | Un ball save de 15 s; si la bola cae por un outlane, rebota de vuelta una vez. | Completar las 2 outlanes/inlanes iluminadas (letras V-I-N). |
| **Segunda Mano** | 10 s con un tercer flipper central entre los dos flippers. | Captive ball golpeado 5 veces. |
| **Botella Rota** | Los pop bumpers valen ×5 y empujan más fuerte durante 15 s. | 50 golpes de pop bumper. |
| **Humo de Cabina** | Ralentiza la bola un 35 % durante 8 s (bullet time) y congela el temporizador de modo. | 3 vueltas completas al loop izquierdo seguidas. |
| **Resaca Inmortal** | La chain no caduca durante 20 s. | 30 vueltas de spinner en una misma bola. |
| **Altavoz Reventado** | Baja de golpe los 4 drop targets y cuenta como un banco completo. | Rampa principal ×3 seguidas. |

## 9. Progresión y desbloqueos — LOCKED
Todo se valida en el servidor (igual que el resto de ARCADANZ). **Sin DANZPOINTS directos.**

| Desbloqueo | Requisito |
|---|---|
| Opción Multiball activa por defecto | Primera partida terminada |
| Skin de bola "Vinilo dorado" | 1.000.000 en una partida |
| Frases extra de Jokano | Completar Jokano Rage |
| Efectos visuales 3D Chaos "Neón podrido" | Completar 3D Chaos |
| Título "Dos Manos" en el leaderboard | Llegar a LAST SONG |
| Skin de mesa nocturna (tras definir el arte) | 10.000.000 total acumulado |
| Vinilo de Jokano para Groove/Vinyl Survivors | Cobrar un Mega Jackpot |
| Pista bonus en Groove Ninja | Top 10 semanal en el leaderboard |

**Leaderboard:** global, semanal y de amigos. Se guarda la mejor puntuación con su fecha y los modos completados. Validación: duración mínima de partida y techo de puntos por segundo para descartar trampas.

## 10. Flujo de partida y estados — LOCKED
- Menú → elegir controles (el primer uso muestra un tutorial de 3 pantallas) → plunger → juego.
- **Pausa:** botón en pantalla, Esc o salir de la app (pausa automática).
- **Fin:** **PARTY OVER** con puntuación, mejor puntuación, modos completados y desbloqueos nuevos. Botones Reintentar y Salir.
- Récord local + servidor; si no hay conexión, se guarda y se envía después.

## 11. Audio — LOCKED
- La música va por capas: más capas con el multiplicador, tema propio para cada modo y para LAST SONG.
- Efectos para cada elemento, voces de Jokano en los jackpots y el drain, y aviso sonoro del final de ball save y de modo.

## 12. Accesibilidad y rendimiento — LOCKED
- Reduced motion: sin temblores de pantalla ni flashes; los efectos pasan a fundidos.
- Indicadores de texto para todo lo que se comunica con color.
- Objetivo 60 fps en un móvil de gama media; física desacoplada del frame rate.
- Vibración opcional.

## 13. Integración técnica — LOCKED
- Misma arquitectura que Groove Ninja/AfterDrop: lógica pura y testeable (física, scoring, modos) + componente React/Canvas.
- Entrada en ArcadeChooser.
- Cumple el contrato de juegos ARCADANZ: PARTY OVER, pausa, reduced motion, móvil primero y récords validados.

## 14. Pendiente
- [ ] Arte de la mesa.
- [ ] Visual de Jokano (foto del usuario).

Todo lo demás está LOCKED y listo para pasar a técnico.
