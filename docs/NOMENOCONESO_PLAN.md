# NomeNoConEso — plan de implementación

Estado de este documento: **esqueleto, 17/11/2026**. Hay tipos, datos, firmas y pruebas de catálogo. No hay partida. La bandera `NOMENOCONESO_VISIBLE` está en `false`. Arena, Persecución y Último turno no se han tocado.

Otro agente puede implementar el modo siguiendo este archivo en orden. No hace falta volver a diseñar las reglas que aquí quedan cerradas. Donde hay una pregunta abierta, está numerada y tiene un valor por defecto: usar ese valor salvo que el propietario diga otra cosa.

Base de la rama: `main` en `6506b00c6b55cd322f545de3e805b9d391330b01`. Las líneas de `App.tsx`, `CollectaHub.tsx` y `ArcadeChooser.tsx` se refieren a ese árbol. Si se han movido, localizar el mismo símbolo, no el número a ciegas.

## 1. Qué es

NomeNoConEso es un modo **dentro** de DANZ Collecta, al lado de Arena, Persecución y Contra la máquina. La persona que juega es quien organiza el after y lleva la puerta. El tono es humor ácido de DANZ: haters, divas y crew caótica. Las facturas y el dinero de puerta son ficción del arcade. No hay cobros ni premios reales.

Es una partida de **una sola persona**. No hay mando P2, no hay `worldDirection` y no es online.

Prohibido dejar entrar a quien:

- no tiene entrada válida;
- es hater o trae mal rollo;
- lleva botella de fuera;
- lleva un objeto peligroso ligero;
- ya fue expulsado;
- trae energía negativa o drama;
- es menor de 18 años.

La última regla es de seguridad del esqueleto. La frase de la puerta es seca, sin chiste: «Hoy no. Esta puerta no es para ti todavía.» No se bromea con ese caso.

## 2. Árbol

```
src/arcade/collecta/nomenoconeso/
  NomeNoConEso.tsx      pantalla inerte, sin montar
  nomenoconeso.css      solo bajo .nnc-stub
  copy.ts               PAUSA DE PUERTA y PARTY OVER
  visibility.ts         NOMENOCONESO_VISIBLE = false
  types.ts              contrato
  index.ts              reexporta lógica y datos, no el TSX
  data/
    balance.ts          cifras de serie y deltas
    traits.ts
    items.ts
    cues.ts
    dialogues.ts
    archetypes.ts
    cameos.ts
    seeds.ts            apodos genéricos de cola
    events.ts
    upgrades.ts
    nights.ts           noches 1..5
    index.ts
  logic/
    pending.ts          NomeNoConEsoPendiente
    difficulty.ts       orden de dificultad, ya calculado
    night.ts            estado inicial + reduceNight pendiente
    people.ts           generatePerson pendiente
    inspection.ts       resolución y cacheo pendientes
    scanner.ts          pliegue de mejoras ya hecho; resolveScan pendiente
    metrics.ts          updateMetrics pendiente
    end.ts              cierre y aplicar resultado, pendientes
    progression.ts      localStorage v1, migración y récord, ya hechos
    points.ts           aviso local, sin envío
tests/nomenoconeso.test.ts
```

`node --test tests/nomenoconeso.test.ts` cubre ids únicos, referencias, el orden de las noches, la persistencia y que la partida siga lanzando `NomeNoConEsoPendiente`. También lee `App.tsx`, `CollectaHub.tsx`, `ArcadeChooser.tsx`, `CollectaMatchMenu.tsx` y `TestLab.tsx` y falla si aparece `nomenoconeso`.

## 3. Modelo de datos

Tipos en `types.ts`. Listas cerradas: `PERSON_ARCHETYPE_IDS`, `PROHIBITION_REASONS`, `HIDDEN_ITEM_IDS`, `NIGHT_EVENT_KINDS`, `NIGHT_PHASES`, `PAUSE_REASONS`, `TICKET_KINDS`, `CAMEO_CATALOG_IDS`.

