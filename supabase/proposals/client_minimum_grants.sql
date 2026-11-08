-- PROPUESTA LOCAL SIN APLICAR. Ver README.md antes de usar.
-- Destino de prueba: esquema existente de DANZ, PostgreSQL 17.
-- No incluye cambios de policy, tablas, Storage ni permisos de servidor.
begin;

-- La auditoría observó grants directos sin PUBLIC ni roles heredados.
-- Si esto ha cambiado, detenerse y revisar la herencia antes de revocar.
do $$
declare
  target_tables text[] := array[
    'danz_admins','danz_attendance','danz_event_access_codes','danz_events',
    'danz_photo_reports','danz_photos','danz_profiles'
  ];
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) a
    where n.nspname = 'public' and c.relname = any(target_tables)
      and a.grantee = 0
  ) then
    raise exception 'Hay grants PUBLIC: revisar permisos antes de continuar';
  end if;
  if exists (
    select 1 from pg_auth_members m
    join pg_roles r on r.oid = m.member
    where r.rolname in ('anon','authenticated')
  ) then
    raise exception 'Hay roles heredados: revisar permisos antes de continuar';
  end if;
  if (
    select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=any(target_tables)
      and c.relkind='r' and c.relrowsecurity
  ) <> 7 then
    raise exception 'Se esperaban las siete tablas DANZ con RLS activada';
  end if;
end $$;

-- Grants innecesarios observados directamente en estos roles de cliente.
revoke truncate, references, trigger, maintain on table
  public.danz_admins, public.danz_attendance, public.danz_event_access_codes,
  public.danz_events, public.danz_photo_reports, public.danz_photos,
  public.danz_profiles
from anon, authenticated;

-- RLS sigue restringiendo las filas a las policies existentes.
grant select on table
  public.danz_admins, public.danz_attendance, public.danz_events,
  public.danz_photo_reports, public.danz_photos, public.danz_profiles
to authenticated;

-- Perfil: preservar propietario/fecha; la policy comprueba auth.uid().
grant insert (user_id, display_name, instagram_handle)
  on public.danz_profiles to authenticated;
grant update (display_name, instagram_handle)
  on public.danz_profiles to authenticated;

-- Denuncia: no permitir asignar status/id/created_at desde cliente.
-- La policy existente comprueba autor y acceso a la foto.
grant insert (photo_id, reporter_id, reason)
  on public.danz_photo_reports to authenticated;

-- Sin GRANT de códigos, asistencias, admin, fotos/eventos editables o DELETE.
-- Sin GRANT a service_role: diseñar el servidor/canje por separado.
commit;
