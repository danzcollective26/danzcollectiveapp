# ARCADANZ: competición y doce laberintos

El propietario ha pedido ampliar Snake, registrar partidas de cuentas DANZ, competir y premiar el récord semanal. Tras rechazar una propuesta de 200 puntos, decidió que asistir a una fiesta debe valer aproximadamente un año siendo primero. Base implementada: 50 DANZPOINTS por victoria pagada, máximo 20 premios al año = 1.000 puntos = una asistencia. Máximo tres semanas consecutivas premiadas.

## Reglas

- Semana de lunes 00:00 a lunes 00:00 Europe/Madrid; año natural del cierre.
- Solo Clásico paga. Laberinto tiene clasificación separada semanal e histórica, sin premio duplicado; competición siempre comienza en nivel 1.
- Mejor partida por cuenta; top 20 y puesto propio aunque quede fuera. Empates por registro en servidor más antiguo, luego UUID como desempate estable.
- Si el nº 1 alcanza límite, conserva el puesto pero no cobra esa semana. No se transfiere premio al segundo. Una semana sin cobrar corta la racha; el límite anual no se reinicia hasta el año siguiente.
- Ganador semanal y premio se guardan una sola vez. Trabajo de servidor cada hora, y recuperación en consultas autenticadas de ranking/saldo. La hora del cierre de Madrid coincide con una hora entera UTC incluso con cambio de hora.
- Los antiguos récords de localStorage y las prácticas no se importan a la clasificación ni dan puntos. Se entra explícitamente desde COMPETIR, con un apodo que se avisa visible a otros registrados. No se publican correos, nombres privados, IDs de usuario ni perfiles.

## Validación y límites

Ticket de servidor por cuenta/partida, semilla aleatoria del servidor, 30 minutos (o cierre de semana si llega antes), 60 inicios por hora, una partida activa por cuenta. El cliente envía solo ticket y direcciones, nunca la puntuación. El servidor reproduce tablero, PRNG, crecimiento, alimentos, paredes, niveles, colisiones, inversión prohibida y duración mínima conservadora compatible con giros instantáneos. No admite movimientos después de chocar/completar. Máximo 20.000 movimientos. La verificación física reduce manipulación de puntuaciones; no pretende impedir bots capaces de jugar rutas legales.

Reenvíos con el mismo ticket/replay devuelven el resultado previo sin duplicar. Un replay distinto se rechaza. La interfaz conserva reintento en memoria ante fallo de red hasta caducidad; recargar/cerrar puede perder un resultado no guardado. Cambio/cierre de cuenta cancela solicitudes y no transfiere partidas. Se puede terminar voluntariamente y guardar, o guardar automáticamente al perder. Rejugar exige ticket nuevo.

Tablas y funciones internas en danz_private, RLS activo y sin permisos directos cliente. Wrappers públicos SECURITY INVOKER delegan a funciones internas con auth.uid y rechazo de usuarios anónimos. Cierre automático sin endpoint público; consultas autenticadas pueden recuperar cierres pendientes después de comprobar cuenta. El resumen de DANZPOINTS incorpora premios al saldo anterior sin alterar compras, asistencia, sugerencias ni canjes.

## Doce mapas

Islas, Pasillos, Circuito, Puentes, Órbitas, Cruces, Columnas, Túneles, Anillos, Zigzag, Patchbay y Backstage. Paredes: 8, 22, 40, 48, 64, 80, 112, 128, 144, 170, 187, 196. Casillas libres conectadas, salida inicial y primer objetivo seguros. El último continúa hasta choque o tablero lleno. Se conservan nombre, 30 expresiones, control instantáneo y pantalla completa.

## Comprobaciones

Pruebas de base de datos con cuentas sintéticas solo locales: accesos, privacidad, reintentos, propiedad, caducidad, duración, simulación navegador/servidor, 12 mapas, empate, rachas, límite anual y año del cierre. pg_cron se sustituye por un adaptador de plataforma en PGlite y se verifica aparte en servidor. Pruebas E2E nuevas con servicio falso, sin correos ni registros reales. No se introducen puntuaciones o usuarios ficticios en producción.
