-- Enable existing client RLS safely and private photo-object reads.
-- Created with Supabase CLI 3.0.0 migration new; SQL tested against metadata snapshot.
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
  if not exists (
    select 1 from storage.buckets
    where id='danz-event-photos' and public=false
  ) then
    raise exception 'Se esperaba el bucket DANZ existente y privado';
  end if;
  -- Column GRANT cannot restrict any table/column grant already present.
  if has_any_column_privilege('authenticated','public.danz_profiles','INSERT')
     or has_any_column_privilege('authenticated','public.danz_profiles','UPDATE')
     or has_any_column_privilege('authenticated','public.danz_photo_reports','INSERT')
     or has_any_column_privilege('authenticated','public.danz_photo_reports','UPDATE')
     or has_any_column_privilege('anon','public.danz_photo_reports','INSERT') then
    raise exception 'Hay permisos de escritura previos no auditados: detener y revisar';
  end if;
  if not exists (
    select 1 from pg_attribute a join pg_attrdef d
      on d.adrelid=a.attrelid and d.adnum=a.attnum
    where a.attrelid='public.danz_photo_reports'::regclass
      and a.attname='status'
      and pg_get_expr(d.adbin,d.adrelid)='''pending''::text'
  ) then
    raise exception 'El estado inicial de denuncia debe ser pending';
  end if;
  if (
    select count(*) from pg_constraint c
    where (c.conrelid='public.danz_events'::regclass
      and c.conname='danz_events_status_check'
      and pg_get_constraintdef(c.oid,true) =
        'CHECK (status = ANY (ARRAY[''draft''::text, ''published''::text, ''archived''::text]))')
    or (c.conrelid='public.danz_photos'::regclass
      and c.conname='danz_photos_status_check'
      and pg_get_constraintdef(c.oid,true) =
        'CHECK (status = ANY (ARRAY[''draft''::text, ''published''::text, ''quarantined''::text]))')
    or (c.conrelid='public.danz_photo_reports'::regclass
      and c.conname='danz_photo_reports_status_check'
      and pg_get_constraintdef(c.oid,true) =
        'CHECK (status = ANY (ARRAY[''pending''::text, ''reviewing''::text, ''resolved''::text, ''dismissed''::text]))')
  ) <> 3 then
    raise exception 'Los estados permitidos cambiaron respecto al esquema auditado';
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

-- Index used by own-report RLS and the reporter foreign key.
create index if not exists danz_photo_reports_reporter_idx
  on public.danz_photo_reports (reporter_id);

-- Storage remains private. Authenticated attendees can select only objects
-- whose exact path maps to a published photo in their published event.
-- No upload/update/delete policy or public-event policy is introduced.
create policy "read attended published DANZ photo objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'danz-event-photos'
  and (select auth.uid()) is not null
  and exists (
    select 1
    from public.danz_photos p
    join public.danz_events e on e.id = p.event_id
    join public.danz_attendance a on a.event_id = p.event_id
    where p.storage_path = storage.objects.name
      and p.status = 'published'
      and e.status = 'published'
      and a.user_id = (select auth.uid())
  )
);

-- No client writes to codes/attendance/admins/photos/events, and no DELETE.
-- Server roles and canje/admin workflows remain separately controlled.
commit;
