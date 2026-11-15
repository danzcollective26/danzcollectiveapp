# DANZ Collective — revisión general y registro de pendientes

**Actualización:** 15 de noviembre de 2026, Europe/Madrid.
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

| ID | Petición | Estado al abrir esta revisión | Siguiente acción / cierre |
| --- | --- | --- | --- |
| R01 | Entregar primero la memoria y kit para Gemini | Entregado; archivos existentes comprobados | Enlaces reenviados al inicio de la respuesta; esperar el ZIP de retorno para integrarlo. |
| R02 | Revisar intensivamente lo hablado para no perder tareas | En ejecución | Contrastar conversaciones, traspasos, código y publicaciones; mantener este registro y sus estados. |
| S01 | Quitar los recuadros extraños alrededor de Snake y rostros | P0: corregido en código, pendiente de revisión final/publicación | Retirar borde/fondo de cabeza, aro de objetivo y animación heredada que pinta una sombra rectangular. Comprobar después de comer y en móvil. |
| G01 | Continuar mejoras de Jack y Groove | Parcial; primera entrega publicada | Cerrar S01; conservar optimización y especiales. Completar pendientes específicos G02–G07, sin afirmar que todo está terminado. |
| A01 | Arena con estética propia y duelo 1vs1 | Beta local publicada; mejora gráfica externa preparada | Gemini continúa el módulo; revisar arte, mapas y controles antes de integrarlo. |
| J09 | Yeppo Pilla-Pilla | Aprobado, pendiente | Primera arena de persecución/escape con cambio de papeles y dos mandos. No sustituirlo por tocar apariciones. |
| J10 | DANZ Kart Mini | Aprobado, pendiente | Prototipo cenital móvil, controles de dos personas, derrape y circuito legible. |

## 4. Lo ya publicado que debe conservarse

| Área | Base comprobada | Evidencia principal |
| --- | --- | --- |
| Compartir la app | PWA en `https://danzcollectiveapp.vercel.app`; prueba en `/test` | Proyecto Vercel `danzcollectiveapp`, producción READY al iniciar esta revisión. |
| Biblioteca ARCADANZ | Una entrada por juego, apertura inmersiva y retorno a biblioteca | PR 26; `src/arcade/ArcadeChooser.tsx`, `ArcadeLaunch.tsx`. |
| Portadas | Las dos exactas aprobadas, cada una con su protagonista; copias móviles optimizadas | PR 26; reducción de tamaño 88–91 % ya registrada. No generarlas de nuevo. |
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
| M06 | Arcade más visual, accesible y fluido | Parcial. Biblioteca, portadas, pausa, controles y optimización publicados; corregir S01 y medir en móviles físicos. |
| M07 | Armas diferentes y Groove menos repetitivo | Parcial. Tres armas de corte y ocho del modo Destrucción son ámbitos distintos. Revisar equilibrio, feedback y variedad; faltan música/BPM reales y cosméticos persistentes. |
| M08 | Yeppo vivo y poco intrusivo | Parcial. Tres paseos y contacto real publicados; conservar identidad, opt-in y movimiento reducido. IA generativa/3D siguen siendo fases distintas. |
| M09 | Administración más ágil | Parcial. Hay administración y buzones; falta bandeja unificada con prioridades, moderación de fotos y seguimiento trazable. |
| M10 | PWA sólida | Parcial. Instalación y shell offline con pruebas; validar Android/iPhone físicos, recuperación, accesibilidad, observabilidad y procedimiento de rollback. |

## 6. Juegos: pendientes concretos

### Jack

| ID | Pendiente | Prioridad / dependencia |
| --- | --- | --- |
| S01 | Integración visual sin marcos, conservando el cable continuo y caras atenuadas | P0; corrección de esta entrega. |
| S02 | Ampliar el reparto hacia unas 30 personas | P2; hay 10 hojas de 3 expresiones, no 30 personas. Material autorizado e identificación pendientes. |
| S03 | Tres vidas por nivel y desbloqueos persistentes de Laberinto | Pendiente histórico; diseñar versión de práctica sin alterar silenciosamente la competición validada. |
| S04 | Infinite y Power como modos independientes | Diferibles; el último laberinto infinito actual no equivale a todos los conceptos históricos. Classic sigue sin poderes. |
| S05 | Tutorial inicial breve e interactivo | Pendiente; no contar una frase de controles como tutorial jugable completo. |
| S06 | Resultado competitivo recuperable tras cerrar/recargar | Pendiente; el reintento en memoria no es una cola durable. |

### Groove Ninja

| ID | Pendiente | Estado / siguiente acción |
| --- | --- | --- |
| G02 | Oleadas según BPM aproximado del tema real | Pendiente. El ritmo sintético/fijo no demuestra seguimiento del audio de la radio. |
| G03 | Funky Fiesta y WTHIMH para Groove | Pendiente de confirmar recursos, disponibilidad y conexión al juego; no sustituirlos por stems inventados. |
| G04 | Scratch con desafío rítmico entretenido tipo Guitar Hero | Parcial. Existen patrones temporizados; evaluar beatmap real, lectura y diversión. No declararlo acabado solo por pasar tests. |
| G05 | Cortes dirigidos arriba/abajo y secuencias | Parcial. Comprobar eje horizontal/vertical no equivale a todas las direcciones pedidas. |
| G06 | Estilos de corte desbloqueables localmente | Pendiente; cosméticos que no alteren la competición. |
| G07 | Variación de cabina, armas y multicortes | Parcial. Hay variación/feedback y especiales; revisar legibilidad y diversidad a lo largo de una sesión completa. |
| G08 | Ranking/competición online de Groove | Pendiente; no usar puntuación local como resultado verificado ni conceder DANZPOINTS desde el cliente. |

### Catálogo y trabajo externo

| ID | Juego / encargo | Estado |
| --- | --- | --- |
| A01 | Arena DANZ inspirado en Bomberman | Beta local publicada; memoria/kit entregados; pulido gráfico y siguientes mapas por integrar al recibir Gemini. |
| A02 | Arena online desde dos móviles | Pendiente: salas, autoridad, tick, latencia, reconexión y resultados validados. No implementar una simulación de online. |
| J09 | Yeppo Pilla-Pilla | Aprobado; persecución/escape, obstáculos y cambio de papeles. Pendiente. |
| J10 | DANZ Kart Mini | Aprobado; carreras cortas y derrape. Pendiente. |
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
| C03 | Pases recuperables y enviados por email | Parcial/pending. El pase anónimo local depende del navegador; falta la recuperación completa acordada. QR artísticos no son requisito de este cierre. |
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
| MU01 | Hilo general con activar/desactivar y ventana discreta | Interfaz implementada. Verificar los seis MP3 configurados en producción y qué temas faltan; no contar un título en la lista como audio reproducible. |
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

## 12. Evidencia y mantenimiento

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
- Corrección S01 y prueba de regresión escritas; build local y 19 pruebas de
  reglas de Snake correctos. Auditoría de navegador y publicación en curso.
- Registro general creado y reglas de seguimiento añadidas a `AGENTS.md`.
- Próximo bloque de desarrollo: Yeppo Pilla-Pilla local, sin duplicar el trabajo
  de Arena que el propietario continúe en Gemini; Groove mantiene G02–G08 visibles.