| Pieza | Dónde | Notas |
| --- | --- | --- |
| `PersonArchetype` | `data/archetypes.ts` | 7 ids. `minNight` es la primera noche en la que puede salir. `weight` es el peso del generador. |
| `Cameo` | `data/cameos.ts` | Yeppo y los cuatro nombres públicos de `src/content/collective.json`. Son apariciones de puerta, no biografías. Entran si `prohibition` es null. Yeppo tiene `age: null`. |
| `PersonSeed` | `data/seeds.ts` | Apodos de cola. El generador copia una ficha; no la muta. |
| `Trait` | `data/traits.ts` | `visible: false` no sale en la tarjeta hasta cacheo o escáner. |
| `HiddenItem` | `data/items.ts` | `prohibited: true` obliga a echar. `camara` y `purpurina` no. |
| `VisualCue` | `data/cues.ts` | Pista corta. No dice el veredicto. |
| `DialogueLine` | `data/dialogues.ts` | Texto fijo. No generar frases nuevas en el cliente. |
| `NightEvent` | `data/events.ts` | Una ficha por cada `NightEventKind`. |
| `Upgrade` | `data/upgrades.ts` | Se compran entre noches con dinero de puerta. |
| `NightConfig` | `data/nights.ts` | Cinco noches. |
| `Metrics` | tipo | `reputation` y `doorMoney` de la noche son el delta de esa noche, empiezan en 0. La hucha vive en `ProgressionState`. |
| `ScannerState` | tipo | El coste es en puntos de la noche. |
| `ProgressionState` | tipo | `schemaVersion: 1`. |
| `DanzPointsIntent` | tipo | `claim: false` y `status: 'no-implementado'`. |

Clave de guardado: `danz-collecta-nomenoconeso-v1` (`NOMENOCONESO_STORAGE_KEY`). No reutilizar `danz-snake-best-v1`, `danz-groove-ninja-record-v1` ni `danzporter-best-v3`. No guardar audio, pases, fotos ni enlaces firmados.

### Deltas de una decisión

Están en `data/balance.ts`. Se suman. No se reinterpretan.

| Caso | Constante |
| --- | --- |
| Dejar pasar a quien puede | `ADMIT_CORRECT` |
| Dejar pasar a quien no puede | `ADMIT_WRONG` |
| Echar a quien no puede | `REJECT_CORRECT` |
| Echar a quien puede | `REJECT_WRONG` |
| Además, VVIP que puede entrar y pasa | `VVIP_ADMIT_BONUS` |
| Además, VVIP que puede entrar y se le echa | `VVIP_REJECT_PENALTY` |

Echar a un VVIP que **sí** está prohibido no aplica `VVIP_REJECT_PENALTY`.

Escáner de serie: precisión 0.55, espera 8000 ms, coste 8 puntos, riesgo de fallo 0.35, riesgo de enfado 0.2, ventana de cacheo 700 ms. Límites en `SCANNER_LIMITS`. Fallo: `SCAN_FAIL`. Enfado: `SCAN_ANGER`.

Mejoras, en orden de compra posible:

1. `linterna` — 30 de dinero, reputación 0. Precisión +0.12.
2. `mano-rapida` — 55, reputación 8, exige linterna. Espera −2000 ms.
3. `cacheo-fino` — 70, reputación 12, sin requisito. Ventana +250 ms.
4. `ojo-clinico` — 110, reputación 20, exige mano rápida. Precisión +0.15, fallo −0.1, enfado −0.08, coste −3.

`scannerFromUpgrades` ya pliega esa lista y recorta a los límites. No comprueba el precio: eso es de la compra.

### Noches

`nightDifficulty` (`logic/difficulty.ts`) vale

```
100 + cola×3 + round(12000 / spawnEveryMs) + arquetipos×5 + eventos×7
  + round(minScore / 10) − (capacityMax − capacity) − (vibe − minVibe)
```

| Noche | Id | Dificultad | Cola | Ritmo | Reparto |
| --- | --- | --- | --- | --- | --- |
| 1 Ensayo de puerta | `noche-01-ensayo` | 56 | 4 | 7000 ms | normal, crew |
| 2 Viernes con bolsillos | `noche-02-viernes` | 84 | 6 | 6000 ms | + escondite. Evento drop |
| 3 Lista de cristal | `noche-03-lista` | 120 | 8 | 5000 ms | + vvip, influencer. + séquito |
| 4 After ácido | `noche-04-after` | 160 | 10 | 4200 ms | + hater. + avalancha y pelea |
| 5 Cierre de temporada | `noche-05-cierre` | 209 | 12 | 3400 ms | + cameo. + hater famoso, inspección y artista |

