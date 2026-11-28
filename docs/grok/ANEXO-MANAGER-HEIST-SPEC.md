# ANEXO · MANAGER HEIST — SPEC (escrito por Grok en el hilo 14)

> Copia del archivo que generó Grok. AVISO: la dirección visual «pixel art Metal Slug» está SUPERADA; la dirección vigente es zombi-club en 3D cartoon cenital (ver 00-LEEME, sección Manager Heist).

# MANAGER HEIST — Extraction + Bluff
Especificación ligera para ARCADANZ / Vinyl Survivors.

**Concepto**  
Entras en un after controlado por gente dudosa. Localizas loot de alto valor (vinilos legendarios, stems, contratos, merch, rescates…) y sales vivo. Puedes aliarte o traicionar. Partidas cortas (5-8 min), tensión alta, pixel art Metal Slug + afterparty DANZ. No es siempre el mismo manager ni el mismo enemigo. El after es una zona liminal donde se cierran los tratos de verdad.

Tono: directo, cómplice, humor de cabina. No infantil ni corporativo.

## Reglas base
- Sesión 5-8 minutos. Intensidad sube con el tiempo (más enemigos, menos luz, más resacas).
- Objetivo principal: localizar 1-3 ítems de alto valor y llegar a un punto de extracción vivo.
- 3 vidas / barra de “aguante”. Al llegar a 0: **PARTY OVER**.
- Botón / acción **EXTRAER**: cierra la sesión con bonus por loot × tiempo restante × alianzas (o traiciones).
- Puedes extraer temprano (más seguro, menos loot) o aguantar (más riesgo, más premio).
- Récord local `danz-manager-heist-record-v1`. Namespace propio. Sin DANZPOINTS directos.
- Controles táctiles primero (móvil). Pausa al salir / ocultar pestaña. Audio solo tras gesto.

## Facciones (rotativas por mapa)
No siempre las mismas. Cada after tiene su mezcla dominante + wildcards.

| Facción | Comportamiento | Reacción a bluff / alianza |
|---------|----------------|----------------------------|
| Managers Dudosos | Trajes, contratos, cierran puertas | Ofrecen tratos falsos. Se pueden sobornar o traicionar |
| Bouncers | Fuertes, lentos, bloquean pasillos | Poco bluff. Se distraen con crowd o smoke |
| Hype Beasts / Influencers | Te marcan, graban, doxean | Si muestras loot raro te persiguen. Se pueden engañar con fakes |
| Crews de DJs rivales | Scratches, decks como armas | Se alían si ofreces sample. Traicionan fácil |
| Técnicos de sonido | Feedback, zonas de audio muerto | Controlan zonas. Se pueden “hackear” con equipo |
| Resacas / zombies de after | Lentos, en masa | Aparecen cuando baja la música. Se usan como distracción |
| Groupies / fans | Te ralentizan, te persiguen | Útiles como proyectiles contra otros |
| Suits corporativos | Drones, cease & desist | Más en afters grandes. Fríos, poco bluff |
| Ecos de afters pasados | Atraviesan paredes, tracks viejos | Confunden o buffean. Poco interactivos |

## Loot (más allá de vinilos)
- **Vinilos legendarios**: powers auto (como Vinyl Survivors). Premio gordo.
- **Samples / stems raros**: mejoran o desbloquean powers al extraer.
- **Merch exclusivo**: buffs temporales (velocidad, silenciamiento, armadura visual).
- **Contratos / blackmail**: leverage para forzar alianzas o abrir puertas.
- **VIP passes / guest lists**: acceso a zonas restringidas.
- **Cash / hype del after**: bribes o info.
- **Equipo**: headphones (mute ruido), lasers portátiles, smoke canisters.
- **Rescates**: gente del colectivo. Bonus + lore.
- **Audio logs**: pistas de extraction y lore.
- **Enhancers**: buff fuerte temporal + riesgo (te marcan o te traicionan más fácil).

## Mecánicas de tensión y bluff
- **Puntos de extracción múltiples y móviles**: van, taxi, puerta trasera, rooftop. Se abren/cierran. Contestable.
- **Alianzas temporales**: proximidad o emote. Durante X segundos no se atacan y comparten visión básica. La traición se hace en el punto de extracción (o antes). El traidor se lleva más pero queda marcado.
- **Bluff real**: fakes de contratos, mostrar loot que no tienes, fingir ruta de extracción. Managers e influencers reaccionan distinto.
- **Ambiente vivo**: música baja → más resacas y menos luz. Smoke = cobertura. Crowd como distracción o daño. Lasers de escenario activables.
- **Sesión que se cierra**: si tardas demasiado, todo se pone hostil. Extraer temprano es válido.
- **Modos**: PvE puro, mixto (jugadores + IA), PvP ligero (2-4 jugadores, todos quieren el mismo premio).

## Mapas de ejemplo
**1. After de estudio (técnicos + rivales)**  
Pasillos estrechos, mesas de mezclas, cables por el suelo. Técnicos controlan zonas de feedback. Crews rivales en las cabinas. Extraction: puerta trasera o van en el callejón. Loot: stems + merch de estudio.

**2. After de terraza / festival grande (influencers + bouncers + suits)**  
Más abierto, humo, lasers, crowd. Influencers te marcan si te ven con loot. Bouncers en escaleras. Suits con drones. Extraction: rooftop o taxi abajo. Loot: vinilos legendarios + contratos.

## Integración (propuesta)
- Lógica pura + componente React/Canvas (mismo estilo que AfterDrop / Groove Ninja).
- Añadir a `ArcadeChooser` como entrada nueva.
- Portada: pixel Metal Slug + afterparty (manager dudoso, vinilos, smoke, lasers, flor DANZ).
- Cumple contrato: onExit, pause audio/RAF, reduced-motion, local records validados, PARTY OVER, móvil primero.
- Powers de vinilos pueden alimentar el modo principal de Vinyl Survivors.

## Próximos pasos
1. Prototipo de movimiento + extracción + 1 facción.
2. Sistema básico de alianza / traición.
3. Dos mapas pequeños.
4. Portada y entrada en biblioteca.
5. Auditoría móvil /test.

El after no es solo managers. Es donde se roba, se miente y se sale vivo.
