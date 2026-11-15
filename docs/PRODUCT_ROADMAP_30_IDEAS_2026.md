# DANZ Collective — revisión de producto y 30 oportunidades (2026-11-15)

**Estado:** documento de planificación, no implementación. Todos los elementos numerados a continuación son propuestas a menos que indiquen explícitamente «ya existe, mejorar». No atribuir integraciones, premios ni compras funcionales hasta verificarlos.

**Revisión del 15 de noviembre:** el estado vigente y las decisiones posteriores
se mantienen en [Revisión y pendientes](REVISION_Y_PENDIENTES_DANZ_2026-11-15.md).
Las diez mejoras M01–M10 están aceptadas como línea de trabajo progresiva. Las
funciones nuevas y juegos propuestos conservan su alcance y estado individual.

## Situación comprobada en código
- PWA React/Vite con Inicio, Pasaporte, Fotos, Arcade, Danzers, Danz In, Danzflor, DanzPoints y Cuenta.
- Login Google/correo, galería pública/privada, administración con MFA y gestión de fotografías por lotes.
- Sellos QR y pases por evento; canjes y funciones condicionados a servidor/configuración.
- Snake «LA QUE HAS LIAO, JACK» con competición; Groove Ninja Vinyl Cut, Scratch y Destrucción con ocho armas.
- Reproductor de seis temas y DANZ Shop con catálogo y preparación comercial.
- Yeppo mascota animada en todas las secciones, guía determinista, paseo opcional, buzón privado de sugerencias/errores.
- Yeppo **no** usa todavía IA generativa. No se deben instalar costes, claves o servicios sin autorización. Las dos portadas finales aprobadas ya están integradas, con copias optimizadas para móvil (PR 26).

## 10 mejoras a lo existente
| # | Mejora | Prioridad | Esfuerzo | Criterio de éxito |
|---|---|---|---|---|
| M01 | Acceso Google/Apple/correo y retorno entre navegadores | P0 | Alto | Login, enlace/código y recuperación probados en Safari iOS, Chrome Android y navegador integrado |
| M02 | Galería rápida para redes móviles: miniaturas y carga progresiva | P0 | Medio | Abre un álbum grande sin descargar originales hasta solicitarlos |
| M03 | Galerías: filtros por fiesta, fecha y favoritas + mejor visor | P1 | Medio | Encontrar una foto en pocas acciones sin sacrificar privacidad |
| M04 | QR y pasaporte resistentes a conexión intermitente | P0 | Medio | Pases pendientes recuperables, mensajes claros y sin sellos duplicados |
| M05 | DANZPOINTS auditables y protegidos contra abuso | P0 | Alto | Cada cambio de puntos tiene origen, idempotencia y validación en servidor |
| M06 | Arcade accesible, táctil y fluido: controles, FPS y efectos adaptativos | P0 | Medio | 60 FPS orientativo en equipos medios; modo reducido de efectos |
| M07 | Groove Ninja: ocho armas realmente diferentes y equilibrio del modo Destrucción | P0 | Medio | Cada arma con arte, efecto, sonido opcional, lógica diferenciada y pruebas táctiles |
| M08 | Yeppo: animación con intención, navegación, ayuda y menos intrusiones | P0 | Alto | Camina, señala sin activar UI, opt-in y respeta juegos/diálogos/reduced motion |
| M09 | Panel admin: una única bandeja de moderación y tareas, prioridades y filtros | P1 | Medio | Fotos sensibles e incidencias visibles, ordenables y trazables |
| M10 | PWA: instalación, accesibilidad, caché y observabilidad de errores | P1 | Medio | Pruebas E2E estables, flujos offline honestos, accesibilidad y rollback |

