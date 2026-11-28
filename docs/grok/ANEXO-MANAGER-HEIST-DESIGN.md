# ANEXO · MANAGER HEIST — DESIGN (escrito por Grok en el hilo 14)

> Copia del archivo que generó Grok (versión actualizada el 17/11 con el contexto del bot). AVISO: la dirección visual «pixel art Metal Slug» está SUPERADA; la vigente es zombi-club en 3D cartoon cenital.

# MANAGER HEIST — Design Document Completo
**Extraction + Bluff** · ARCADANZ / Vinyl Survivors  
Estado: diseño de gameplay cerrado. Arte y assets gráficos pendientes (el usuario los facilitará).

---

## 1. Visión
Modo de extracción ligero con bluff. Entras en un after, localizas loot de alto valor y sales vivo. Puedes aliarte o traicionar. Partidas cortas (5-8 min), tensión alta. Encaja en el universo DANZ: afterparties, managers dudosos, cabina, humor directo.

No es un shooter pesado. Es más cercano a un extraction-lite con decisión social y movimiento táctico. Pixel art Metal Slug + afterparty cuando llegue el arte.

## 2. Core Loop
1. Spawn en el after (punto de entrada seguro o semi-seguro).
2. Explorar, recolectar información y loot.
3. Decidir: ir a por el premio gordo, aliarte, traicionar, o extraer temprano.
4. Llegar a un punto de extracción activo y salir (o morir).
5. Resultado: loot extraído × multiplicadores (tiempo, alianzas, traiciones, riesgo).

Duración objetivo: 5-8 minutos. Si superas el límite, el after se cierra y todo se vuelve hostil.

## 3. Jugador
- Movimiento libre (top-down o side-view según arte final; por defecto top-down para extracción).
- Acciones básicas: mover, interactuar (coger loot, abrir puertas, activar), usar objeto, alianza/bluff, extraer.
- 3 puntos de aguante (vidas). Al llegar a 0: **PARTY OVER**.
- Inventario limitado (3-5 slots de loot de alto valor + consumibles).
- Puede llevar 1 “fake” (contrato falso, loot falso) para bluffear.

## 4. Sistemas principales

### 4.1 Extracción
- Múltiples puntos de extracción por mapa (van, taxi, puerta trasera, rooftop, salida de servicio).
- Se activan/desactivan dinámicamente (algunos se abren con el tiempo, otros se cierran, otros requieren VIP pass o bribe).
- Extraer es una acción de canal (2-4 segundos). Interrumpible.
- Bonus de extracción temprana vs. tardía: más tiempo = más multiplicador de riesgo, pero más peligro.
- Puedes extraer con poco loot. No hay castigo por salir pronto.

### 4.2 Bluff y Alianzas
- **Alianza temporal**: acción de proximidad o emote. Durante 30-60 segundos no os atacáis y compartís visión básica del entorno cercano.
- La traición se puede ejecutar en cualquier momento (especialmente cerca de un punto de extracción).
- Quien traiciona obtiene multiplicador de loot pero queda marcado (más agresividad de ciertas facciones el resto de la partida).
- **Bluff activo**:
  - Mostrar contrato/fake.
  - Fingir ruta de extracción.
  - Ofrecer sample o merch.
- Diferentes facciones reaccionan distinto (ver tabla).

### 4.3 Loot y Objetivos
Loot de alto valor (los que cuentan para el resultado final):
- Vinilos legendarios → powers (alimentan Vinyl Survivors).
- Samples / stems raros → mejoras de power.
- Contratos / blackmail → leverage (abrir puertas, forzar alianzas).
- Merch exclusivo → buffs temporales.
- VIP passes → acceso.
- Rescates → bonus fijo + lore.
- Audio logs → información de mapa + lore.

Consumibles / equipo:
- Smoke canister, headphones (mute feedback), lasers portátiles, enhancers (buff fuerte + riesgo).

Objetivo principal: extraer al menos 1 ítem de alto valor.  
Objetivos secundarios: traicionar, rescatar, salir con máximo multiplicador.

### 4.4 Facciones y AI
Cada mapa tiene 1-2 facciones dominantes + wildcards. Comportamientos definidos en la tabla de la spec anterior (Managers, Bouncers, Influencers, Crews, Técnicos, Resacas, Groupies, Suits, Ecos).

AI básica:
- Patrulla / zona de control.
- Reacción a ruido, a ver loot, a alianzas visibles.
- Prioridad de objetivos (ej. Influencers priorizan jugadores con loot raro).
- Escala de agresión con el tiempo de partida.

### 4.5 Ambiente vivo
- La música baja progresivamente → más resacas, menos luz, más ecos.
- Smoke machines, lasers de escenario, crowd (puede servir de cobertura o daño).
- Zonas de feedback (técnicos) que distorsionan movimiento o audio del jugador.

## 5. Mapas (diseño de gameplay)
**After de estudio**  
Pasillos estrechos, mesas de mezclas, cables. Dominantes: Técnicos + Crews rivales.  
Extraction: puerta trasera / van callejón.  
Peligro: zonas de feedback, cabinas ocupadas.

**After de terraza / festival**  
Más abierto, humo, lasers, crowd. Dominantes: Influencers + Bouncers + Suits.  
Extraction: rooftop / taxi.  
Peligro: marcado por influencers, drones, escaleras bloqueadas.

Más mapas se pueden añadir rotando facciones sin cambiar el sistema.

## 6. Modos
- **PvE**: tú vs after (IA).
- **Mixto**: 1-2 jugadores + IA.
- **PvP ligero**: 2-4 jugadores, todos buscan el mismo loot o extracciones contestadas. Bluff más fuerte.

## 7. Resultado y progresión de partida
Resultado = (valor de loot extraído) × (multiplicador de tiempo) × (bonus alianza o traición) × (bonus riesgo).

Récord local. Sin DANZPOINTS directos (igual que otros arcade).

## 8. Integración
- Misma arquitectura que AfterDrop / Groove Ninja: lógica pura + componente React/Canvas.
- Entrada en ArcadeChooser.
- Powers de vinilos pueden transferirse o desbloquearse en el modo principal de Vinyl Survivors.
- Cumple contrato de juegos: PARTY OVER, pause, reduced-motion, móvil primero, records locales validados.

## 9. Checklist para pasar a técnico
- [x] Core loop definido
- [x] Sistemas de extracción, bluff, loot y facciones cerrados
- [x] Mapas de ejemplo con gameplay
- [x] Condiciones de victoria/derrota
- [ ] Arte y assets (usuario facilita)
- [ ] Prototipo de movimiento + extracción
- [ ] Sistema de alianza/traición
- [ ] AI básica de 2-3 facciones

Cuando el arte esté disponible y el diseño se confirme, se pasa a prototipo técnico.

## 10. Notas abiertas (para cerrar si hace falta)
- ¿Top-down o side-view preferente?
- ¿Cuántos jugadores máximos en PvP ligero?
- ¿Los powers de vinilos se usan dentro de Heist o solo se extraen?

---

Diseño de gameplay cerrado. Listo para arte y después técnico.
