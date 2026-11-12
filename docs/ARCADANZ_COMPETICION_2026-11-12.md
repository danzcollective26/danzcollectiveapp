# ARCADANZ: competición y doce laberintos

El propietario ha pedido ampliar Snake, registrar partidas de cuentas DANZ, competir y premiar el récord semanal. Tras rechazar una propuesta de 200 puntos, decidió que asistir a una fiesta debe valer aproximadamente un año siendo primero. Base final: podio semanal 50/25/10 DANZPOINTS; máximo 20 premios por persona al año entre todos los puestos. Máximo anual posible = 1.000 puntos = una asistencia. Máximo tres semanas consecutivas premiadas.

## Reglas

- Semana de lunes 00:00 a lunes 00:00 Europe/Madrid; año natural del cierre.
- Solo Clásico paga a sus tres primeros (50, 25 y 10). Laberinto tiene clasificación separada semanal e histórica, sin premio duplicado; competición siempre comienza en nivel 1.
- Mejor partida por cuenta; top 20 y puesto propio aunque quede fuera. Empates por registro en servidor más antiguo, luego UUID como desempate estable.
- Si un integrante del podio alcanza el límite, conserva el puesto y no cobra esa semana. No se desplaza el premio al siguiente. Los límites de tres semanas/20 anuales siguen a la persona aunque cambie de puesto. Una semana sin cobrar corta la racha; el límite anual no se reinicia hasta el año siguiente.
- Cada puesto del podio y su premio se guardan una sola vez, con máximo un puesto por cuenta en esa semana. Trabajo de servidor cada hora, y recuperación en consultas autenticadas de ranking/saldo. La hora del cierre de Madrid coincide con una hora entera UTC incluso con cambio de hora.
- Los antiguos récords de localStorage y las prácticas no se importan a la clasificación ni dan puntos. Se entra explícitamente desde COMPETIR, con un apodo que se avisa visible a otros registrados. No se publican correos, nombres privados, IDs de usuario ni perfiles.

## Validación y límites

Ticket de servidor por cuenta/partida, semilla aleatoria del servidor, 30 minutos (o cierre de semana si llega antes), 60 inicios por hora, una partida activa por cuenta. El cliente envía solo ticket y direcciones, nunca la puntuación. El servidor reproduce tablero, PRNG, crecimiento, alimentos, paredes, niveles, colisiones, inversión prohibida y duración mínima conservadora compatible con giros instantáneos. No admite movimientos después de chocar/completar. Máximo 20.000 movimientos. La verificación física reduce manipulación de puntuaciones; no pretende impedir bots capaces de jugar rutas legales.

Reenvíos con el mismo ticket/replay devuelven el resultado previo sin duplicar. Un replay distinto se rechaza. La interfaz conserva reintento en memoria ante fallo de red hasta caducidad; recargar/cerrar puede perder un resultado no guardado. Cambio/cierre de cuenta cancela solicitudes y no transfiere partidas. Se puede terminar voluntariamente y guardar, o guardar automáticamente al perder. Rejugar exige ticket nuevo.

Tablas y funciones internas en danz_private, RLS activo y sin permisos directos cliente. Wrappers públicos SECURITY INVOKER delegan a funciones internas con auth.uid y rechazo de usuarios anónimos. Cierre automático sin endpoint público; consultas autenticadas pueden recuperar cierres pendientes después de comprobar cuenta. El resumen de DANZPOINTS incorpora premios al saldo anterior sin alterar compras, asistencia, sugerencias ni canjes.

## Doce mapas

Islas, Pasillos, Circuito, Puentes, Órbitas, Cruces, Columnas, Túneles, Anillos, Zigzag, Patchbay y Backstage. Paredes: 8, 22, 40, 48, 64, 80, 112, 128, 144, 170, 187, 196. Casillas libres conectadas, salida inicial y primer objetivo seguros. El último continúa hasta choque o tablero lleno. Se conservan nombre, 30 expresiones, control instantáneo y pantalla completa.

## Comprobaciones