Duración: 110 s, 100 s, 90 s, 80 s, 70 s. Cada noche incluye todos los arquetipos y eventos cuyo `minNight` es menor o igual que su índice. El test fija las cinco dificultades. Si se cambia una cifra, hay que cambiar el test a la vez y explicar por qué la curva sigue subiendo.

## 4. Flujo de una noche

Fases: `lista → puerta → (cacheo | escaner | pausa) → cierre | game-over`.

1. **Lista.** `createInitialNightState(night, prefersReducedMotion())`. Se muestra `night.briefing`. El reloj está a 0. No hay persona en puerta.
2. **Empezar.** Acción `{ type: 'empezar' }`. Fase `puerta`. El generador llena hasta `queueSize` personas y `current` es la primera. El reloj corre.
3. **Tarjeta.** Nombre, edad (o «Sin DNI» si `age` es null), entrada (`ticket.kind` y si `valid`), rasgos con `visible: true`, pistas visuales y un diálogo de la persona. No mostrar `prohibition`, ni el objeto oculto, ni los rasgos invisibles.
4. **Decidir.** Botones `PASA` y `FUERA`.
   - Correcto si `prohibition === null` y la elección es `pasa`, o si hay prohibición y la elección es `fuera`.
   - Sumar el delta de la tabla. Si es VVIP limpio, sumar el extra.
   - La línea de la puerta, por motivo: `sin-entrada` → `puerta-sin`; `hater` → `puerta-hater`; `mal-rollo` → `puerta-grabando` si tiene el rasgo `grabando`, si no `puerta-criterio`; `botella-exterior` → `puerta-botella`; `objeto-peligroso` → `puerta-arma`; `expulsado` → `puerta-expulsado`; `energia-negativa` → `puerta-drama`; `menor` → `puerta-menor`; sin motivo y pasa → `puerta-pase`; sin motivo y fuera → `puerta-criterio`.
   - Pasar a la siguiente persona. Si la cola se vacía antes de tiempo, generar otra con el siguiente índice.
5. **Cacheo.** Acción `cachear` abre la fase `cacheo`. Minijuego: una ventana de `scanner.friskWindowMs`. Acierto si `hitAtMs` cae dentro de `[startedAtMs, startedAtMs + windowMs]`. Un acierto revela `hiddenItemId` (o que no hay nada). Un fallo no revela. El cacheo no decide la entrada. Al terminar se vuelve a `puerta` con la misma persona.
6. **Escáner.** Solo si `nowMs >= scanner.readyAtMs` y `metrics.score >= scanner.cost`.
   - Cobrar `cost` en la puntuación de la noche aunque falle.
   - `revealRoll < precision` revela el objeto. Si no, fallo y se aplica `SCAN_FAIL`.
   - Si falla y `angerRoll < angerRisk`, `angered` y se aplica `SCAN_ANGER`.
   - `readyAtMs = nowMs + cooldownMs`.
   - Firma objetivo, que sustituye al stub:

```ts
resolveScan(scanner: ScannerState, person: Person, nowMs: number, revealRoll: number, angerRoll: number): { scanner: ScannerState; resolution: ScanResolution }
```

7. **Tick.** Solo avanza en `puerta`, `cacheo` y `escaner`. `dt` no finito o `<= 0` no mueve el reloj. Tras sumar, evaluar el cierre. No pasar de `durationMs`.
8. **Pausa.** Acciones `{ type: 'pausar', reason }` con `boton | pestana | foco | giro`. Guardar la fase actual en `resumePhase`, guardar `pauseReason`, fase `pausa`, reloj congelado, soltar punteros y teclas. `reanudar` vuelve a `resumePhase`. En pausa se ignoran decidir, cachear, escanear y tick.
9. **Cierre.** `readEndCondition`:
   - `vibe <= 0` → `vibe-cero`, `hard: true`, `passed: false`. Inmediato.
   - `capacity > capacityMax` → `aforo-reventado`, `hard: true`, `passed: false`. Inmediato. En el MVP el aforo solo sube al dejar pasar (`capacity` del delta, nunca negativo).
   - Tiempo cumplido, `vibe >= minVibe`, `score >= minScore` y `capacity <= maxCapacity` → `objetivos-cumplidos`, `passed: true`, `hard: false`.
   - Tiempo cumplido sin eso → `objetivos-fallidos`, `passed: false`, `hard: false`.
   - `salir` → `abandonada`. No es un récord.
