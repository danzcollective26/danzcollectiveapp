# ARCADANZ — flujo guiado de IA y desarrollo (20/11/2026)

**Aplicar junto con** `AGENTS.md` y `docs/DECISIONES_VIGENTES.md`. No reemplaza las tareas de GitHub ni confiere acceso a herramientas o modelos no disponibles en una cuenta.

## Objetivo
Maximizar calidad con el menor número de llamadas caras: **razonar profundamente una vez**, diseñar una propuesta aprobable, implementar en lotes, comprobar automáticamente y revisar una sola vez en móvil antes de fusionar. No modificar portadas, fotos, identidades ni mecánicas aprobadas sin permiso.

## Enrutamiento recomendado de tareas
| Tipo | Modo recomendado | Resultado comprobable |
|---|---|---|
| Bug CSS, textos, estados de botones, ajustes pequeños | GPT-6 Instant/Medium o Codex | Diff pequeño, build y prueba del componente |
| Mecánica nueva, física, economía de puntos, matchmaking, seguridad, arquitectura | GPT-6 High/Extra High, o Pro/Astra si el usuario lo selecciona | Documento corto: objetivo, alternativas, riesgos, criterios de aceptación |
| Diseño artístico premium: portada, personajes, escenarios, interfaz | GPT-6 High/Extra High para dirección artística + generación de imágenes y Figma para piezas visuales editables | Referencias, bocetos originales, variantes aprobables, lista de assets |
| Aplicación del diseño a un juego existente | Codex en rama GitHub, consultar Context7 para API del motor, usar Figma | Código real y pruebas táctiles sin perder gameplay |
| Comparación de motores/algoritmos/librerías/licencias | Búsqueda web + Context7; Perplexity como contraste opcional cuando aporte nuevas fuentes | Recomendación con referencias, fecha, costes y licencias |
| Revisión de PR o bug difícil | Modelo de razonamiento alto o Pro/Astra si está disponible, revisión independiente por Grok | Riesgos reales detectados, pruebas que reproducen el fallo |
| Tests, pequeñas regresiones, traducciones | Codex/GitHub Actions y pruebas ya existentes | CI verde, sin necesidad de modelo caro |

**Importante:** una issue o instrucción de GitHub **no puede forzar el selector de GPT-6 Extra High o Astra en ChatGPT**. Si el usuario desea ese modelo, lo selecciona en su menú antes de la sesión; la disponibilidad depende del plan y del producto. El prompt puede recomendar el nivel, no garantizar que se use. Las integraciones por API necesitarían claves, límites y presupuesto autorizados por separado. No enviar tareas a modelos de pago en automático.

## Pipeline repetible por juego
1. **Issue** `[ARCADE] JUEGO — OBJETIVO`: problema, mecánica, plataforma, assets existentes, qué NO cambiar, evidencia visual aprobada, alcance de la fase y modelo/nivel sugerido.
2. **Diseño de sistema (pensamiento alto, una vez)**: física, bucle de juego, controles, recompensas, progresión, modos, restricciones de rendimiento y de privacidad. Máximo 1–2 propuestas concretas, no 20 ideas genéricas.
3. **Dirección gráfica y prototipo**: crear piezas originales con generación visual y Figma; siempre respetar caras, logos y portadas aprobados. Solo incorporar assets aprobados y con derechos.
4. **Implementación**: Codex o herramienta programadora en una rama propia. Consultar Context7 antes de tocar motor/controles; no duplicar motores ni pantallas. Commit pequeño por funcionalidad.
5. **Pruebas**: `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:pwa` según el cambio; FPS, latencia táctil, pantalla completa, safe areas, orientación, PAUSA, volver, offline. Mantener `/test`.
6. **Revisión**: preview estable, móvil del propietario y una sola lista agrupada; reparar sin fusionar hasta aprobación.
7. **Entrega**: link PR, commits, visuales, informe «implementado / probado / pendiente / revertir»; actualizar issue y decisiones vigentes.

## Presupuesto y optimización
- El nivel por defecto es **el más barato que cumpla la tarea**. Extra High o Astra solo para decisiones difíciles, grandes auditorías o bloqueos de alto impacto. No relanzar el razonamiento completo tras cada ajuste.
- Perplexity solo como comprobación puntual cuando la primera investigación sea insuficiente, nunca repetir búsquedas idénticas entre cuatro modelos.
- No instalar más herramientas si GitHub Actions, Playwright, Figma, Vercel, Supabase, Context7, generación gráfica o Codex resuelven el caso.
- No aprobar servicios de pago, tokens externos ni claves desde PR/issue. El propietario autoriza costes.
- Trabajar 3–4 tareas relacionadas y ofrecer **una revisión conjunta**.

## Ficha estándar para GitHub (copiar en nueva issue)
```md
### Juego / función:
### Objetivo jugable y criterio de diversión:
### Capturas/assets aprobados (no modificar):
### Mecánicas y restricciones actuales:
### Nueva mejora exacta:
### Modelo recomendado (no activado automáticamente):
### Herramientas existentes:
### Criterios de aceptación (móvil, performance, UI, privacidad):
### Pruebas obligatorias:
### Estado: propuesta / implementación / build / E2E / revisión móvil / aprobada:
### PR de pruebas / rollback:
```

## Aplicación a juegos actuales
- **DANZPORTER**: razonamiento alto para física, transporte, cámara primera persona, navegación y progresión; Codex en motor real; Figma/assets para HUD y escenarios; pruebas de conducción táctil y FPS.
- **Groove Ninja**: razonamiento alto para patrones de BPM, especiales, ritmo y dificultad; recursos visuales de vinilos/cortes; pruebas de 60s, combos, vida, latencia.
- **Snake / Jack**: conservar portada y rostro aprobado; decidir niveles/gestos/IA de laberinto con razonamiento alto si necesario, usar pruebas para respuesta al toque.
- **Yeppo**: diagnosticar primero test intermitente de colisión/scroll; evitar rediseñar personaje ya aprobado.
- **DANZ Kart / multijugador**: arquitectura y sincronización primero; visuales después; evitar prometer 1vs1 online sin presupuesto de backend y pruebas de latencia.

## Revisión y gobierno
Una sola decisión del propietario por bloque; jamás fusionar ni sustituir diseños aprobados sin esa autorización. Un reporte de compilación no equivale a test en móvil real. Compartir estado de ejecución y decir expresamente cuándo se detiene el trabajo.
