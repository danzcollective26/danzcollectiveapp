# Estado de Supabase comprobado en Codex

Fecha de revisión: **9 de noviembre de 2026** (Europe/Madrid).
Proyecto: `ttgehdknhnrxtddxpknc`, `danzcollectiveapp Project`, región `eu-west-1`.

Auditoría de **solo lectura** mediante la conexión Supabase. Se consultaron
metadatos de esquema, privilegios, policies, buckets, migraciones, funciones y
advisors. No se consultaron fotografías, perfiles, correos ni otros contenidos
de usuarios; no se modificó el proyecto remoto y no se obtuvieron claves.

## Estado comprobado

- Proyecto `ACTIVE_HEALTHY`, PostgreSQL 17 (`17.11.0.011`).
- Siete tablas `public`, todas con RLS activada: `danz_events`,
  `danz_profiles`, `danz_attendance`, `danz_photos`, `danz_photo_reports`,
  `danz_admins` y `danz_event_access_codes`.
- La herramienta de inventario devuelve 0 filas para cada tabla; es un
  resumen de metadatos, no una prueba funcional de usuarios o galerías.
- Bucket `danz-event-photos`: **privado**, límite 25 MiB por objeto, tipos
  permitidos `image/jpeg`, `image/png`, `image/webp`.
- No hay Edge Functions desplegadas ni funciones RPC de negocio en `public`.
- La función `public.rls_auto_enable` es un `event_trigger`, con
  `search_path=pg_catalog` y EXECUTE limitado a postgres; no es un endpoint
  para canjear códigos ni gestionar galerías.
- Tipos del esquema real generados en `src/types/database.ts`; no contienen
  registros, credenciales ni conexión de cliente.

Migraciones registradas:

| Versión | Nombre |
| --- | --- |
| `20261107055811` | `danz_core_private_foundation` |
| `20261107055900` | `danz_photo_moderation_foundation` |
| `20261107055903` | `restrict_photo_reports_to_attendees` |
| `20261107060023` | `danz_admin_and_private_access_codes` |

Estas entradas confirman historial remoto. Los SQL originales no se han
exportado a una carpeta de migraciones ni ejecutado de nuevo.

## Acceso que permiten las policies actuales

Hay nueve policies en `public` y ninguna en `storage`:

| Tabla | Policies existentes para `authenticated` |
| --- | --- |
| `danz_admins` | SELECT de la propia pertenencia administrativa |
| `danz_attendance` | SELECT de las propias asistencias |
| `danz_events` | SELECT de eventos publicados a los que se tiene asistencia |
| `danz_photos` | SELECT de fotos publicadas del evento publicado al que se tiene asistencia |
| `danz_profiles` | SELECT, INSERT y UPDATE del propio perfil, con `WITH CHECK` en las escrituras |
| `danz_photo_reports` | SELECT de las propias denuncias e INSERT de denuncia propia sobre foto publicada accesible por asistencia |
| `danz_event_access_codes` | Ninguna policy; permanece cerrada por RLS |

No hay policies de edición administrativa de eventos o fotos ni de concesión
de asistencias. Tener una fila en `danz_admins` no concede por sí mismo esos
permisos. Tampoco se permite la exploración pública de eventos mediante
las policies actuales.

### Bloqueo real: faltan privilegios de tabla

Se comprobó `has_table_privilege` para cada una de las siete tablas:

| Rol | SELECT | INSERT | UPDATE | DELETE | TRUNCATE |
| --- | --- | --- | --- | --- | --- |
| `anon` | No | No | No | No | Sí |
| `authenticated` | No | No | No | No | Sí |

Por tanto, **la existencia de una policy de lectura no habilita todavía la
consulta desde la app**: antes debe concederse el privilegio de tabla
correspondiente. RLS y GRANT resuelven capas diferentes. También existen
REFERENCES/TRIGGER para esos roles. Conviene revocar los privilegios de
TRUNCATE/REFERENCES/TRIGGER que no necesita un cliente y otorgar únicamente
los de negocio previstos. No se intentó truncar nada ni se infiere que una
operación TRUNCATE esté expuesta directamente en la API REST.

Para habilitar el flujo actual con privilegio mínimo, partir de SELECT para
`authenticated` en los datos accesibles por las policies; INSERT/UPDATE
del perfil y SELECT/INSERT de denuncias. Mantener códigos, asistencias y
escrituras administrativas cerrados hasta disponer de un flujo servidor
autorizado y probado. No otorgar CRUD global ni hacer públicas las fotos.

Precisión adicional de la auditoría: `USAGE` del esquema `public` sí existe
para anon/authenticated/service_role. El bloqueo está en las tablas.
`aclexplode(relacl)` mostró permisos directos TRUNCATE/REFERENCES/TRIGGER y
MAINTAIN a esos tres roles, sin grants PUBLIC en las siete tablas;
`pg_auth_members` no devolvió membresías para ellos. Incluso service_role
carece de SELECT/INSERT/UPDATE/DELETE: saltarse RLS no sustituye el GRANT.
Solo postgres, propietario, tiene esos permisos de negocio actualmente.