10. **Textos de cierre.** Pausa: `PAUSE_LABEL` (`PAUSA DE PUERTA`). Game over o cierre de noche: `PARTY_OVER_LABEL` (`PARTY OVER / LA PUERTA SE CIERRA`). Mismo patrón que `CollectaMatchMenu.tsx` línea 6 (`PARTY OVER / CUENTAS CERRADAS`), con el subtítulo de la puerta.

`updateMetrics` devuelve un objeto nuevo. Recorta `vibe` a `0..VIBE_MAX` (100), `vvipHappiness` a `0..VVIP_MAX` (100), y `score`, `reputation` y `doorMoney` a `0..1_000_000`. En el MVP `capacity` no baja.

El reductor no muta el estado ni la acción que recibe. No usa `Math.random`. La semilla entra por `PersonDraftInput.seed`.

### Generador

Sustituir el `throw` de `generatePerson` por esto:

- Filtrar `archetypeIds` a los que están en la noche y cuyo `minNight` cabe.
- Elegir arquetipo por peso con un hash de `(seed, index)`.
- Si el arquetipo es `cameo`, copiar un `CAMEOS` con el mismo hash. Si no, copiar un `PERSON_SEEDS` de ese arquetipo.
- Id de la persona: `p-${nightId}-${index}-${seed}`. `cameoId` es el id del cameo o null. `roll` es la tirada unitaria derivada del hash.
- Si `age` no es null y es menor de 18, forzar `prohibition: 'menor'`.
- La misma semilla y el mismo índice devuelven la misma persona. Copiar la ficha.

Eventos, cuando se implementen (no en el primer corte jugable): al dispararse, aplicar `effects`. `ritmo` suma `spawnMsDelta` al intervalo (negativo acelera; no bajar de 1200 ms). `cola` añade tantas personas. `vibe` suma al rollo y puede provocar cierre. `obligatorio` inserta ya a una persona de ese arquetipo como `current` o la siguiente. Un evento a la vez, en `activeEventId`. No encadenar dos en el mismo tick.

## 5. Progresión

Ya implementado en `logic/progression.ts`:

- `createProgression()` empieza sin noches, con 0 de dinero y reputación, y desbloquea `normal` y `crew`.
- `parseProgression` solo acepta la versión 1. `nightsCleared` tiene que ser un prefijo exacto de las noches, en orden. Una mejora cuyo requisito no está comprado invalida la partida.
- `loadProgression`: vacío → partida nueva. JSON roto o versión 1 inválida → aviso «no encaja» y partida nueva. `schemaVersion: 0` → aviso de borrador y partida nueva (`migrated: true`). Versión mayor que 1 → aviso de partida más nueva y partida nueva. `getItem` que lanza → no se puede guardar, la partida sigue en memoria.
- `saveProgression` solo escribe `NOMENOCONESO_STORAGE_KEY` y solo si el estado vuelve a parsear.
- `rememberRecord` guarda la mejor puntuación de esa noche si es un entero entre 0 y 1_000_000.
- `recomputeProgression` recalcula arquetipos y eventos visibles para la próxima noche (`nightsCleared.length + 1`).

Al pasar a versión 2 hay que leer la versión 1 **antes** de la rama «versión mayor». Si no, se borrarían las partidas v1.

`applyNightResult` sigue pendiente. Al sustituir el `throw`:

