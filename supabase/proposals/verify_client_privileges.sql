-- Checks de SOLO LECTURA para DESPUÉS de la propuesta, en entorno de prueba.
-- No devuelve datos ni usa TRUNCATE/INSERT/UPDATE reales. Ver README.md.
begin;
do $$
declare
  t text;
  role_name text;
begin
  foreach role_name in array array['anon','authenticated'] loop
    if not has_schema_privilege(role_name,'public','USAGE') then
      raise exception '% no tiene USAGE public',role_name;
    end if;
    foreach t in array array[
      'danz_admins','danz_attendance','danz_event_access_codes','danz_events',
      'danz_photo_reports','danz_photos','danz_profiles'
    ] loop
      if has_table_privilege(role_name,'public.'||t,'TRUNCATE')
         or has_table_privilege(role_name,'public.'||t,'REFERENCES')
         or has_table_privilege(role_name,'public.'||t,'TRIGGER')
         or has_table_privilege(role_name,'public.'||t,'MAINTAIN') then
        raise exception '% conserva privilegios ajenos a cliente en %',role_name,t;
      end if;
      if has_table_privilege(role_name,'public.'||t,'DELETE') then
        raise exception '% puede DELETE en %',role_name,t;
      end if;
      if role_name='anon' and (
        has_any_column_privilege(role_name,'public.'||t,'SELECT')
        or has_any_column_privilege(role_name,'public.'||t,'INSERT')
        or has_any_column_privilege(role_name,'public.'||t,'UPDATE')
      ) then
        raise exception 'anon conserva acceso de datos en %',t;
      end if;
    end loop;
  end loop;
  foreach t in array array[
    'danz_admins','danz_attendance','danz_events','danz_photo_reports',
    'danz_photos','danz_profiles'
  ] loop
    if not has_table_privilege('authenticated','public.'||t,'SELECT') then
      raise exception 'authenticated carece SELECT requerido en %',t;
    end if;
  end loop;
  if has_any_column_privilege('authenticated','public.danz_event_access_codes','SELECT')
     or has_any_column_privilege('authenticated','public.danz_attendance','INSERT')
     or has_any_column_privilege('authenticated','public.danz_attendance','UPDATE')
     or has_any_column_privilege('authenticated','public.danz_admins','INSERT')
     or has_any_column_privilege('authenticated','public.danz_photos','INSERT')
     or has_any_column_privilege('authenticated','public.danz_events','INSERT') then
    raise exception 'Acceso administrativo/códigos/asistencias inesperado';
  end if;
  if not has_column_privilege('authenticated','public.danz_profiles','display_name','UPDATE')
     or has_column_privilege('authenticated','public.danz_profiles','user_id','UPDATE')
     or has_column_privilege('authenticated','public.danz_profiles','created_at','INSERT')
     or not has_column_privilege('authenticated','public.danz_photo_reports','reason','INSERT')
     or has_column_privilege('authenticated','public.danz_photo_reports','status','INSERT')
     or has_column_privilege('authenticated','public.danz_photo_reports','status','UPDATE') then
    raise exception 'Permisos de columnas de perfil/denuncia incorrectos';
  end if;
end $$;
rollback;

-- Denegación efectiva de consulta anónima, sin leer filas (LIMIT 0).
begin;
set local role anon;
do $$
begin
  begin
    perform id from public.danz_events limit 0;
    raise exception 'SELECT anónimo de eventos se permitió inesperadamente';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;

-- Aun autenticado, no se debe consultar la tabla privada de hashes.
begin;
set local role authenticated;
do $$
begin
  begin
    perform code_hash from public.danz_event_access_codes limit 0;
    raise exception 'Se permitió consultar hashes de códigos desde el cliente';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;