Se preparó una propuesta **sin aplicar** en `supabase/proposals/` con
privilegios mínimos de cliente y verificaciones negativas de metadatos/roles.
Incluye comprobaciones previas sobre grants PUBLIC y herencia. No concede
acceso de servidor, no cambia policies ni crea tablas. No se ha ejecutado ni
validado funcionalmente contra una copia de la base; debe probarse antes de
convertirla en migración. Los checks no consultan registros.

### Detalle a corregir antes de habilitar denuncias

La policy INSERT comprueba autor y acceso a la foto, pero no exige
`status = 'pending'`. La columna admite otros estados. Antes de conceder
INSERT, exigir estado inicial pendiente o utilizar un endpoint que lo fije
en servidor. Un denunciante no debe poder crear una denuncia ya resuelta
o descartada. Hoy el GRANT ausente impide esa inserción desde el cliente.

La propuesta local evita ese problema sin cambiar la policy: concede INSERT
solo sobre `photo_id`, `reporter_id` y `reason`, dejando `status` al valor
predeterminado del servidor. Un GRANT de tabla más amplio futuro exigiría
revisar esa garantía.

## Lo que falta por flujo

**Login y perfiles:** no se verificaron configuración Auth, URL de retorno,
proveedores OAuth, SMTP, límites de correo ni MFA. El frontend recuperado
no contiene cliente Supabase ni sesión. Preparar login por correo con
redirecciones controladas, perfil propio, cierre de sesión y errores visibles;
comprobar el envío real antes de anunciarlo como operativo. Bootstrap del
primer administrador y 2FA requieren un flujo independiente y autorizado.

**Galería privada:** faltan GRANT pertinentes y policies `storage.objects`
para leer objetos vinculados a fotos publicadas accesibles por asistencia,
y para las subidas de administradores. Definir una convención de rutas y
validar relación `storage_path`/evento. Las URLs firmadas deben tener vida
corta; una URL emitida sigue utilizable hasta caducar, incluso si cambia la
sesión Auth. Probar usuario sin cuenta, asistente autorizado, otro evento,
borrador y foto en cuarentena antes de usar imágenes reales.

**QR/sellos:** existe la tabla de hashes de códigos y la clave compuesta
de asistencia, pero no hay RPC o Edge Function de canje ni emisión de pase
individual. Implementar verificación de sesión, hash, caducidad, revocación,
límite de usos, actualización atómica y canje idempotente. No conceder al
cliente permiso para editar `used_count` ni para adjudicarse asistencia.

También se buscaron funciones con nombres `danz`, `redeem`, `claim` o
`access_code` fuera de los esquemas del sistema: ninguna encontrada. Esto,
junto con `public` sin funciones de negocio y Edge Functions vacío, respalda
que el canje no está implementado en las superficies Supabase inspeccionadas;
no descarta un servidor externo ajeno a este proyecto.

**Recompensas y Arcade:** no hay tablas/API de puntos ni validación de
puntuaciones. Los puntos locales del prototipo no son canjeables.

## Advisors observados

Seguridad: un aviso informativo por RLS sin policy en
`danz_event_access_codes`. El cierre es apropiado mientras el canje sea
servidor; no añadir una policy pública solo para eliminar el aviso.
[Documentación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Rendimiento: falta índice que cubra la FK `danz_photo_reports.reporter_id`.
Es coherente añadirlo cuando se habiliten consultas de denuncias propias.
[Documentación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

Hay cuatro avisos de índices aún no usados en una base sin tráfico. No
eliminarlos por esta observación: cubren relaciones necesarias.
[Documentación](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Los advisors muestran observaciones del 8 de noviembre por la noche UTC;
la revisión se hizo el 9 de noviembre en Madrid. No son una prueba de
seguridad completa ni sustituyen ensayos negativos de autorización.

## Trabajo local que puede continuar sin nuevas decisiones creativas

1. Conservar los tipos reales e implementar repositorios/adaptadores tipados
   sin mezclar IndexedDB con datos de nube ni migrar fotos automáticamente.
2. Preparar pruebas de privilegios/RLS, reportes pendientes y acceso Storage
   con usuarios y archivos sintéticos en un entorno controlado.
3. Preparar una migración revisable de privilegios mínimos y policy de
   reportes; versionar el esquema existente sin recrear el proyecto.
4. Implementar sesión y lectura privada cuando estén configuradas las
   credenciales publicables y las redirecciones del entorno de prueba.
5. Añadir canje transaccional de códigos y tests de concurrencia/duplicación
   antes de conectar los QR a galerías o premios.

No es necesario pedir al usuario contraseñas ni claves en el chat.

## Documentación consultada

- [Changelog actual](https://supabase.com/changelog.md); se revisaron los
  cambios recientes de CLI v3 y TLS. Esta auditoría usa MCP y Chromium
  moderno, sin dependencia de Flutter ni ejecución de CLI remoto.
- [Proteger la Data API y GRANT](https://supabase.com/docs/guides/api/securing-your-api).
- [Servir archivos privados y URLs firmadas](https://supabase.com/docs/guides/storage/serving/downloads).
- [createSignedUrl](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).

Límites: no se ejecutaron pruebas con cuentas reales ni se verificó un
despliegue; no hay evidencia de acceso funcional de extremo a extremo.
