# AFTER DROP — decisión e integración, 17/11/2026

Juego nuevo de ARCADANZ. Implementado en `feature/afterdrop`. No está publicado:
el propietario aprueba el merge. No toca `main`.

## Qué había antes

Búsqueda en `main` y en el resto de ramas (`git grep -i afterdrop` sobre
`refs/remotes/origin`, más el historial): no hay código, ruta, prueba ni
documento de After Drop. GitHub tampoco indexa esa cadena en la rama por defecto.

`feature/manager-heist` (PR 52, abierto, sin fusionar) es otro juego: vista
cenital, bluff y extracción en un after. Su diseño no contiene la frase
«Misma arquitectura que AfterDrop / Groove Ninja». Comparte humor de after,
`PARTY OVER` y la idea de sacar el botín, y no se ha copiado ni se ha mezclado
con esta rama. After Drop no reutiliza su motor.

## Decisión: juego propio

After Drop es una entrada propia de la biblioteca, no un modo de Groove Ninja
ni de DANZ Collecta.

- Groove ya tiene Vinyl Cut, Scratch y Destrucción. Meter aquí una caída de
  tres carriles mezclaría el corte de vinilos con una sesión de 3 a 8 minutos.
- Collecta es el duelo de cierre (Arena y Persecución). After Drop es de una
  sola persona.
- El contrato del juego pide lógica pura, récord con su espacio y salida por
  `onExit`. Encaja como pieza lazy, igual que Kart o Collecta.

Motor: Phaser 4.2.1, el mismo que Arena y Persecución. La caída es un corredor
en perspectiva (el horizonte arriba, tres calles que se abren abajo). Three.js
ya lleva DANZPORTER; aquí no aporta choques ni cámara libre, y en un móvil
medio pesa más de lo que se ve. La lógica no importa Phaser: los tests la
ejercitan sola.

## Cómo se juega

Ruta directa: `/?seccion=arcade&juego=afterdrop`. En el móvil, `/test` → AFTER DROP.
La biblioteca abre la misma partida.

Tres carriles. El jugador cae por un drop que no acaba. Los vinilos llegan al
beat: **PERFECTO** (±70 ms) sube más el combo y el botín que **BIEN** (±140 ms).
Fuera de eso, **FALLO** rompe el combo. Haters, resacas y managers ocupan un
carril; si estás ahí al cruzar la línea, pierdes una vida y parte del botín
suelto. Tres golpes, u 8 minutos sin extraer, es **PARTY OVER**: el récord no
se mueve.

**EXTRAER LOOT** se mantiene un instante. Guarda `botín × multiplicador` y
termina la caída. El multiplicador crece con el tiempo y el combo (tope ×5,5).
Seguir cayendo paga más y arriesga lo que aún no has guardado. El ritmo pasa
de 96 a 148 BPM y el reparto mete más amenazas. Los primeros segundos son un
ensayo de vinilos, el primero por el centro.

Controles: toque de carril (también recoge), desliz lateral, flechas o A/D,
abajo/espacio/K para coger, E para extraer. Pausa al ocultar la pestaña, perder
el foco, girar el móvil o pulsar Escape. El silencio es solo de esta partida.
Si el sistema pide reducir movimiento, no hay sacudida ni chispas.

Récord local `danz-afterdrop-record-v1`: esquema 1, puntuación entera y combo,
con tope y rechazo de valores rotos. Solo se escribe al extraer. No hay
DANZPOINTS ni sala online. El aviso de progreso (`loot-extracted`,
`perfect-streak`) es informativo; la app no lo convierte en puntos.

## Arte y sonido

Portada, cabina, vinilos y figuras son dibujo procedural de esta entrega
(SVG y Phaser). El audio es síntesis en el estilo de `GrooveAudio`, enganchada
al reloj del beat. No hay samples, stems, fotos de terceros ni modelos de pago.
Se pueden sustituir la portada y los glifos sin tocar las reglas. No se ha
usado Hugging Face: no hay un conector activo en este entorno y el encargo pide
síntesis propia, reemplazable.

## Límites

No hay teléfono físico, medición de FPS en un dispositivo ni escucha real del
audio. La partida es local y de una persona. La portada es un cartel de trabajo,
no una ilustración aprobada como las de Jack, Groove, Collecta o DANZPORTER.
El online no existe y no se presenta como listo.