## 10 nuevas funciones para la aplicación
| # | Idea | Prioridad | Esfuerzo | Valor |
|---|---|---|---|---|
| N01 | **Yeppo IA real** con backend seguro, herramientas de solo lectura y escalado a administración | P0 | Alto | Respuestas conversacionales y tickets útiles; consentimiento, límites y costes |
| N02 | **Mi DANZ**: línea de tiempo privada de fiestas, sellos, fotos favoritas y logros | P1 | Alto | Motivo para regresar y recuerdos duraderos |
| N03 | **Misiones colectivas** optativas por evento (sin trampas, sin ventajas de pago) | P1 | Medio | Animar participación dentro y fuera de Arcade |
| N04 | **DANZ Radar**: calendario unificado de fiestas, DJs y colaboradores + recordatorios | P0 | Medio | Descubrir fiestas y evitar perder eventos |
| N05 | **Muro de la fiesta**: mensajes, fotos seleccionadas y reacciones moderadas | P1 | Alto | Crear comunidad sin exponer fotos privadas |
| N06 | **Recompensas sorpresa** limitadas por evento desde pasaporte (validación QR segura) | P1 | Alto | Gamificación con valor real y sin personal extra en puerta |
| N07 | **Mi equipo / retos amistosos** para competir con amigos con consentimiento | P2 | Medio | Competición sana y retorno recurrente |
| N08 | **DANZ Radio Live**: indicar tema/DJ en tiempo real desde metadatos autorizados | P1 | Medio | Música integrada con la fiesta; sin afirmar reconocimiento Shazam |
| N09 | **Wishlist y avisos de drops de DANZFLOR**, tallas y reservas | P1 | Medio | Mejor experiencia de catálogo antes de habilitar pagos |
| N10 | **Aftermovie interactivo** por evento con fotos/vídeos autorizados y créditos | P2 | Alto | Recuerdo compartible y promoción del colectivo |

## 10 juegos inspirados en clásicos — diseños originales DANZ
| # | Juego propuesto | Referencia de género | Mecánica DANZ | Esfuerzo |
|---|---|---|---|---|
| J01 | **DANZ Pinball** | Pinball | Bola-flor, bumpers de vinilos, misiones DJ y multibola | Alto |
| J02 | **Break the Beat** | Rompeladrillos | Pelota luminosa que rompe cajas de sonido, combos al beat | Medio |
| J03 | **Yeppo Invaders** | Matamarcianos | Defender escenario de altavoces rebeldes, jefes de nivel | Medio |
| J04 | **Flor Blocks** | Puzle de bloques descendentes | Patrones florales y modos de desafío temporal | Medio |
| J05 | **Pong Collective** | Pong | 1v1 local y opciones en línea con anti-lag | Bajo/Medio |
| J06 | **Backstage Maze** | Laberintos de persecución | Recoger pases y escapar del cable Jack | Alto |
| J07 | **DANZ Dominó** | Juego de mesa | Partidas asíncronas entre asistentes y amigos | Alto |
| J08 | **Memoria de la Crew** | Parejas / cartas | Emparejar caras consentidas, logos o vinilos | Bajo |
| J09 | **Yeppo Pilla-Pilla** | Persecución y escape | Duelo, obstáculos y cambio de papeles; primero dos personas en un móvil | Alto |
| J10 | **DANZ Kart Mini** | Carreras arcade de vista cenital | Circuitos de estudio y club, obstáculos, power-ups originales | Alto |

## Orden de ejecución propuesto
**Sprint A — Fiabilidad y espectáculo (sin coste externo):** M07, M08, M10; pruebas end-to-end del acceso y galerías (M01/M02); subir únicamente las portadas finales aprobadas (no volver a generarlas).

**Sprint B — Utilidad y participación:** M04, M05, N04, N09, J08 y J09; mantener premios sujetos a reglas y capacidad administrativa.

**Sprint C — Identidad y comunidad:** N01 solo después de decidir proveedor y presupuesto; integrar su backend con permisos mínimos, moderación, límites por usuario y registro privado. Continuar N02, N03, M09.

**Sprint D — Más juegos:** priorizar J02 (visual), J01 (pieza insignia), J05 (social). Evitar sacar muchos minijuegos medio terminados.

## Seguridad y experiencia obligatorias
- No publicar localización en tiempo real, etiquetas o información privada sin control granular.
- Yeppo nunca activa botones críticos ni envía reportes sin confirmación; nunca interrumpe partidas.
- No vincular puntos o premios directamente a puntuaciones locales sin validación de servidor.
- Los nuevos juegos usarán arte y diseño originales, sin copiar material protegido.
- Nunca dar por superada toda la suite Playwright si sigue fallando; distinguir CI parcial de validación en móvil.