- Si `reason !== 'abandonada'`, `rememberRecord` con `result.score`.
- Si `passed` y `nightId` es exactamente la siguiente noche, añadirla a `nightsCleared`, sumar `doorMoneyEarned` y `max(0, reputationDelta)` a la hucha, con tope `BANK_LIMIT`.
- Si no `passed`, no tocar hucha ni desbloqueos.
- Rellenar `pointsIntent` con `buildPointsIntent`. No enviarlo.
- Terminar en `recomputeProgression`.

Compra entre noches, función nueva, no existe todavía:

```ts
export function buyUpgrade(state: ProgressionState, upgradeId: string): ProgressionState | null
```

Devuelve null si no existe, si ya está, si falta el requisito, si `reputation < minReputation` o si `doorMoney < cost`. Si cabe, resta el coste, añade el id y recomputa. No se compra durante una noche.

## 6. DANZPOINTS

`buildPointsIntent` ya construye el aviso. `claim` es false. No importar `src/points/DanzPoints.tsx` ni llamar a Supabase desde este modo. El piloto (`docs/DANZPOINTS_PILOTO_2026-11-13.md`) da 0 puntos por juego. Hasta que el servidor tenga una regla, el objeto se queda en la partida local.

## 7. Integración — todavía no hecha

No editar estos archivos hasta que `reduceNight`, `generatePerson`, `resolveInspection`, `updateMetrics` y `readEndCondition` dejen de lanzar para la noche 1. Con la bandera en false el hub actual debe quedar igual.

### `src/arcade/CollectaHub.tsx`

- Línea 7, array `MODES`. Añadir un cuarto modo solo si `NOMENOCONESO_VISIBLE` es true:

```tsx
{ id: 'puerta', name: 'NOMENOCONESO', badge: 'LA PUERTA · 1 JUGADOR', note: 'Lista, rollo y aforo. Tú decides quién entra.' }
```

- Línea 10, props. Añadir `onPuerta: () => void`.
- Línea 13, el `action` del `ArcadeMenu`. Si `mode === 'puerta'`, etiqueta `JUGAR NOME NO CON ESO` y `onClick` `onPuerta`. El pie de esa rama: `UNA PERSONA · LA PUERTA DEL AFTER`.
- Línea 14, icono del carril. Para `puerta`, un carácter distinto de `◎`, `↔` y `✦` (por ejemplo `▣`).
- Línea 15, mandos. Este modo no tiene P2: ocultar el mando P2 igual que cuando `mode === 'solo'`.
- Línea 16, ayuda. Un párrafo nuevo, sin reescribir los tres que ya existen: la puerta, la tarjeta, pasar o echar, y que el aforo y el rollo cierran la noche.

Si la bandera es false, `MODES` tiene que seguir siendo los tres modos de ahora. No dejar un botón apagado.

### `src/App.tsx`

- Línea 30, junto al `lazy` de `CollectaHub`. Cargar `./arcade/collecta/nomenoconeso/NomeNoConEso` solo cuando se vaya a mostrar.
- Líneas 77–79, `locationGame`. Añadir `'nomenoconeso'` a la unión y, en el ternario, `value === 'nomenoconeso' ? 'nomenoconeso'` **antes** de la rama `collecta`. Si la bandera es false, no añadir el valor: un `juego=nomenoconeso` desconocido sigue cayendo en la biblioteca, como cualquier juego que no existe.
- Después de `openCollecta` (termina en la línea 328), una función `openNomeNoConEso` copiada de ese patrón con `juego=nomenoconeso` y `setArcadeGame('nomenoconeso')`.
- Línea 424, el `CollectaHub`. Pasar `onPuerta={openNomeNoConEso}`.
- Justo después de la línea 424, el render:

```tsx
{page === 'arcade' && arcadeGame === 'nomenoconeso' && NOMENOCONESO_VISIBLE && (
  <Suspense fallback={<p className="arcade-loading" role="status">Abriendo la puerta…</p>}>
    <NomeNoConEso onBack={openCollecta} />
  </Suspense>
)}
```

No cambiar las ramas de `chase`, `arena` ni `arena-solo` (líneas 427–428). Esas rutas directas se quedan.

### `src/arcade/ArcadeChooser.tsx`

No añadir una quinta portada. Collecta sigue siendo una entrada.

