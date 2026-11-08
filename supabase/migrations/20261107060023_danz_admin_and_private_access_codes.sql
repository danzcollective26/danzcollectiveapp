create table if not exists public.danz_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.danz_admins enable row level security;
create policy "admins can see own membership" on public.danz_admins for select to authenticated using(user_id=(select auth.uid()));
create table if not exists public.danz_event_access_codes (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.danz_events(id) on delete cascade,
 code_hash text not null unique,
 expires_at timestamptz,
 max_uses integer check(max_uses is null or max_uses>0),
 used_count integer not null default 0 check(used_count>=0),
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.danz_event_access_codes enable row level security;
create index if not exists danz_event_codes_event_idx on public.danz_event_access_codes(event_id);

