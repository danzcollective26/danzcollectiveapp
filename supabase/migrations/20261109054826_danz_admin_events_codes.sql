-- Authenticated administration: explicit scopes and MFA, no client table writes.
begin;
create table public.danz_admin_permissions (
  user_id uuid not null references public.danz_admins(user_id) on delete cascade,
  permission text not null check (permission in ('events.manage','codes.manage')),
  primary key(user_id,permission)
);
alter table public.danz_admin_permissions enable row level security;
revoke all on public.danz_admin_permissions from public,anon,authenticated;
grant select on public.danz_admin_permissions to authenticated;
create policy "read own admin scopes" on public.danz_admin_permissions for select to authenticated
  using (user_id = (select auth.uid()));

create function public.danz_admin_context()
returns table (is_admin boolean, permissions text[])
language sql stable security invoker set search_path = ''
as $$
  select exists(select 1 from public.danz_admins a where a.user_id=(select auth.uid())),
    coalesce((select array_agg(p.permission order by p.permission) from public.danz_admin_permissions p
      join public.danz_admins a on a.user_id=p.user_id where p.user_id=(select auth.uid())),array[]::text[]);
$$;

create function danz_private.require_admin_scopes(p_scopes text[])
returns uuid language plpgsql stable security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_claims jsonb := auth.jwt();
begin
  if v_user is null or coalesce((v_claims->>'is_anonymous')::boolean,false)
    or coalesce(v_claims->>'aal','aal1') <> 'aal2'
    or not exists(select 1 from public.danz_admin_permissions p
      join public.danz_admins a on a.user_id=p.user_id
      where p.user_id=v_user and p.permission=any(p_scopes)) then
    raise exception 'Administrative permission and MFA required' using errcode='42501';
  end if;
  return v_user;
end;
$$;

