# DANZPOINTS · base provisional del piloto

Se aplica a eventos publicados o archivados cuya fecha local en Europe/Madrid sea el 13 de noviembre de 2026. La fecha no se deduce del teléfono. El evento actual es DANZERS WORLD · Ch. VII.

| Acción | Puntos | Evidencia |
| --- | --- | --- |
| Asistencia | 1.000 por evento | Sello de la cuenta guardado en servidor |
| Ropa | 5 por euro, máximo conjunto 600 por evento | Ticket y cantidad comprobados por administración |
| Otras actividades | Pendiente de reglas | Todavía no acreditan puntos |
| Juego o sugerencia | 0 por ahora | No se otorgan premios por puntuaciones locales ni por enviar mensajes |

Se suman los céntimos de todos los tickets válidos del evento y se divide entre 20, redondeando a puntos enteros hacia abajo y aplicando el límite de 600. Así la asistencia siempre supera incluso la suma de las compras de ropa. Antes del inicio del evento los puntos figuran reservados; se activan por la hora del servidor.

El código personal DNZ de 12 caracteres se genera en el servidor al consultar el saldo. El cliente no decide el saldo. Cada ticket es único dentro de su evento: repetirlo con idéntico comprador e importe es idempotente; cambiar esos datos se rechaza. Anular una evidencia por error o devolución recalcula los puntos, sin ejecutar ninguna transacción de dinero.

La administración requiere membresía con events.manage y MFA aal2. La compra se registra manualmente con código DANZ, referencia e importe comprobado. El catálogo Shopify sigue siendo de lectura; no hay verificación automática de pedidos de Shopify.

El buzón guarda propuestas privadas de recompensa, producto, actividad u otra idea, con hasta cinco envíos en 24 horas y reintentos idempotentes. El administrador ve las 100 propuestas más recientes. No se publica su contenido.

La pestaña ofrece saldo personal, base del piloto, categorías de recompensas aún por desvelar y buzón. No hay canjes abiertos, costes ni premios inventados.

Persistencia: migración 20261112054604_danzpoints_event_pilot.sql aplicada a ttgehdknhnrxtddxpknc. Tres tablas con RLS por propietario, escrituras directas revocadas y cinco RPC públicas con validación en funciones privadas. No se han creado saldos de prueba en producción ni modificado sellos, fotos o autenticación existentes.

Verificación: pruebas de base de datos sobre permisos, MFA, privacidad, duplicados, límites y anulaciones; prueba de interfaz sobre cuenta, buzón, reintento y cierre de sesión. Reglas y recompensas podrán ampliarse en una nueva migración cuando se confirmen.