- Línea 7, el array `collecta` de `YEPPO_DARES`. Cuando el modo sea público, se puede sumar un reto. No registra cumplimiento ni da premios, igual que los otros.
- Línea 40, el texto `Arena + Persecución`. Cuando sea público: `Arena, Persecución y NomeNoConEso`. Mientras la bandera sea false, dejar la frase actual.

### `src/testlab/TestLab.tsx`

Línea 11, el párrafo de DANZ Collecta. Actualizar la frase solo cuando el modo sea público. `/test` no abre este modo por un atajo propio ni salta permisos de cuenta, fotos o administración. Se entra por Collecta, como el resto de sus modos.

## 8. Arte y contrato que ya existen

- Portada: seguir con `/arcade/collecta-mobile-v1.webp`, la de «Día de cobro». No generar otra ni cambiar al protagonista. El color del hub es `#efc267` (`CollectaHub.tsx` línea 13).
- El stub ya usa ese tono en `.nnc-stub`. No tiene animación.
- Escena, solo si más adelante hace falta un suelo y no en el MVP de la tarjeta: `bakeClubFloor` y `bakeClubPeople` en `src/arcade/clubArtwork.ts`. Arena los llama en `src/arcade/arena/renderer.ts` líneas 22–23 con `#edbf86`. Persecución, en `src/arcade/chase/renderer.ts` líneas 19–20 con `#e5c488`. Para esta puerta usar `#efc267` y el sprite `club-security-*` (el encargado), no el de Yeppo, salvo cuando el cameo sea Yeppo. Phaser instalado: 4.2.1. El suelo se hornea una vez; no añadir un bucle extra ni desenfoque en tiempo real.
- `ClubRig.tsx` es el SVG de Groove. No hace falta para la puerta.
- Movimiento reducido: `prefersReducedMotion()` en `src/feel/motion.ts`. Pasarlo a `createInitialNightState`. Sin sacudidas ni transiciones. Arena ya lee la media query al crear el renderer (`arena/renderer.ts` línea 11).
- Pausa al ocultar, perder el foco o salir de pantalla completa: el efecto de `src/arcade/arena/ArenaDuel.tsx` líneas 91–117. Giro: `useVersusView` (`src/arcade/useVersusView.ts`) llama a `onRotate`; ahí se despacha `pausar` con motivo `giro` y se sueltan punteros. Aunque aquí no hay dos jugadores, el giro pausa igual.
- Botones de acción a 44 px como mínimo. `touch-action: none` solo en esa fila. Soltar en `pointerup`, `pointercancel` y al pausar. Nada de secuestro de scroll de la página.
- Al ocultar la pestaña, pausar y no dejar un `requestAnimationFrame` vivo. Limpiar el listener al desmontar.

## 9. Orden de trabajo

### MVP — primera partida real

Una noche, la 1. Sin eventos, sin escáner, sin cacheo, sin mejoras y sin cameos (salen en la noche 5).

1. Implementar `generatePerson`, `resolveInspection`, `updateMetrics`, `readEndCondition`, `reduceNight` para `empezar`, `tick`, `decidir`, `pausar`, `reanudar` y `salir`. Dejar los otros `throw` hasta su fase.
2. `applyNightResult` con la regla de la sección 5.
3. Sustituir el cuerpo de `NomeNoConEso.tsx` por la lista y la puerta de la noche 1. Misma salida `onBack`.
4. Cablear hub y `App.tsx` como en la sección 7. Poner `NOMENOCONESO_VISIBLE` en true en ese mismo cambio, no antes.
5. Pruebas de nodo de las reglas: acierto y error de pasar y de echar, menor de edad, aforo que no baja, vibe 0, aforo reventado, objetivos, pausa que no mueve el reloj, semilla repetible, récord que no pisa otras claves.
6. Revisar en el navegador, escritorio y móvil: entrar desde Collecta, jugar la noche, pausar al ocultar, volver a los modos, recargar y ver el récord. No hace falta afirmar FPS ni un teléfono físico si no se ha medido.

### v1 — el resto del diseño cerrado

