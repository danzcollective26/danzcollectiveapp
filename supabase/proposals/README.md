# Propuesta de permisos mínimos — sin aplicar

Estos archivos **no están en `supabase/migrations`** y no deben ejecutarse
automáticamente. Se prepararon a partir de una auditoría remota de solo lectura
el 9 de noviembre de 2026. No hay cambios aplicados en Supabase.

`client_minimum_grants.sql` propone únicamente GRANT/REVOKE sobre las siete
tablas existentes. No crea tablas, funciones ni policies ni modifica Storage.
Debe revisarse y probarse primero contra una copia local o un entorno de
pruebas. Si se aprueba para una migración, crearla con la CLI de Supabase
compatible y versionar entonces el resultado; no tratar esta propuesta como
historial remoto.

Observación de origen: `has_table_privilege` devolvió false para CRUD para
anon, authenticated **y service_role** en las siete tablas. `has_schema_privilege`
devolvió true para USAGE de public en los tres roles. `aclexplode(relacl)`
mostró grants explícitos de TRUNCATE/REFERENCES/TRIGGER/MAINTAIN a esos roles,
sin grants a PUBLIC; `pg_auth_members` no devolvió roles heredados para ellos.
El propietario es postgres. Se comprueba otra vez el supuesto de grants a
PUBLIC/membresías antes de ejecutar la propuesta. No se modifica service_role:
la futura API administrativa/canje deberá definir cómo accede como servidor.
RLS bypass de service_role no le da por sí solo privilegios CRUD de tabla.

La propuesta deja anon sin acceso a las tablas, permite a authenticated leer
según las policies ya existentes y editar únicamente los campos previstos de
su propio perfil. El INSERT de denuncias se limita a columnas sin `status`:
así el servidor usa el valor por defecto `pending`. Cualquier acceso de tabla
más amplio futuro requerirá volver a comprobar esta restricción.

`verify_client_privileges.sql` comprueba privilegios efectivos y denegaciones
con roles anon/authenticated. Es de solo lectura, usa transacciones con
ROLLBACK y no devuelve registros. Está pensado para ejecutarse **después** de
la propuesta, conectado como postgres en el entorno de prueba. Antes de
aplicar la propuesta fallará porque los privilegios esperados aún no existen.

Estos checks no prueban aislamiento entre dos asistentes reales: con tablas
vacías, una consulta sin filas no demuestra que la RLS sea correcta. Faltan
fixtures sintéticos de dos usuarios/dos eventos, fotos borrador/publicada/en
cuarentena, pruebas Storage y canje concurrente. No habilitar imágenes reales
ni presentar login/galerías como operativos basándose solo en estos checks.

Tras revisión: crear migración con CLI, aplicarla al entorno controlado,
ejecutar estos checks más los de fixtures, revisar advisors y únicamente
entonces planificar su aplicación remota. No se necesita pedir claves en chat.
