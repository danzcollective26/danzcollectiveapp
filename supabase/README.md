# Esquema y pruebas de permisos

Las cuatro migraciones `20261107055811`–`20261107060023` son exportaciones de
`supabase_migrations.schema_migrations` del proyecto existente. Se conservaron
versiones, nombres y SQL almacenados; no se aplicaron de nuevo. No contienen
registros de usuarios ni fotografías. La migración de acceso privado se creó
con `supabase migration new danz_private_gallery_client_access` en CLI 3.0.0.
Si se aplica por MCP, sincronizar después su versión local con el historial
remoto para evitar que otro despliegue intente volver a aplicarla.

La carpeta `tests` incluye un snapshot de metadatos del esquema DANZ actual
y fixtures independientes para pruebas aisladas. No aplicar esos fixtures
ni `baseline.sql` en el proyecto remoto.

```sh
node --test tests/database.test.ts
```

Los tests utilizan PGlite 0.5.15 (PostgreSQL 18.6 WASM); el proyecto remoto usa
PostgreSQL 17.11. La migración solo usa SQL compatible con 17. Las siete tablas,
constraints, índices, grants y nueve policies del snapshot se recuperaron de
los catálogos remotos. `auth.uid()` replica su definición exacta. Auth users y
Storage usan stubs mínimos para los campos necesarios; el test no implementa
Auth, SMTP, OAuth, el servidor Storage ni emisión HTTP de URLs firmadas.

Se prueban dos usuarios y dos eventos sintéticos, aislamiento de cuentas y
asistencias, fotos publicadas/borradores/cuarentena, bucket/rutas exactas,
reportes pendientes y columnas protegidas, admin sin privilegios automáticos,
denegación anónima y ausencia de UID, retirada de asistencia, edición/borrado
de objetos y códigos privados cerrados. No se envían correos ni se usa la red.

Las migraciones históricas no incluyen toda la configuración administrada
de Supabase: el bucket privado y los grants/default privileges observados
existían fuera de ese historial. Por eso **no se anuncia `supabase db reset`
como reproducción completa del entorno**. Antes de habilitar ese flujo, fijar
la configuración local de Supabase y reconstruir sus recursos administrados,
sin volver a ejecutar el snapshot de pruebas sobre producción.

Para crear archivos CLI sin escribir en el home de este entorno:

```sh
SUPABASE_HOME=/workspace/work/supabase-cli-state SUPABASE_TELEMETRY_DISABLED=true \
  npm exec --cache /workspace/work/npm-cache --yes --package supabase@3.0.0 -- \
  supabase migration new nombre_del_cambio
```

No se usa `--yes` de Supabase ni se ejecutan comandos CLI sobre el remoto.

El pasaporte añade `20261109041611_danz_event_passport`, aplicado al proyecto
existente después de pruebas aisladas. Su archivo se creó con CLI y la versión
se sincronizó con la emitida por MCP. `tests/event-passport-database.test.ts`
comprueba canje, cupos, duplicados, límites de intentos y aislamiento del pasaporte.
Una prueba SQL remota equivalente usó únicamente filas sintéticas y ROLLBACK.
Las funciones públicas son wrappers invoker; los helpers definer están en
`danz_private`, que debe permanecer fuera de los schemas expuestos por la Data API.
