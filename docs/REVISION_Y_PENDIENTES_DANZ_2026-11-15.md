# DANZ Collective — revisión general y registro de pendientes

**Actualización:** 16 de noviembre de 2026, Europe/Madrid.
**Propósito:** mantener en un lugar las peticiones del propietario, las entregas
comprobadas, lo pendiente y lo aplazado. Este es el registro general vigente;
las especificaciones antiguas siguen siendo referencias históricas.

## 1. Primero: trabajo de Arena con Gemini

- [Memoria completa de Arena DANZ](https://chatgpt.com/library?file_id=libfile_453f366222a081918786ed22444eea9d&account_id=personal).
- [Kit de Arena con código, recursos y pruebas](https://chatgpt.com/library?file_id=libfile_00b6adffda688191b9f5cb66a86485ce&account_id=personal).
- Subir el ZIP a Gemini y usar el mensaje de inicio incluido en la memoria.
- Cuando vuelva el resultado, revisar el ZIP y adaptar únicamente Arena en una
  rama; conservar los cambios posteriores de Jack, Groove, cuenta, radio y app.
- El kit es la instantánea de Arena de `14cc38d` (PR 27), no una copia completa
  de la app ni una entrega de Gemini ya integrada.

## 2. Cómo leer los estados

| Estado | Significado |
| --- | --- |
| Publicado | Hay entrega incorporada a la app; se indica evidencia. No equivale a prueba física de todos los dispositivos. |
| Parcial | Existe una base, pero faltan requisitos concretos enumerados. |
| Pendiente | Trabajo acordado o conservado en la hoja de ruta sin implementación completa. |
| Por comprobar | Hay código o constancia histórica; falta confirmar el funcionamiento actual concreto. |
| Aplazado | Decisión explícita de no dedicarle trabajo ahora. |
| Externo | El propietario puede desarrollarlo en otra IA; la integración aquí sigue pendiente. |

P0 = incidencia o fiabilidad prioritaria; P1 = siguiente desarrollo; P2 = fase
posterior. Una prioridad orienta el orden, no promete una fecha.

## 3. Prioridad inmediata y siguiente trabajo

Solicitud posterior del 16/11: **feature/premium-feel**, con commits separados
y PR. PF01: transiciones/haptics/esqueletos; PF02: carga progresiva, miniaturas
y favoritas; PF03: Yeppo menos intrusivo y celebración de sellos confirmados.
Implementación y validación en revisión, sin presentarla como publicada en main.
Detalle: `PREMIUM_FEEL_2026-11-16.md`. Scratch continúa conservado en PR 47,
con CI 239 correcto, separado de esta rama.

| ID | Petición | Estado comprobado | Siguiente acción / cierre |
| --- | --- | --- | --- |
| R01 | Entregar primero la memoria y kit para Gemini | Entregado; archivos existentes comprobados | Enlaces reenviados al inicio de la respuesta; esperar el ZIP de retorno para integrarlo. |
| R02 | Revisar intensivamente lo hablado para no perder tareas | Revisión completada; seguimiento permanente | Conversaciones, traspasos, código y publicaciones contrastados; mantener este registro y sus estados. |
| S01 | Quitar los recuadros extraños alrededor de Snake y rostros | Publicado y verificado, PR 29 | Retirados borde/fondo de cabeza, aro y animación heredada de sombra rectangular; comprobados recogida, giro y móvil. |
| G01 | Continuar mejoras de Jack y Groove | Parcial; primera entrega publicada | Cerrar S01; conservar optimización y especiales. Completar pendientes específicos G02–G07, sin afirmar que todo está terminado. |
| A01 | Arena con estética propia y duelo 1vs1 | Beta local publicada; mejora gráfica externa preparada | Gemini continúa el módulo; revisar arte, mapas y controles antes de integrarlo. |
| J09 | Persecución, dentro de DANZ Collecta | Beta local implementada y validada en CI 180; publicado y verificado, PR 30 | Captura/cambio de roles, obstáculos, sprint y dos mandos enfrentados. Mantener el arte de personajes beta separado del acabado definitivo. |
| J10 | DANZPORTER (antes DANZ Kart Mini) | Carrera local, conducción y cámaras publicadas, PR 35–41 | Tres modos, dos circuitos, piezas, daños, boxes, vista Rally y primera persona. CI 225: 246 internas, 552 de navegador y 16 offline correctas. GPU y móvil físico en T01; online y contenidos adicionales separados. |
| PF01 | Sensación de app instalada, galería y Yeppo | Implementado en rama, no publicado | Ver sección 23. Falta prueba en teléfono físico. No cierra M02, M03, M08 ni M10. |

## 4. Lo ya publicado que debe conservarse

| Área | Base comprobada | Evidencia principal |
| --- | --- | --- |
| Compartir la app | PWA en `https://danzcollectiveapp.vercel.app`; prueba en `/test` | Proyecto Vercel `danzcollectiveapp`, producción READY al iniciar esta revisión. |
| Biblioteca ARCADANZ | Jack, Groove y Collecta; Arena y Persecución se eligen dentro de Collecta | PR 26 y PR 30; apertura inmersiva, retorno a modos y biblioteca, `/test` y enlaces directos. |
| Portadas | Jack y Groove conservan las exactas aprobadas; Collecta incorpora «Día de cobro» | PR 26 y PR 30; imágenes completas y copias móviles optimizadas. No regenerarlas ni intercambiar protagonistas. |
| Snake / Jack | Clásico, 19×19, 12 recorridos, giro inmediato, cola de giros, mando opcional, pausa y flor; 10 hojas de 3 expresiones | `src/snake.ts`, `src/arcade/SnakeCells.tsx`, `src/content/collective.json`, pruebas de Snake. |
| Competición de Snake | Tickets, repetición de movimientos validada en servidor y ranking; correo e Instagram verificados | `useSnakeCompetition.ts`, migraciones y `ARCADANZ_COMPETICION_2026-11-12.md`. El replay no impide por sí solo todos los bots. |
| Groove | Vinyl Cut, Scratch Session y modo experimental Destrucción; Combo Disc ×2 y Split Disc añadidos | PR 28; motores separados. Puntuación local de Groove, sin premios competitivos integrados. |
| Yeppo | Guía local, buzón privado, preferencias, tres paseos, contacto con tarjetas y cierre fijo de 44 px | PR 24–26; `src/yeppo/`. No es IA generativa ni personaje 3D. |
| Instagram oficial | Enlace de vinculación corregido a **@danz.collective** | PR 28; perfiles individuales de artistas conservados. |
| Arena | Duelo local 1vs1, discos, cajas, cadenas, mejoras y rondas; acceso biblioteca y `/test` | PR 27. No tiene todavía salas online ni rival IA. |
| Galería | Borradores persistentes, publicación por tandas, álbum de publicadas, visor y descarga del original | `src/admin/GalleryAdmin.tsx`, `src/cloud/PrivateGallery.tsx`; incidencias Android resueltas según confirmación del propietario. |
| Radio | Interfaz general activable, minimizable, lista y aviso de tema; seis temas configurados | `src/music/`; la disponibilidad real de cada audio requiere comprobación aparte. |
| DANZFLOR | Catálogo de lectura con variantes/tallas y enlaces externos; respaldo local e imágenes sin marcos | `src/shop/`, `docs/DANZFLOR_CATALOGO.md`. Sigue opción C. |
| Administración | Base autenticada con MFA, eventos/códigos, lotes y buzones | `src/admin/`; no equivale a delegación completa o bandeja única de moderación. |

**Punto de referencia comprobado:** `main` estaba en
`2a8b6fdf33de2019bbeb4ce749cf09d9e9bf92eb` (PR 28). Esa entrega registró
191 pruebas internas, 462 escenarios de navegador y 12 offline. Son resultados
de esa versión, no pruebas nuevas de esta revisión.

## 5. Las diez mejoras aceptadas, con lo que falta

| ID | Mejora | Estado real y siguiente paso |
| --- | --- | --- |
| M01 | Acceso Google/Apple/correo y recuperación | Parcial. Google/correo existen; Apple y matriz Android/iPhone, navegadores integrados y recuperación requieren cierre. Comprobar alta nueva y 200 altas concentradas en ensayo; no confundirlo con el acceso de una cuenta existente. |
| M02 | Fotos rápidas en red móvil | Parcial. Hay carga diferida/paginación; las miniaturas independientes, tiempos/datos de álbum grande y una tanda real grande siguen pendientes. No reducir originales silenciosamente. |
| M03 | Buscador, filtros y favoritas | Pendiente de completar. Mantener filtros por evento/fecha y búsqueda sin ampliar permisos; favoritos y búsqueda unificada no constan completos. |
| M04 | Pases y pasaporte fiables | Parcial. Hay pase local y canje; recuperación por correo/entre navegadores y resiliencia avanzada siguen pendientes. El trabajo nuevo en QR se mantiene aparcado. |
| M05 | DANZPOINTS claros y auditables | Parcial. Saldo, reservas y evidencias existen; faltan reglas posteriores al piloto, catálogo de premios, existencias, canje y cola durable de resultados. |
| M06 | Arcade más visual, accesible y fluido | Parcial. PR 34 añade materiales a Jack, rig de Groove y suelo/personajes de Collecta. Base, portadas aprobadas y marcos compactos conservados. Medir en móviles físicos. |
| M07 | Armas diferentes y Groove menos repetitivo | Parcial. Tres armas de corte y ocho del modo Destrucción son ámbitos distintos. Revisar equilibrio, feedback y variedad; faltan música/BPM reales y competición. Trazo Club y efectos suaves locales incorporados en el bloque de PR 30. |
| M08 | Yeppo vivo y poco intrusivo | Parcial. Tres paseos y contacto real publicados; conservar identidad, opt-in y movimiento reducido. IA generativa/3D siguen siendo fases distintas. |
| M09 | Administración más ágil | Parcial. Hay administración y buzones; falta bandeja unificada con prioridades, moderación de fotos y seguimiento trazable. |
| M10 | PWA sólida | Parcial. Instalación y shell offline con pruebas; validar Android/iPhone físicos, recuperación, accesibilidad, observabilidad y procedimiento de rollback. |

## 6. Juegos: pendientes concretos

### Jack

| ID | Pendiente | Prioridad / dependencia |
| --- | --- | --- |
| S01 | Integración visual sin marcos, conservando el cable continuo y caras atenuadas | Completado y publicado en PR 29; CI y navegador conectado correctos. |
| S02 | Ampliar el reparto hacia unas 30 personas | P2; hay 10 hojas de 3 expresiones, no 30 personas. Material autorizado e identificación pendientes. |
| S03 | Tres vidas por nivel y desbloqueos persistentes de Laberinto | Pendiente histórico; diseñar versión de práctica sin alterar silenciosamente la competición validada. |
| S04 | Infinite y Power como modos independientes | Diferibles; el último laberinto infinito actual no equivale a todos los conceptos históricos. Classic sigue sin poderes. |
| S05 | Tutorial inicial breve e interactivo | Pendiente; no contar una frase de controles como tutorial jugable completo. |
| S06 | Resultado competitivo recuperable tras cerrar/recargar | Pendiente; el reintento en memoria no es una cola durable. |

### Groove Ninja

| ID | Pendiente | Estado / siguiente acción |
| --- | --- | --- |
| G02 | Oleadas según BPM aproximado del tema real | Publicado PR 46: reloj del audio, oleadas y Scratch a 127 BPM aproximados. CI 235: 267 internas, 582 navegador y 16 offline correctos. Acceso privado y revisión pública comprobados. |
| G03 | Funky Fiesta y WTHIMH para Groove | Publicado PR 46: ambos MP3 privados, sesión comprobada y enlaces de 120 s; acceso público rechazado. CI y revisión pública correctos; no hay archivos de audio en GitHub. |
| G04 | Scratch con desafío rítmico entretenido tipo Guitar Hero | Parcial. Existen patrones temporizados; evaluar beatmap real, lectura y diversión. No declararlo acabado solo por pasar tests. |
| G05 | Cortes dirigidos arriba/abajo y secuencias | Publicado y verificado PR 43 (2ac95f3c): cuatro sentidos reales, secuencias numeradas de dos/tres vinilos y +300 al completarlas. CI 230: 253 internas, 564 navegador y 16 offline correctas; capturas y apertura pública revisadas. T01 conserva pruebas físicas. |
| G06 | Estilos de corte desbloqueables localmente | Trazo Club a los 20 cortes y preferencias persistentes implementados y comprobados. No modifica alcance, puntuación, vidas ni duración. Publicado y verificado, PR 30. |
| G07 | Variación de cabina, armas y multicortes | Parcial. Cabina detallada, feedback, efectos suaves y cosméticos comprobados; música/BPM real y evaluación de diversión a lo largo de una sesión siguen pendientes. |
| G08 | Ranking/competición online de Groove | Pendiente; no usar puntuación local como resultado verificado ni conceder DANZPOINTS desde el cliente. |

### Catálogo y trabajo externo

| ID | Juego / encargo | Estado |
| --- | --- | --- |
| A01 | Arena DANZ inspirado en Bomberman | Beta local publicada; memoria/kit entregados; pulido gráfico y siguientes mapas por integrar al recibir Gemini. |
| A02 | Arena online desde dos móviles | Pendiente: salas, autoridad, tick, latencia, reconexión y resultados validados. No implementar una simulación de online. |
| J09 | Persecución de DANZ Collecta | Beta local implementada: un minuto, capturas/cambio de papeles, obstáculos y sprint. CI de juego, multitoque, orientación y offline correctos; publicado y verificado, PR 30. |
| J10 | DANZ Kart Mini | Beta local publicada PR 34; acabado 3D publicado PR 35. Tres modos, dos circuitos. Validación WebGL/móvil en T01/T04; objetos, atajos y online posteriores. |
| E01 | Idle Studio | Externo/concepto aprobado; sigue «Próximamente». Puestos de música, moda, vídeo/diseño e impresión 3D, niveles y mejoras. Recibir proyecto de la otra IA antes de duplicarlo. El vídeo del estudio ya fue recibido como referencia privada. |
| E02 | Plataformas desarrollado en Grok | Externo. Recibir ZIP completo; adaptación mínima, conservando arte, motor, niveles, física, controles, audio y progreso. |
| E03 | DANZ Rush Party | Concepto histórico pendiente: exploración cenital tipo GTA 2D + pruebas tipo Mario Party. No descartarlo ni confundirlo con Arena. |
| J01–J08 | Pinball, Break the Beat, Yeppo Invaders, Flor Blocks, Pong Collective, Backstage Maze, DANZ Dominó y Memoria de la Crew | Ideas conservadas; sin prototipo incorporado. Orden posterior a los tres juegos priorizados. Pong admite duelo local; Dominó/Memoria pueden ser por turnos. |

## 7. App, fotos, cuenta y comunidad

| ID | Trabajo por cerrar | Estado / condición de cierre |
| --- | --- | --- |
| F01 | Moderación y solicitudes de retirada | Pendiente completo: motivo, identidad del solicitante, prioridad normal/sensible, ocultación preventiva, revisión y notificación privada al administrador. Tablas/cuarentena no equivalen al flujo. |
| F02 | «Aquí salgo yo», etiquetas y privacidad | Pendiente: aprobación y controles independientes de Instagram, etiquetas, visibilidad y búsqueda. |
| F03 | Likes, comentarios e interacción de álbum | Pendiente como ampliación; moderación y permisos antes de publicación. |
| F04 | Subida grande y reanudación | Parcial: lotes/reintento por archivo; comprobar 600 JPG, interrupción y reselección. No prometer carga continua en segundo plano. |
| F05 | Recuperación de galerías locales | Pendiente de restauración completa probada. Git conserva código; no los Blob de IndexedDB ni toda la fototeca de Storage. |
| F06 | Guardado Android e Instagram Stories | Guardado/descarga confirmados por usuario. No reabrir el error de 0 bytes como actual. Verificar específicamente ruta de Stories, versión y Meta App ID antes de afirmar que la vía directa concreta está operativa. |
| F07 | iPhone | Pendiente de prueba física de instalación, guardado/compartir, sesión y offline. No hay equivalente nativo iOS incorporado. |
| C01 | Acceso y correo para asistentes | Parcial; confirmar configuración y entregabilidad actuales sin leer secretos ni enviar cientos de correos de prueba. |
| C02 | Apple | Pendiente de configuración de proveedor/titular y prueba de alta; no mostrarlo como activo si no lo está. |
| C03 | Pases recuperables y enviados por email | Parcial/pendiente. El pase anónimo local depende del navegador; falta la recuperación completa acordada. QR artísticos no son requisito de este cierre. |
| C04 | Privacidad y perfil editable | Parcial. Nombre/alias e Instagram existen; completar foto y controles independientes de búsqueda, etiquetas y visibilidad. |
| AD01 | Delegación administrativa por funciones | Parcial: comprobación de permisos existe; falta gestión completa de asignaciones desde UI y su auditoría. |
| AD02 | Recuperación MFA y operaciones críticas | MFA existe; falta procedimiento y UI de recuperación/retirada de factores verificados. |
| AD03 | Bandeja única | Buzones de Yeppo/ideas existen; unir incidencias, contenido sensible, prioridad, estados y seguimiento. |
| CO01 | Equipo sin duplicar DJs | Aplazado a material. Recuperar `work/equipo-pendiente-2026-11-12`; faltan nombres/perfiles de otros cinco integrantes. Reutilizar identidad de DJs entre secciones. |
| CO02 | Identidad visual definitiva | Material pendiente: tipografía/paleta oficiales. Mantener BN/acento flexible y logos aprobados; evitar marcos de colores en artistas. |
| CO03 | Enlace para el colectivo | Entregado: URL pública actual. Revisión mediante cuenta normal; no conceder administración para probar. |

## 8. Música y DANZFLOR

| ID | Requisito | Estado / siguiente acción |
| --- | --- | --- |
| MU01 | Hilo general con activar/desactivar y ventana discreta | Interfaz implementada. En esta revisión se inició Sashi Mixed en producción, con tiempo avanzando y sin error de audio; Just a Feeling cargó metadatos. Verificar individualmente los seis temas completos y qué temas faltan; no contar un título como reproducción acreditada. |
| MU02 | Temas asignados al hilo general | Sashi Mixed, Bacalaik, Rush Ön Me, Promiscuous, Caramelo y Just a Feeling figuran en `playlist.ts`. Funky Fiesta fue pedido también para el hilo general y no figura en esa lista: pendiente explícito. |
| MU03 | Música de Groove | Funky Fiesta y WTHIMH asignados al juego. Groove conserva acompañamiento sintetizado; conexión real pendiente (G02/G03). |
| MU04 | Información tema/DJ en directo y reconocimiento | Futuro. Metadatos autorizados de radio no equivalen a Shazam. |
| MU05 | Reconstrucción de canción por capas | Aplazada hasta recibir stems; un WAV completo no son pistas separadas. |
| SH01 | Catálogo DANZFLOR recortado y sincronizado | Base de lectura incorporada. Verificar PNG/alpha por recurso: CSS no elimina un fondo de la fotografía. |
| SH02 | Gestión Shopify y puntos por compra | Pendiente. Storefront de lectura no conecta pedidos/clientes ni resuelve el acceso del titular mediante passkey. Mantener registro manual de compras mientras tanto. |
| SH03 | Comprar dentro de la app | Preparación futura bajo opción C; no añadir checkout, pagos o suscripciones como parte de esta revisión. |
| SH04 | Lista de deseos, tallas y avisos de drops | Propuesta conservada N09; pendiente. |

## 9. Puntos, premios y fases posteriores

| ID | Petición | Estado / regla que debe conservarse |
| --- | --- | --- |
| P01 | Calibración de premios de Snake | Base actual: podio semanal Clásico 50/25/10; máximo 3 semanas premiadas seguidas y 20 al año. Máximo anual de primeros 1.000, equivalente al sello de asistencia piloto. No volver a la propuesta de 200 puntos. |
| P02 | Asistencia, compras y DANZERS | Piloto 13/11/2026: asistencia 1.000; ropa 5/euro, máximo 600/evento. Faltan reglas posteriores, clases/actividades/DJs/colaboradores; no extrapolar automáticamente. |
| P03 | Premios y canje | Pendiente: niveles, catálogo, existencias, caducidad y canje QR/código individual. Familias: entradas, ropa, barra, VIP, digital y colaboradores. Nuevos QR aplazados. |
| P04 | Verificación de Instagram | Implementada con revisión manual y correo DANZ confirmado; no es OAuth Meta. Puntos reservados hasta verificar. Evitar cuello de botella al escalar. |
| P05 | Moneda visible, ahorro y gasto | Moneda y monedero publicados PR 34 sobre saldo disponible/reservado existente. Vista anónima comprobada. Pendientes catálogo/precios/canje real (P03) e historial transaccional; sin operaciones o saldo ficticios. |
| N01 | Yeppo con IA generativa real | Propuesta/fase posterior. Hoy guía local; falta backend, permisos mínimos, límites y evaluación de una opción gratuita útil. No activar costes por defecto. |
| N02 | Mi DANZ | Propuesta: historial privado de fiestas, sellos, favoritas y logros. Pendiente. |
| N03 | Misiones colectivas | Propuesta. Los retos locales de Yeppo no son misiones validadas ni conceden premios. |
| N04 | DANZ Radar | Propuesta de agenda unificada y recordatorios de fiestas/DJs/colaboradores; no confundir un archivo calendario con agenda completa. |
| N05 | Muro de la fiesta | Propuesta, moderación y privacidad pendientes. |
| N06 | Recompensas sorpresa por evento | Propuesta; condicionada a reglas, existencias y canje seguro. |
| N07 | Mi equipo y retos amistosos | Propuesta posterior, consentimiento y resultados validados. |
| N08 | DANZ Radio Live | Propuesta posterior; MU04. |
| N09 | Wishlist y avisos de drops | Propuesta posterior; SH04. |
| N10 | Aftermovie interactivo | Propuesta posterior con materiales finales autorizados; relacionado con Moments. |
| EV01 | Notificaciones por categorías | Pendiente: galerías, eventos, descuentos y juegos, con preferencias independientes. |
| EV02 | Concursos, sorteos y torneos de evento | Pendiente de reglas y operación; no presentar el ranking semanal como todos estos formatos. |
| MO01 | DANZ Moments Studio | Aplazado tras el prototipo principal: detección de temas, sincronización multicámara, selección/revisión y edición híbrida. Originales, cámaras, borradores y editor solo para administración/colaboradores autorizados; asistentes solo finales publicados según permisos del evento. |
| T01 | Pruebas Android/iPhone reales | Pendientes FPS, batería, comodidad multitoque, orientación y audio. Emulación de tamaños no sustituye dispositivo físico. |
| T02 | Complementos/documentación | Context7 antes de juegos/Yeppo; consultar conexiones pertinentes, herramientas gratuitas primero. Una conexión autenticada no demuestra que todas sus funciones o diseños estén disponibles. |
| T03 | Auditoría y `/test` | Mantener ruta accesible, controles táctiles, reduced-motion, pausa y lista de mejoras aplicadas/propuestas en cada entrega importante. |
| T04 | Recuperar la ejecución de pruebas de navegador y offline | Cerrado el 16/11: CI 224 y 225 ejecutan y pasan sus cuatro jobs. CI 225: 246 pruebas internas, 184 escenarios en cada uno de escritorio/tableta/móvil y 16 offline, sin reintentos fallidos. Chromium local sigue sin poder crear socket; se usa CI y navegador conectado. La GPU y el teléfono físico pertenecen a T01. No se cambian costes ni protecciones. |

## 10. Lo expresamente aplazado

- **Nuevos QR artísticos:** conservar `future/qr-art-hugging-face`; no activarlos,
  investigar generación nueva ni desplazar Arcade por ellos hasta que el usuario
  los necesite. No confundir esta decisión con borrar los pases ya existentes.
- **Stems/canciones por capas:** esperar material apropiado.
- **Equipo:** esperar nombres/perfiles, conservando la rama existente.
- **Online y 3D:** fases separadas; evaluar Phaser/Kaplay para juegos nuevos y
  Three.js/React Three Fiber para un eventual Yeppo 3D. No migrar lo que funciona
  por cambiar de librería.
- **Compras dentro de DANZ:** sigue catálogo opción C, sin costes nuevos activados.

## 11. Contradicciones y huecos detectados en esta revisión

1. El documento de 30 ideas aún decía que faltaba integrar portadas: corregido;
   ya están en PR 26.
2. Ese documento llamaba Pilla-Pilla a tocar apariciones: corregido para respetar
   la petición posterior de persecución y cambio de papeles.
3. Documentación del 12/11 llama a Snake de seis laberintos o sin competición;
   el código actual tiene doce y competición. No usar esas frases como estado actual.
4. El informe antiguo decía que la radio no existía; ahora hay interfaz y seis
   pistas configuradas. Sigue pendiente comprobar los bytes de audio y temas ausentes.
5. El requisito de BPM real y cosméticos de Groove seguía pendiente después de
   Combo/Split. Queda visible con IDs propios.
6. Los tres nuevos juegos aprobados no sustituyen ni completan Idle Studio,
   plataformas de Grok o Rush Party históricos.
7. Hay un fallo visual nuevo tras una entrega con tests en verde. Se añade una
   comprobación específica de transparencia, bordes y animación; una cifra global
   de tests no demuestra por sí sola que el diseño guste o esté bien integrado.
8. Recuperar un error Android antiguo como pendiente ignoraría la confirmación
   del propietario. Se separa de las comprobaciones concretas aún no acreditadas.

## 12. Evidencia de la revisión inicial y mantenimiento

Fuentes revisadas: conversaciones disponibles hasta la petición actual;
traspasos del 9/11, informe para Grok del 12/11 (música y limitaciones), memoria
de Arena del 15/11; `AGENTS.md`, las dos hojas de ruta, documentación de fotos,
cuentas, tienda, competición, Idle y administración; componentes y pruebas actuales;
GitHub PR 26–28 y estado de Vercel.

La revisión no afirma haber leído chats no recuperados, inspeccionado credenciales,
validado proveedores externos con usuarios reales o medido un teléfono físico.
Las funciones sin evidencia suficiente se conservan como parciales/por comprobar.

Para continuar: leer este registro, seleccionar el primer pendiente ejecutable,
anotar nuevas peticiones, actualizar su estado con evidencia y conservar lo
aplazado. Los datos/materiales que falten bloquean únicamente su tarea.

### Cierre de esta entrega

- Memoria y kit de Gemini entregados y comprobados.
- Corrección S01 publicada en `2a5483f8169da78a54825488139279aa362513b5` (PR 29).
  Vercel confirmó producción READY (`dpl_5zXEq6h7PxdKeGjRJe7JHbR8owXU`) y el
  navegador conectado verificó el resultado en la URL pública de `/test`.
- CI 176 sobre el código `9bac7bad`: build, 191 pruebas internas, 465 de navegador
  (155 por tamaño) y 12 offline correctas: 668 comprobaciones. Build local y
  19 pruebas de reglas de Snake también correctos. No son mediciones físicas.
- Registro general creado y reglas de seguimiento añadidas a `AGENTS.md`.
- Radio: comprobado inicio de Sashi Mixed con tiempo avanzando y sin error de
  audio; Just a Feeling cargó metadatos. No se da por escuchados todos los temas.
- Auditoría: `AUDITORIA_SNAKE_Y_CONTINUIDAD_2026-11-15.md`.
- Próximo bloque de desarrollo: Yeppo Pilla-Pilla local, sin duplicar el trabajo
  de Arena que el propietario continúe en Gemini; Groove mantiene G02–G08 visibles.


## 13. Peticiones posteriores — Collecta, controles y Groove

Esta sección prevalece sobre las filas históricas cuando cambia la estructura
de juegos. La portada fue mostrada y el propietario pidió «Implémentala».

| ID | Petición / decisión | Estado actual | Prioridad / siguiente paso |
| --- | --- | --- | --- |
| DC01 | Una entrada DANZ Collecta con Arena y Persecución (antes Pilla-Pilla independiente) | Publicado y verificado, PR 30 | Cerrado: biblioteca, modos, retorno y enlaces directos comprobados. |
| DC02 | Portada «Día de cobro» con la cara y el humor de seguridad/facturas | Aprobada y publicada en biblioteca, modos y `/test`; móvil 600×800, 200.798 bytes | Cerrado: encuadre completo y entrega online/offline comprobados. |
| DC03 | Arena contra la máquina | Beta local publicada y revisada, PR 32 | Último turno: rival real con rutas, previsión de cadenas y escape. Regresión completa recuperada en CI 224/225; teclado con joystick comprobado en público. T01 conserva la prueba física. |
| DC04 | Lore y protagonista dentro de Collecta | Lore PR 31 y primer sprite humano ilustrado PR 34 publicados | Encargado y Yeppo con dos poses. Conservar portada exacta; fidelidad de retrato y arte definitivo siguen parciales. |
| A03 | Mandos de 1vs1 en extremos opuestos desde el punto de vista de cada persona | Publicado y verificado en Arena y Persecución | Cerrado en emulación y navegador; rotación, multitoque y pausa correctos. T01 conserva la prueba física. |
| J09 | Pilla-Pilla como Persecución de Collecta | Beta local publicada y verificada: 60 s, obstáculos, captura/cambio de roles y sprint | Cerrado: navegador/Canvas 2D, pausa, salida y offline comprobados. |
| G06 | Cosméticos locales de Groove sin ventaja competitiva | Trazo Club a los 20 cortes y preferencias persistentes publicados y verificados | Cerrado: desbloqueo jugando, persistencia y foco comprobados en CI. |
| G07 | Gráficos, opciones y funcionamiento de Groove con las herramientas nuevas | Cabina detallada y ajuste de efectos suaves publicados y verificados | Auditoría y regresiones de corte/armas/tiempo completas. G02/G03/G08 siguen pendientes. |

Verificación local actual: 205 pruebas internas correctas. El resultado previo de
668 comprobaciones pertenece a la entrega de Snake; no acredita este código.
Auditoría y evidencia de publicación: `AUDITORIA_COLLECTA_Y_GROOVE_2026-11-15.md`.


### Cierre de Collecta y Groove — PR 30

- Portada aprobada «Día de cobro» publicada. Una entrada Collecta reúne Arena
  y Persecución; sus mandos siguen el punto de vista de personas enfrentadas.
- Persecución local publicado y probado: 60 s, obstáculos, captura/cambio de
  papeles, sprint, pausa, salida y uso sin conexión. J09 deja de ser pendiente
  de prototipo; DC04 conserva el acabado de personajes/lore como trabajo distinto.
- Groove: cabina detallada, efectos suaves y Trazo Club persistente publicados;
  G06 completado para la versión local. Música/BPM y ranking mantienen su estado.
- CI 181, código `33ac292e`: 205 pruebas internas + 486 de navegador + 14 offline
  = **705 comprobaciones correctas sin reintentos**, además de build.
- Integración main: `ae4c838db05a27e1adae4ff07c0c896c09e37051`, PR 30.
  Vercel producción READY: `dpl_DXk5CgXTHEM4nNqFyXTbjyLgoZTY`.
- Navegador conectado: portada completa visible, partida de Persecución iniciada,
  P1 movido, pausa y retorno a modos correctos en la URL pública.
- Auditoría: `AUDITORIA_COLLECTA_Y_GROOVE_2026-11-15.md`. Los cambios de cierre
  posteriores solo actualizan documentación, sin cambiar el ejecutable validado.
- Siguiente tarea de Collecta: **DC03, Arena contra la máquina**. Online sigue
  pendiente. Se conservan todos los demás bloques, QR aplazados y entregas externas.


## 14. Lore de Collecta y joystick — nueva prioridad del propietario

El propietario solicita más personalidad alrededor del lore del último juego y
sus modos, y controles estilo joystick. Esto pasa a ser el bloque activo antes
de continuar DC03; el rival contra la máquina conserva su lugar en el registro.

| ID | Petición | Estado actual | Siguiente acción |
| --- | --- | --- | --- |
| DC05 | Personalizar Collecta y sus modos con el lore de seguridad/cobro | Publicado y revisado manualmente, PR 31 | Cierre de pista y Pasa el marrón: encargado/crew, factura y sello de trámite. Portada conservada y textos compactos comprobados. |
| A04 | Joystick táctil opcional y enfrentado para cada persona | Publicado PR 31; regresión de tres tamaños ejecutada y correcta en CI 224/225 | Dos joysticks, tercer dedo para disco/sprint, pausa, cancelación y rotación comprobados en navegador. Teléfono físico en T01. |
| DC04 | Protagonista humano dentro de las partidas | Parcial, con primer sprite humano ilustrado publicado PR 34 | Encargado original con dos poses; falta acabado definitivo/fidelidad de retrato. No se generan ni sustituyen las portadas aprobadas. |

Conservar las rutas actuales y la portada exacta aprobada. No cambia la física
de colisiones, las rondas, capturas, duración ni puntuación de los motores.
El joystick de Arena elige una dirección de casilla; el de Persecución usa
movimiento libre, diagonal y velocidad proporcional al desplazamiento.
Auditoría: `AUDITORIA_COLLECTA_LORE_JOYSTICK_2026-11-15.md`.


### Cierre de lore y joystick — PR 31

- Publicado en `3fea5cb0740a465c8c738ecdca7b3381a7739080`. Producción Vercel
  READY: `dpl_DB97o26nPtSGXPW6TaXTAgZD69ZD`. Navegador público: lore y elección
  de mandos visibles; Persecución iniciada, P1 movido (110 → 290), pausa y retorno
  correctos. La selección de ambos joysticks queda conservada.
- Build y **211 pruebas internas correctos**. Preview revisado con el juego real
  en Arena 320×568 y 390×844 y Persecución 844×390: movimiento de P1/P2 desde
  lados opuestos, mandos de 96×96, disco/sprint, pausa y vuelta al centro.
  Preferencias conservadas tras recargar. Página repetible: `/test-collecta-layouts.html`.
- **Verificación incompleta:** CI 184/185 termina antes de ejecutar pasos, sin
  logs de jobs. Chromium local no puede crear socket. Los escenarios nuevos
  de dos dedos + acción, cancelación/rotación y offline están escritos pero
  pendientes de ejecución. Las 705 comprobaciones de PR 30 son históricas.
- Auditoría: `AUDITORIA_COLLECTA_LORE_JOYSTICK_2026-11-15.md`. No se afirma
  medición de FPS, batería o dispositivo físico.
- Seguimiento: T04 para CI, T01 para móviles físicos, DC03 para IA rival y DC04
  para personajes humanos. Online, música/BPM, Kart, QR aplazados y retorno de
  Gemini mantienen sus estados.


## 15. Arena contra la máquina — Último turno (DC03, PR 32)

**Publicado y comprobado:** `df97f67643faeea6a04bb467a9d94f36bfb2a70f`.
Vercel producción READY: `dpl_4h9beU62i7z1gogKrgffd2KxiSRt`.

- Tercer modo de Collecta, con un mando P1 derecho, flechas/joystick y teclado.
  El rival de la crew usa la física real: proyecta discos y cadenas, busca
  refugios, rompe flightcases y persigue al encargado. No necesita servicios nuevos.
- Primero en ganar tres rondas, 60 segundos cada una. Mismo daño propio, límites
  de movimiento y capacidad; no se concede puntuación competitiva desde el cliente.
- Build y **219 pruebas internas correctos**. Ocho pruebas nuevas de rival:
  determinismo, pausa, peligro, cadenas, rechazo de discos sin escape, ocho
  semillas y cadencias de 16/33/50 ms y variables. Perfil del host: 200 decisiones,
  media 0,30 ms y p95 1,17 ms. No son medidas de móvil o FPS.
- Revisión manual del juego real en 320×568, 390×844 y 844×390: joystick 96×96
  sin girar, humano y rival se mueven, disco, teclado humano, pausa y siguiente
  ronda. En horizontal se amplió la pista hasta 381×312 con el mando lateral.
- La crew ganó una ronda sin entradas humanas. Volver a Collecta y abrir el 1vs1
  recupera los dos mandos; el modo individual no expone un mando P2.
- Producción: entrada desde Collecta, joystick mueve P1 de 1,1 a 4,1, crew de
  9,7 a 3,7, pausa y retorno/reinicio comprobados. `/test` conserva el acceso.
- **Automatización bloqueada:** CI 189 (`43751292360`) falla antes de ejecutar
  pasos; los cuatro jobs carecen de logs. Escenarios de navegador/offline nuevos
  escritos, pendientes de ejecución. T04 sigue abierto; no se afirma que hayan pasado.
- Auditoría: `AUDITORIA_COLLECTA_SOLO_2026-11-15.md`. La portada aprobada y
  los personajes beta se conservan. DC03 queda cerrado como beta local; DC04
  (sprites humanos), T01 (teléfonos físicos), T04, online, Groove/música/BPM,
  Kart y retorno de Gemini conservan sus estados. QR sigue aplazado.


## 16. Marcos de todos los juegos — A05

Petición: el marco exterior ocupa demasiado. Publicado en PR 33,
`e981c8dc567047ed137056744268d71ee4e17585`. Vercel producción READY:
`dpl_2o4AJoSkBXo6HoB4yaq5XEQ8jNqo`.

- Bordes de 1 px ajustados al tablero real; márgenes inmersivos de 4 px o
  el área segura del dispositivo. Se retiran sombras y rellenos decorativos
  en Jack, Groove (Vinyl, Scratch y Destrucción) y los tres modos de Collecta.
- Se mantienen las proporciones y coordenadas del motor. El fondo sobrante
  queda fuera del borde del tablero; no se estira ni recorta el juego.
- Destrucción también reduce el margen de página en móvil y adapta su título.
  Los controles de dirección conservan 44×44 y los duelos su perspectiva opuesta.
- Build y diff-check correctos. Revisión manual del juego real en 320×568,
  390×844 y 844×390. Persecución inicia, activa sprint y pausa correctamente.
  Producción: inicio/pausa de solo, título de Destrucción y `/test` revisados.
  Auditoría y tamaños: `AUDITORIA_MARCOS_ARCADE_2026-11-15.md`.
- CI 193 termina antes de ejecutar pasos: cuatro jobs sin steps ni logs.
  Automatización de navegador/offline pendiente en T04; no se afirma una prueba
  de teléfono físico, FPS o batería. No se añaden dependencias ni bucles de resize.
- A05 queda cerrado para esta presentación adaptable. El resto de pendientes,
  DC04, T01, T04, música/BPM, online, Kart y retorno de Gemini, conserva su estado.


## 17. Gráficos, DANZ Kart Mini y moneda visible — publicado PR 34

El propietario pide mejorar todos los gráficos y desarrollar ya Kart (M06/J10).
Como inciso, quiere DANZPOINTS como moneda visible, para ahorrar y gastar (P05).

- J10: primera beta local publicada en PR 34, `92564a94`. Crew Race contra tres
  rivales, Contrarreloj con mejor sesión local y duelo con mandos enfrentados;
  dos circuitos, tres vueltas, derrape cargado, impulso, freno y colisiones.
- M06: cable Jack con materiales/conector; cabinas Groove/Destrucción con rig
  y altavoces; suelo iluminado y sprites ilustrados de encargado/Yeppo en
  Collecta. Se conservan portadas exactas, motores existentes y marcos compactos.
- P05: moneda gráfica y monedero implementados sobre el saldo real existente;
  se separa disponible/reservado. Catálogo, precios, historial transaccional y
  canje real quedan pendientes en P03/P05. No inventar saldo ni compras de prueba.
- Build y 227 pruebas internas correctos, ocho nuevas de Kart. Producción READY
  `dpl_G8Bn74WQx1LjqLhbtDUQ2kXWtd5C`; revisión pública de Kart, Collecta, Jack,
  Groove y monedero. El monedero se revisa anónimo, sin iniciar una cuenta ajena.
  La corrección posterior `e84c48f3` ajusta la etiqueta DERRAPE al mando lateral.


## 18. Kart premium — ampliación solicitada el 16/11

Se implementa el acabado 3D de la carrera local tras la petición del
propietario. Three.js, recursos CC0 de asfalto, kart y escenario propios, cámaras,
sonido original, minimapa, ajustes de calidad y podio. Se conserva la física
probada y el modo 2D compatible. Ver `KART_PREMIUM_2026-11-16.md`.
Build y 229 pruebas internas pasan. Auditoría de geometría con render CPU: se
corrigen solapamientos de curvas, parrilla y garaje; agrupación de piezas por
material. WebGL desactivado en el navegador conectado: fallback 2D comprobado,
sin afirmar prueba de la GPU. Publicado en PR 35; T01/T04 abiertos.
La moneda visible P05 y el monedero de PR 34 se conservan; P03/canjes reales e
historial transaccional siguen pendientes. Online y QR mantienen sus estados.

### Cierre PR 35 — 16/11/2026

- Código publicado: `50eb18d7e4f7bae1eeeae0c2392944c3513d0faa`; producción
  READY `dpl_D78kxanrTCTboqnFrpBT2JgdKpL2`, alias público confirmado.
- Build y 229 pruebas internas correctos. CI 201 repite cuatro jobs fallidos sin
  steps ni logs; no se afirma automatización de navegador/offline ejecutada.
- Revisión pública: acceso directo a Kart, salida a pista, livery Petrol, duelo
  en Backstage, mandos enfrentados en 844×390, menú 320×568 con inicio accesible,
  monedero anónimo y actualización normal de la PWA. Preview también comprobó
  pausa sin avance y cambio de gráficos sin perder modo/circuito ni duplicar canvas.
- WebGL desactivado en este navegador: se prueba la vista compatible automática;
  el modelo y trazados 3D se revisan con render CPU separado. GPU, audio escuchado,
  FPS, batería y multitoque de Android/iPhone conservan T01/T04.
- Captura de producción: modo compatible 2D, no presentarla como captura de 3D.
  El render de `docs/audits/kart-premium-geometry-review.webp` es auditoría de
  geometría en Blender/Cycles, con materiales/iluminación aproximados.
- El alcance local incluye tres modos, dos circuitos, derrape/impulso, física,
  bot, mandos opuestos, preferencias, podio y récords. Objetos, atajos, fantasma,
  repetición y online siguen pendientes, sin reabrir la entrega local.
- P05 conserva moneda/monedero; catálogo, precios, canjes e historial siguen
  pendientes. No cambia la política de QR, música, fotos ni retorno de Gemini.

## 19. DANZPORTER — ampliación del propietario, 16/11

El nombre definitivo es **DANZPORTER**, aprobado después de proponer alternativas
con guiños a Taxi Driver, Transporter y el colectivo. El propietario aprueba la
portada generada con su nueva foto: conservar exactamente esa imagen.

| ID | Petición | Estado / siguiente paso |
| --- | --- | --- |
| K01 | Nombre y portada propios de DANZPORTER | Publicados PR 36, e0a3a359. Imagen aprobada integrada, build y preview revisados; producción READY. Rutas antiguas conservadas. |
| K02 | Acelerador/freno y más control | Publicado PR 37, dc5fe5e8: gas manual, freno hasta detenerse, inercia, giro suavizado, auto opcional y teclado. |
| K03 | Daños de los vehículos y boxes | Publicado PR 37, dc5fe5e8: daño por impacto de cierre, degradación, reparación en carril separado y grúa con penalización; visuales 3D/2D. |
| K04 | Personalizar karts y pilotos; piezas con características | Publicado PR 37, dc5fe5e8: tres chasis × seis ruedas, color libre, tres pilotos y estadísticas reales. Disponible para ambos jugadores. Sin gastar DANZPOINTS ni inventar compras. |
| K05 | Personalización del circuito | Publicado PR 37, dc5fe5e8: Muelle DANZ, Último servicio y Crew Paddock; materiales/luces/paleta en 3D y compatible. |
| A06 | Horizontal y mandos mayores donde tenga utilidad real | Publicado PR 37: Kart 112 px; Collecta horizontal 108 px/flechas 48 px/acción 56 px donde cabe; Groove controles 48–52 px y pausa al girar. Jack conserva su geometría cuadrada. |

Las peticiones previas de app, fotos, música, puntos, entregas externas y QR
aplazados mantienen sus estados. T01/T04 siguen pendientes con sus límites.

### Mecánicas de DANZPORTER — validación interna y conectada

Build y 240 pruebas internas pasan. Diez pruebas nuevas cubren pedales, daño,
resistencia, boxes, recuperación, pausas y récords por piezas; se amplía la prueba
de migración de preferencias. Simulación de las 18 combinaciones en dos circuitos:
36/36 carreras completas, tiempos 41,983–51,533 s, 5,483 s de CPU del host.
No son FPS de un móvil ni un resultado competitivo o humano.

La portada aprobada se conserva. PR 37, dc5fe5e8, está publicado; producción
READY dpl_DxeWwfqsggzAE9AxdKcTvWXF9w3r. Revisión preview del juego real en
390×844, 320×568 y 844×390: garaje persistente, piezas independientes en duelo,
gas/freno táctiles y teclado, daño por choque, pausa sin avance, calidad sin
perder estado ni duplicar canvas, entrada/salida de boxes y mandos enfrentados.
Collecta inicia con flechas de 48 px; Groove inicia/pausa con armas de 52 px.

Geometría 3D y boxes revisados por CPU, 498 objetos exportados, iluminación
aproximada. WebGL desactivado en el navegador conectado: no equivale a prueba
GPU, móvil físico, FPS, batería o audio escuchado (T01). CI 207 de PR 37 repite
cuatro jobs sin steps ni logs; navegador/offline automatizados siguen en T04.
Los escenarios escritos no se cuentan como ejecutados. Rotación física y
multitoque simultáneo siguen pendientes.

La comprobación pública detectó el garaje largo detrás de la cabecera en
horizontal. PR 38, 49a55708, limita el panel al espacio real y mantiene scroll
e inicio accesibles. Preview comprobada en escritorio y 320×568: cabecera hasta
y48, panel desde y54 y margen inferior 10 px. Ver
DANZPORTER_CONDUCCION_2026-11-16.md para cierre público final.

### Cierre público de DANZPORTER — PR 36, 37 y 38

- Nombre y portada exacta aprobados integrados; imagen 720×960 cargada en público.
- PR 37: gas, freno, piezas, daño, boxes y ambientes publicados y revisados.
- PR 38: `49a5570816fe06ed48d957d8425806a24de9eda7`, producción READY
  `dpl_21m1nYH7Bto3eNNYpXVeNweVJGJB`. Garaje largo bajo la cabecera comprobado
  en la URL pública; sesión de Contrarreloj con boxes, retorno al 100%, pausa,
  salida y reapertura correctos, sin sumar vueltas por entrar a reparar.
- Último build correcto; 68 archivos del shell y revisión de scroll/áreas útiles.
  Las 240 pruebas internas de mecánica y la batería 36/36 siguen vigentes.
- CI 209 también tiene cuatro jobs fallidos sin pasos ni logs. No se presenta
  navegador/offline automatizado como ejecutado; no se modifica la seguridad,
  facturación ni configuración del proyecto para sortearlo. T01/T04 abiertos.
- K01–K05 y A06 quedan publicados para su alcance local. Permanecen T01/T04,
  contenidos adicionales/online, P03/P05 transaccional, música/BPM, fotos,
  moderación, administración y retorno externo de Gemini con sus estados previos.

## 20. Menús de consola y pantalla completa — nueva petición del 16/11

| ID | Petición | Estado / siguiente acción |
| --- | --- | --- |
| A07 | Menús seleccionables y desplazables como un videojuego clásico | Publicado PR 39, 49f571e5: selección central con flechas, deslizamiento y teclado; páginas de jugar, garaje, circuito, ajustes y ayuda. Identidad DANZ y portadas exactas conservadas. |
| A08 | Todos los juegos a pantalla completa e información más comedida | Publicado PR 39, 49f571e5: sesión inmersiva al abrir, solicitud nativa en gesto, continuidad entre modos, Destrucción adaptable y ayuda secundaria. Preview revisado en tres tamaños; este navegador rechaza fullscreen nativo y mantiene CSS completo. T01 conserva prueba física. |

No se copian logos o recursos de Crash Team Racing: la referencia es la forma de
seleccionar, con arte y nombres propios de DANZ. Las peticiones anteriores y los
límites de T01/T04 se conservan. Evidencia y publicación al cerrar este bloque.

### Nueva dirección gráfica de DANZPORTER

| ID | Petición | Estado / siguiente acción |
| --- | --- | --- |
| K06 | Acabado cercano a la referencia de Rush Rally Origins enviada por el propietario | Publicado PR 41, 11868c04: isométrica diagonal cercana, suelo con textura procedural, vegetación instanciada e iluminación menos plástica. Mundo DANZ y recursos originales; circuito y simulación conservados. Geometría CPU revisada; GPU física pendiente T01. |
| K07 | Opción de primera persona | Publicado y verificado en público PR 41: perspectiva 3D y compatible por software, volante, giro relativo y minimapa. Cambio en pausa sin perder tiempo, piezas ni salud; preferencia conservada, duelo con pista compartida. CI 225 correcta y revisión pública 320×568, 390×844 y 844×390. |

### Validación y regresión de menús

PR 39 publicado, producción READY `dpl_BDqBrYLwLve881Vey1ooTtHDsUfj`. Build
y 242 pruebas internas correctas. Auditoría conectada de 390×844, 320×568 y
844×390: carruseles, swipe, garaje P1/P2, salida, pausa y juegos reales.

CI 215 ya ejecuta pasos y permite observar regresiones: selectores antiguos,
retorno de Destrucción y navegación offline de Kart/solo. PR 40 corrige el
retorno (comprobado en preview) y la lista pública del worker, manteniendo
rechazo de tokens/fotos/callbacks. CI 218: 16/16 offline pasan y móvil ejecuta 178 escenarios (175 correctos;
tres selectores antiguos de Jack, ajustados en f66abe2e). La mecánica del kart
se prueba en 2D compatible, separada del coste de GPU por software del runner.
Ese resultado es histórico. El cierre siguiente recoge la ejecución final.

### Cierre de menús, cámaras y regresión — PR 40/41

- PR 40: `56a065722fe35e664f77cc9e38a33ddfda37d04d`. CI 224 pasa
  build, pruebas internas, 546 escenarios de navegador y 16 offline.
- PR 41: `11868c0400fb10fb05fd8cebe178bd8a65008090`. Producción READY
  `dpl_CHucH5XqQwHZfL2XLTvWdrkFRa7h`, alias público confirmado.
- CI 225: **246 internas, 552 de navegador (184 por tamaño) y 16 offline**,
  todos correctos. Los 31 archivos modificados coinciden por hash con la copia
  local revisada. Las dos pruebas de layout se separan por tamaño y miden antes
  de jugar: antes la crew ganaba durante la medición, a los 4,2 s; el mando
  funcionaba. Se conserva la comprobación del movimiento y tercer dedo reales.
- Navegador público: primera persona, gas/velocidad y un canvas comprobados
  en 320×568 y 844×390; menú, preferencia y duelo revisados en 390×844.
  No hay desborde en los tres tamaños.
  En 320 los cuatro botones miden 44 px. Cambio a pista completa en pausa
  conserva 9.541 ms, `sprint:endurance` y salud 0,796. Duelo fuerza pista
  compartida; volver a carrera recupera la primera persona guardada.
- Mejoras cerradas: retorno de Destrucción al menú Groove, rutas públicas
  offline, menús desplazables, cámaras y revisión automatizada T04. La portada
  exacta aprobada, piezas, daño, boxes y récords se conservan.
- Límites: el navegador conectado usa compatible 2D; no acredita GPU, FPS,
  batería, audio escuchado, pantalla completa nativa ni multitoque físico.
  T01 sigue pendiente. La revisión automática bloqueó la preview privada al
  redirigir a Vercel; se verificó la publicación pública, sin alterar accesos.
- App, música/BPM, fotos, puntos/canjes, moderación y retornos externos
  conservan sus estados. QR continúa aplazado.


## 21. Groove — cortes dirigidos y secuencias (G05), 16/11

Publicado y verificado en PR 43: flechas con sentido arriba/abajo/izquierda/derecha,
vinilos numerados en orden, indicación del siguiente objetivo y bonus local de
300 al cerrar cada secuencia. Dos objetivos primero; tres en el tramo final.
Un gesto incorrecto conserva el vinilo y permite reintentar; si cae una secuencia
pendiente, se retira entera y cuesta una vida, sin objetivos bloqueados.
El hielo no sustituye una secuencia que sigue en vuelo. Pausa conserva el avance.

Teclado: elegir sentido con flechas, después 1–4 del rótulo CUT. El corte con
ratón/tacto acumula pequeños desplazamientos, para responder también a un
trazo lento. Menús, portadas, Scratch, Destrucción y `/test` conservados.
Música/BPM real (G02/G03), evaluación larga G04/G07, competición G08, puntos,
fotos, administración, entregas externas y QR conservan sus estados.

CI 230 del código 6373360: build, 253 internas, 564 escenarios de navegador
(188 por escritorio/tableta/móvil) y 16 offline, todos correctos sin reintentos
fallidos. Capturas 390×844, 320×568 y 844×390 revisadas: sentido/números legibles,
siguiente objetivo diferenciado por forma, sin recorte ni desborde y controles
principales de 44 px. Producción READY dpl_5ycDvToiYvTxBDCUGPuApGFr9f5U,
merge 2ac95f3c214ea0887e5b019449a76e4ec5b1793f, alias público comprobado.

Revisión pública: ayuda actualizada, siete cortes/1.250 puntos/cinco vidas y
primera secuencia ↑/↓ observados; salida correcta a biblioteca desde /test.
Tacto en ambos sentidos, orden, bonus y pausa comprobados con el juego real en
CI. Auditoría y capturas en GROOVE_CORTES_DIRIGIDOS_2026-11-16.md.
Chromium local no puede abrir socket y la preview privada fue bloqueada por la
política del navegador; se verifican CI y publicación pública sin cambiar
accesos. No acredita teléfono físico, FPS, batería ni audio oído.

## 22. Groove — música protegida autorizada, 16/11

El propietario autoriza publicar el código y reproducir Funky Fiesta y WTHIMH
con acceso protegido, sin botón de descarga y sin subir los audios a GitHub.
Se sustituye la propuesta anterior de incluir MP3 en el repositorio público.
No se promete impedir toda extracción o grabación de una reproducción autorizada.

Publicado en PR 46: selector, reloj media, oleadas/Scratch a 127 BPM aproximados,
pausa, cancelación, errores, retorno a Ensayo y récord por tema/modo. El servidor
valida la sesión y firma solo dos archivos fijos durante 120 segundos. Los enlaces
se preparan antes de pulsar JUGAR para conservar el gesto de reproducción móvil.
Ensayo sigue disponible sin cuenta y offline; Funky también se añade a la radio.

Los dos MP3 ya se han subido al bucket privado y se ha comprobado que sus URLs
públicas son rechazadas. Destino contrastado con la configuración de la app
publicada y el proyecto Supabase existente. Sin MP3, originales, tokens o enlaces
firmados en Git, localStorage o precaché. 267 internas y build correctos.
Backend, CI y revisión pública completados; cierre en
GROOVE_MUSICA_PROTEGIDA_2026-11-16.md. T01, G04/G07, G08, puntos, fotos,
administración, entregas externas y QR conservan su estado.


### Cierre de música protegida — PR 46

Publicado: `4b6e0082dc39ea9d05240f9bb60fac3e4f317d0b`. Código probado
`e448d25bf47566cb1767569e16e7088adf195c48`; árbol idéntico al checkout revisado.
Producción READY `dpl_2hyyE5QNx8z96f47ZZaHw5SqcA8G`, alias público verificado.
CI 235 (`43917167919`): **267 internas, 582 de navegador —194 por tamaño— y
16 offline correctos**, sin reintentos fallidos. Los seis escenarios de música
protegen sesión, reproducción, pausa/silencio, Scratch, selección, fallos y radio.
El audio de CI es un fixture original sintetizado, no los masters del propietario.

Backend real: los dos MP3 privados, URLs públicas rechazadas; sesión válida
obtiene respuestas 206 de audio/mpeg. Sin sesión/JWT inválido devuelve 401;
rutas/TTL alterados, 400; otro origen, 403. Cuenta de prueba retirada (0
restantes), acceso de esa cuenta ya borrada rechazado y auxiliar de preparación
cerrado. Ningún audio, token o enlace firmado se incorpora a GitHub.

Revisión pública desde /test: selector Funky/WTHIMH/Ensayo, restricción de sesión
y ensayo sin cuenta comprobados. Partida de ensayo real, fin de sesión y ajustes
funcionan; cambiar tema restaura cinco vidas y 60 s. Controles de 44 px mínimo
y sin desborde horizontal. Se corrige la alineación del carrusel dentro del
panel de ajustes por especificidad CSS; no modifica motor ni acceso.

G02/G03 cerrados para este alcance; G04/G07 conserva beatmap musical editado y
evaluación prolongada de diversión. T01 sigue en teléfonos físicos, audio oído,
GPU/FPS y batería. G08, DANZPOINTS, fotos, administración y retornos externos
conservan su estado; QR continúa aplazado.

## 23. Sensación premium — shell, galería y Yeppo (PF01), 16/11

Implementado en `feature/premium-feel`. No está publicado. Build local
correcto y 258 pruebas internas en verde, incluidas las de transición,
favoritos, gestos y silencio de audio. No hay prueba de teléfono físico,
vibración real, FPS ni audio oído.

- Shell: View Transitions al pulsar una sección, con cambio inmediato si el
  navegador no las soporta, si hay movimiento reducido o si hay partida de
  arcade. El atrás del navegador sigue inmediato para no pisar un pase.
  Vibración corta solo donde existe `navigator.vibrate`. Esqueletos en
  galerías, pasaporte y cargas perezosas. Barra fija, áreas seguras, sin
  rebote de desplazamiento y color de tema oscuro.
- Galería: marco reservado y aparición con desenfoque, visor con
  deslizamiento, pellizco, doble toque y cierre hacia abajo. Favoritas en
  `localStorage` de este navegador. No hay miniaturas de servidor ni
  búsqueda unificada: M02 y M03 siguen parciales.
- Yeppo: el lanzador señala en vez de bailar, las respuestas con destino
  apuntan y el paseo espontáneo es menos frecuente. El paseo pedido a
  propósito se conserva. Sellos, niveles de Jack y favoritas tienen un
  tono muy bajo y partículas, con el interruptor SONIDOS del pie. El
  silencio de Groove sigue siendo el suyo. M08 sigue parcial: no hay IA
  generativa ni Yeppo 3D.

QR artístico no se ha tocado. Portadas aprobadas, sin cambios.
La música protegida de Groove y el carrusel de ajustes publicados en main se conservan.

## 24. Continuidad con Claude: P0 y ARCADANZ premium, 27/11

Petición del propietario: continuar el trabajo de Codex (uso limitado),
resolver primero los P0 y llevar los juegos a sensación premium, gratis primero.

| ID | Petición | Estado comprobado | Siguiente acción |
| --- | --- | --- | --- |
| P67 | #67: Android abre la PWA antigua desde la preview | Causa encontrada y corregida en rama `claude/danz-apo-analysis-nfzou2`: el login de las previews volvía siempre a producción y Android lo abría en la PWA instalada. Ahora vuelve a la misma preview del proyecto; etiqueta «PRUEBA · commit». Build y 281 pruebas internas correctas. Sin probar en Android. | Propietario: añadir en Supabase → Auth → URL Configuration las Redirect URLs de previews y quitar o compartir la protección de Vercel en previews. Después probar en Android. |
| P75 | #75: regresiones E2E Cuenta/Pasaporte | Resuelto en ramas: PR #87 con Verify DANZ, integración y Cuenta/Pasaporte **success** en móvil, tableta y escritorio (commit `562ee5dd`). | Prueba física Android del propietario y aprobación para fusionar #87. |
| AP01 | Auditoría visual y propuesta juego por juego | Entregado: `docs/PROPUESTA_JUEGOS_PREMIUM_2026-11-27.md` y capturas en `docs/evidence/2026-11-27-auditoria-juegos/`. Emulador, no dispositivo físico. | Propietario elige el orden; propuesto: kit premium + Jack. |
| AP02 | Revisar hilos de Grok | Hecho 28/11: 14 hilos leídos completos por enlace público. Consolidado en `docs/PLAN_MAESTRO_GROK_Y_ARCADANZ_2026-11-28.md`. Varias ramas y documentos que Grok dio por hechos no existen en GitHub. | Bloque B: reconstruir las biblias de diseño en `docs/` y ordenar duplicados. |
| AP03 | Conectores y flujo de trabajo de mínimo esfuerzo | Vercel: protección de previews desactivada y comprobada. Supabase: Redirect URLs añadidas por el propietario. Preferencia guardada en `AGENTS.md`. | Conectar Hugging Face, Vercel, Supabase, Picsart y Linear/Drive desde los botones. |