create function danz_private.admin_events()
returns table (id uuid, title text, starts_at timestamptz, ends_at timestamptz, status text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform danz_private.require_admin_scopes(array['events.manage','codes.manage']);
  return query select e.id,e.title,e.starts_at,e.ends_at,e.status
    from public.danz_events e order by e.created_at desc,e.id limit 200;
end;
$$;

create function danz_private.admin_save_event(p_id uuid,p_title text,p_starts_at timestamptz,p_ends_at timestamptz,p_status text)
returns table (id uuid, title text, starts_at timestamptz, ends_at timestamptz, status text)
language plpgsql security definer set search_path = ''
as $$
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  if p_id is null or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_status is null or p_status not in ('draft','published','archived')
    or (p_status='published' and p_starts_at is null)
    or (p_ends_at is not null and p_starts_at is not null and p_ends_at < p_starts_at) then
    raise exception 'Invalid event fields' using errcode='22023';
  end if;
  return query insert into public.danz_events as e (id,title,starts_at,ends_at,status)
    values(p_id,btrim(p_title),p_starts_at,p_ends_at,p_status)
    on conflict on constraint danz_events_pkey do update set
      title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,status=excluded.status
    returning e.id,e.title,e.starts_at,e.ends_at,e.status;
end;
$$;

create function danz_private.admin_codes(p_event_id uuid)
returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform danz_private.require_admin_scopes(array['codes.manage']);
  return query select c.id,c.event_id,c.expires_at,c.max_uses,c.used_count,c.revoked_at,c.created_at
    from public.danz_event_access_codes c where c.event_id=p_event_id order by c.created_at desc,c.id limit 100;
end;
$$;

create function danz_private.admin_issue_code(p_event_id uuid,p_id uuid,p_code_hash text,p_expires_at timestamptz,p_max_uses integer)
returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_code public.danz_event_access_codes%rowtype;
begin
  perform danz_private.require_admin_scopes(array['codes.manage']);
  if p_id is null or p_event_id is null or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$'
    or p_expires_at is null or (p_max_uses is not null and p_max_uses<1) then
    raise exception 'Invalid code fields' using errcode='22023';
  end if;
  -- The same ID/hash makes an uncertain network retry idempotent.
  select c.* into v_code from public.danz_event_access_codes c where c.id=p_id for update;
  if found then
    if v_code.event_id<>p_event_id or v_code.code_hash<>p_code_hash
      or v_code.expires_at is distinct from p_expires_at
      or v_code.max_uses is distinct from p_max_uses then
      raise exception 'Conflicting issuance request' using errcode='22023';
    end if;
  else
    if p_expires_at <= now() then raise exception 'Expiry must be in the future' using errcode='22023'; end if;
    perform 1 from public.danz_events e where e.id=p_event_id and e.status in ('draft','published') for share;
    if not found then raise exception 'Event unavailable' using errcode='22023'; end if;
    insert into public.danz_event_access_codes(id,event_id,code_hash,expires_at,max_uses)
      values(p_id,p_event_id,p_code_hash,p_expires_at,p_max_uses)
      on conflict on constraint danz_event_access_codes_pkey do nothing;
    select c.* into v_code from public.danz_event_access_codes c where c.id=p_id;
    if v_code.event_id<>p_event_id or v_code.code_hash<>p_code_hash
      or v_code.expires_at is distinct from p_expires_at or v_code.max_uses is distinct from p_max_uses then
      raise exception 'Conflicting issuance request' using errcode='22023';
    end if;
  end if;
  return query select v_code.id,v_code.event_id,v_code.expires_at,v_code.max_uses,v_code.used_count,v_code.revoked_at,v_code.created_at;
end;
$$;

create function danz_private.admin_revoke_code(p_id uuid)
returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  perform danz_private.require_admin_scopes(array['codes.manage']);
  return query update public.danz_event_access_codes c set revoked_at=coalesce(c.revoked_at,now())
    where c.id=p_id returning c.id,c.event_id,c.expires_at,c.max_uses,c.used_count,c.revoked_at,c.created_at;
end;
$$;

create function public.danz_admin_events() returns table (id uuid, title text, starts_at timestamptz, ends_at timestamptz, status text)
language sql stable security invoker set search_path = '' as $$ select * from danz_private.admin_events(); $$;
create function public.danz_admin_save_event(p_id uuid,p_title text,p_starts_at timestamptz,p_ends_at timestamptz,p_status text) returns table (id uuid, title text, starts_at timestamptz, ends_at timestamptz, status text)
language sql security invoker set search_path = '' as $$ select * from danz_private.admin_save_event(p_id,p_title,p_starts_at,p_ends_at,p_status); $$;
create function public.danz_admin_codes(p_event_id uuid) returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from danz_private.admin_codes(p_event_id); $$;
create function public.danz_admin_issue_code(p_event_id uuid,p_id uuid,p_code_hash text,p_expires_at timestamptz,p_max_uses integer) returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from danz_private.admin_issue_code(p_event_id,p_id,p_code_hash,p_expires_at,p_max_uses); $$;
create function public.danz_admin_revoke_code(p_id uuid) returns table (id uuid, event_id uuid, expires_at timestamptz, max_uses integer, used_count integer, revoked_at timestamptz, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from danz_private.admin_revoke_code(p_id); $$;

revoke all on function danz_private.require_admin_scopes(text[]) from public,anon,authenticated;
revoke all on function public.danz_admin_context(),public.danz_admin_events(),public.danz_admin_codes(uuid),
  public.danz_admin_save_event(uuid,text,timestamptz,timestamptz,text),
  public.danz_admin_issue_code(uuid,uuid,text,timestamptz,integer),public.danz_admin_revoke_code(uuid),
  danz_private.admin_events(),danz_private.admin_codes(uuid),
  danz_private.admin_save_event(uuid,text,timestamptz,timestamptz,text),
  danz_private.admin_issue_code(uuid,uuid,text,timestamptz,integer),danz_private.admin_revoke_code(uuid)
from public,anon,authenticated;
grant execute on function public.danz_admin_context(),public.danz_admin_events(),public.danz_admin_codes(uuid),
  public.danz_admin_save_event(uuid,text,timestamptz,timestamptz,text),
  public.danz_admin_issue_code(uuid,uuid,text,timestamptz,integer),public.danz_admin_revoke_code(uuid),
  danz_private.admin_events(),danz_private.admin_codes(uuid),
  danz_private.admin_save_event(uuid,text,timestamptz,timestamptz,text),
  danz_private.admin_issue_code(uuid,uuid,text,timestamptz,integer),danz_private.admin_revoke_code(uuid)
to authenticated;
commit;