- Noches 2 a 5 y la curva que ya está en los datos.
- Eventos con sus efectos.
- Escáner y cacheo, con la firma nueva de `resolveScan`.
- `buyUpgrade` entre noches y el pliegue que ya existe.
- Cameos en la noche 5, con los nombres del catálogo.
- La biblioteca solo cambia la frase de la línea 40 de `ArcadeChooser.tsx`. Sigue habiendo una entrada Collecta.

### Después

- Regla de servidor para DANZPOINTS. El cliente sigue sin sumar.
- Gente que sale y baja el aforo.
- Cámaras como norma propia, si el propietario lo cierra (pregunta 2).
- Portada nueva, solo si se aprueba una imagen. Hasta entonces, «Día de cobro».
- Online. No simularlo.
- QR artísticos. Siguen aplazados: no activarlos en este modo.

## 10. Preguntas abiertas

El valor por defecto es el que hay que programar si nadie contesta.

1. **Coste del escáner.** Por defecto, puntos de la noche. El dinero de puerta solo se gasta entre noches. No cobrar las dos cosas.
2. **Cámara oculta.** Por defecto no echa sola (`camara.prohibited` es false). Grabar en abierto sí es `mal-rollo`. Una cámara puede ser una pista falsa, como la purpurina.
3. **Noche fallida.** Por defecto no ingresa dinero ni reputación. El récord de puntuación sí se guarda, también en un cierre duro. Abandonar no guarda récord.
4. **Menor de edad.** La negativa es obligatoria. Solo está abierta la frase, y la actual ya está en `puerta-menor`.
5. **URL directa.** Por defecto el modo se abre desde el hub. `juego=arena`, `juego=arena-solo` y `juego=pilla-pilla` no se tocan. `juego=nomenoconeso` se añade al encender la bandera.
6. **Portada.** Por defecto la ya aprobada. No generar otra en el MVP.

## 11. Criterios de aceptación

### Este esqueleto (hecho al cerrar el PR del scaffold)

- Existe el árbol de la sección 2 y `tsc -b` pasa.
- `tests/nomenoconeso.test.ts` pasa: ids únicos, referencias vivas, dificultades 56, 84, 120, 160 y 209, prohibiciones cubiertas, cameos con el nombre del catálogo, persistencia v1 y migración, bandera en false.
- `App.tsx`, el hub, el selector y `/test` no nombran el modo.
- Las funciones de partida lanzan `NomeNoConEsoPendiente` con su nombre.
- `buildPointsIntent(...).claim === false`.
- No se ha cambiado el comportamiento de Arena, Persecución ni Último turno.

### MVP

- Desde Collecta, con la bandera encendida, se juega la noche 1 hasta un cierre real.
- Pasar a quien no toca baja el rollo y sube el aforo. Echar a quien toca suma puntos. Un menor no entra.
- Vibe 0 o aforo por encima del máximo cierran en el acto con `PARTY OVER / LA PUERTA SE CIERRA`.
- Pausar con el botón, al ocultar la pestaña, al perder el foco o al girar congela el reloj y suelta el dedo.
- Con movimiento reducido no hay sacudida.
- Al volver a entrar, el récord local de la noche 1 sigue ahí y el resto de claves del navegador no se han escrito.
- Arena, Persecución y la biblioteca siguen abriendo lo mismo que antes.
- Las pruebas nuevas de reglas están en `node --test`. La pantalla se ha recorrido en el navegador.

### v1

- Las cinco noches se desbloquean en orden. No se puede marcar la 3 sin la 1 y la 2.
- Cada evento hace el efecto declarado en `data/events.ts` y luego se va.
- El escáner espera, cobra puntos, puede fallar y puede enfadar. El cacheo revela o no, y no decide solo.
- Una mejora no se compra sin dinero, reputación y requisito. La linterna sube la precisión que ya calcula `scannerFromUpgrades`.
- Yeppo, Chicharro (ES), TonyDawgs, Wizme y LEÖN pueden salir en la noche 5 con el nombre exacto del catálogo.
- Sigue sin haber una portada nueva en la biblioteca y sin puntos concedidos.

### Después

- Ningún punto de DANZPOINTS cambia sin una regla de servidor y una prueba de esa regla.
- No se presenta un modo online ni una portada nueva como hechos si no están.
