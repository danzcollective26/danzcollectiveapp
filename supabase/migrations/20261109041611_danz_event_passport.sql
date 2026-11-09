-- Self-service event codes. Only the bounded private function can grant attendance.
begin;

create schema danz_private;
revoke all on schema danz_private from public, anon, authenticated;
grant usage on schema danz_private to authenticated;

create table danz_private.code_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started timestamptz not null,
  attempts integer not null check (attempts between 1 and 9)
);
alter table danz_private.code_attempts enable row level security;
revoke all on table danz_private.code_attempts from public, anon, authenticated;

create function danz_private.redeem_event_code(p_code text)
returns table (status text, event_id uuid, granted_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_attempts integer;
  v_code public.danz_event_access_codes%rowtype;
  v_normalized text;
  v_granted timestamptz;
begin
  if v_user is null or coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- A per-account lock serializes all codes for this user. Returning failures
  -- instead of raising preserves the attempt counter in the API transaction.
  insert into danz_private.code_attempts as a (user_id, window_started, attempts)
    values (v_user, now(), 1)
  on conflict (user_id) do update set
    window_started = case when a.window_started <= now() - interval '10 minutes' then now() else a.window_started end,
    attempts = case when a.window_started <= now() - interval '10 minutes' then 1 else least(a.attempts + 1, 9) end
  returning attempts into v_attempts;

  if v_attempts > 8 then
    return query select 'rate_limited'::text, null::uuid, null::timestamptz;
    return;
  end if;
  if p_code is null or octet_length(p_code) > 256 then
    return query select 'unavailable'::text, null::uuid, null::timestamptz;
    return;
  end if;
  v_normalized := upper(regexp_replace(p_code, '[[:space:]-]', '', 'g'));
  if v_normalized !~ '^[A-Z0-9]{12,64}$' then
    return query select 'unavailable'::text, null::uuid, null::timestamptz;
    return;
  end if;

  -- The unique hash lookup locks the code until commit, including its last use.
  -- No code hashes, other accounts or private event metadata leave this function.
  select c.* into v_code from public.danz_event_access_codes c
    join public.danz_events e on e.id = c.event_id
    where c.code_hash = pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_normalized, 'UTF8')), 'hex')
      and e.status = 'published'
    for update of c;
  if not found then
    return query select 'unavailable'::text, null::uuid, null::timestamptz;
    return;
  end if;

  select a.granted_at into v_granted from public.danz_attendance a
    where a.user_id = v_user and a.event_id = v_code.event_id;
  if found then
    return query select 'already_attended'::text, v_code.event_id, v_granted;
    return;
  end if;
  if v_code.revoked_at is not null
     or (v_code.expires_at is not null and v_code.expires_at <= now())
     or (v_code.max_uses is not null and v_code.used_count >= v_code.max_uses) then
    return query select 'unavailable'::text, null::uuid, null::timestamptz;
    return;
  end if;

  insert into public.danz_attendance (user_id, event_id)
    values (v_user, v_code.event_id) returning danz_attendance.granted_at into v_granted;
  update public.danz_event_access_codes c set used_count = c.used_count + 1 where c.id = v_code.id;
  return query select 'granted'::text, v_code.event_id, v_granted;
end;
$$;

-- The permanent passport retains the owner's event name after archival.
-- Gallery RLS still requires a published event and published photos.
create function danz_private.my_passport()
returns table (event_id uuid, title text, starts_at timestamptz, event_status text, granted_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return query select e.id, e.title, e.starts_at, e.status, a.granted_at
    from public.danz_attendance a join public.danz_events e on e.id = a.event_id
    where a.user_id = (select auth.uid()) order by a.granted_at desc, e.id;
end;
$$;

-- Public API wrappers run as the caller; privileged implementations stay private.
create function public.danz_redeem_event_code(p_code text)
returns table (status text, event_id uuid, granted_at timestamptz)
language sql security invoker set search_path = ''
as $$ select * from danz_private.redeem_event_code(p_code); $$;

create function public.danz_my_passport()
returns table (event_id uuid, title text, starts_at timestamptz, event_status text, granted_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from danz_private.my_passport(); $$;

revoke all on function danz_private.redeem_event_code(text), danz_private.my_passport(),
  public.danz_redeem_event_code(text), public.danz_my_passport() from public, anon, authenticated;
grant execute on function danz_private.redeem_event_code(text), danz_private.my_passport(),
  public.danz_redeem_event_code(text), public.danz_my_passport() to authenticated;

commit;