Pruebas de base de datos con cuentas sintéticas solo locales: accesos, privacidad, reintentos, propiedad, caducidad, duración, simulación navegador/servidor, 12 mapas, empate, rachas, límite anual y año del cierre. pg_cron se sustituye por un adaptador de plataforma en PGlite y se verifica aparte en servidor. Pruebas E2E nuevas con servicio falso, sin correos ni registros reales. No se introducen puntuaciones o usuarios ficticios en producción.

## Activación confirmada

Tras dos confirmaciones caducadas, el propietario autorizó explícitamente continuar. Supabase confirmó success en el tercer intento. Migración aplicada con versión del historial 20261112083248: supabase/migrations/20261112083248_danz_snake_competition.sql. El CLI no está instalado; el nombre se toma del historial nativo, no se inventa.

Verificación de servidor: replay RRRR = 10 puntos/nivel 1; funciones registradas; RLS activo en ambas tablas; INSERT cliente, EXECUTE anónimo y acceso cliente a la simulación privados denegados. Tarea danz-snake-weekly-close activa con horario 0 * * * *. No se insertaron usuarios, partidas o premios sintéticos en producción.

Advisors sin nuevas advertencias de seguridad: información esperada RLS sin políticas en tablas privadas (acceso directo denegado y funciones autorizadas). Se conserva la advertencia anterior sobre protección de contraseñas filtradas, sin cambiar configuración Auth. La web activa competición por defecto después de esta migración; VITE_SNAKE_COMPETITION_ENABLED=false permite pausarla en un build posterior. Las E2E usan un servicio sintético aislado.

El primer CI de revisión pasó 131 pruebas internas, 8 PWA y 309 E2E; fallaron dos tipos de comprobación por tamaño: un selector de LABERINTO ambiguo y navegación con el reloj virtual detenido antes de cargar Cuenta. Se acotó el selector al control del juego y se reanudó el reloj antes de esa navegación. La última comprobación completa debe registrarse al terminar; no presentar el primer intento como cierre final.


## Cambio posterior: identidad obligatoria y podio

El propietario pidió premiar los tres primeros y exigir Instagram vinculado a correo para competición y puntos en general. Se requiere correo confirmado en Auth y titularidad de Instagram comprobada, con un código emitido por servidor y revisión manual de personal con permiso events.manage y MFA. No se valida escribiendo un @ ni usando user_metadata. La aprobación vincula el handle al perfil, limita un Instagram verificado a una cuenta y registra quién lo validó. Si cambia el handle del perfil, la vinculación deja de ser válida. Se puede recuperar la disponibilidad verificando el nuevo perfil.

El correo confirmado es el de DANZ; no se afirma conocer ni comprobar el email privado con el que Instagram se creó. No hay autenticación Meta ni lectura automatizada de DMs. La persona envía el código desde su Instagram o lo muestra en su bio; el equipo comprueba esa prueba antes de validar en ADMINISTRAR. Desafíos privados, siete días, cinco cambios al día, revisión ligada al código exacto para rechazar solicitudes cambiadas/caducadas.

Asistencias/compras/premios se conservan como puntos reservados mientras falte verificación. El servidor devuelve disponible=0 y traslada lo ganado a pendientes. Solicitudes y buzón siguen permitidos sin reclamar puntos. Snake exige identidad válida tanto al iniciar como al enviar; no basta ocultar el botón. La verificación no prueba una persona física única entre múltiples cuentas Instagram, ni pretende hacerlo.


**Segunda migración aplicada y verificada:** 20261112085550_danz_snake_podium_identity.sql. Podio 50/25/10 y comprobación de identidad activos en servidor, columnas de podio presentes, RLS de vinculaciones activo, trabajo horario activo. Clientes no pueden llamar al inicio de juego sin filtro ni al resumen previo sin filtro, ni modificar vinculaciones. No se han introducido cuentas o premios de prueba en producción. Las advertencias de Advisors siguen siendo las preexistentes de Auth y notas esperadas sobre tablas privadas sin políticas.

El propietario eligió PARTY OVER como texto de derrota, sustituyendo GAME OVER. Conservar ese guiño en futuras versiones y juegos cuando corresponda.
