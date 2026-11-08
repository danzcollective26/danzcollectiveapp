
create table if not exists public.danz_events (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(trim(title))>0),
 starts_at timestamptz,
 ends_at timestamptz,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(),
 constraint event_dates_valid check (ends_at is null or starts_at is null or ends_at>=starts_at)
);
create table if not exists public.danz_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 instagram_handle text,
 created_at timestamptz not null default now()
);
create table if not exists public.danz_attendance (
 user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid not null references public.danz_events(id) on delete cascade,
 granted_at timestamptz not null default now(),
 primary key(user_id,event_id)
);
create table if not exists public.danz_photos (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.danz_events(id) on delete cascade,
 storage_path text not null unique,
 status text not null default 'draft' check(status in ('draft','published','quarantined')),
 created_at timestamptz not null default now()
);
alter table public.danz_events enable row level security;
alter table public.danz_profiles enable row level security;
alter table public.danz_attendance enable row level security;
alter table public.danz_photos enable row level security;
create policy "read own profile" on public.danz_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "update own profile" on public.danz_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "insert own profile" on public.danz_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "read own attendance" on public.danz_attendance for select to authenticated using ((select auth.uid())=user_id);
create policy "read attended published events" on public.danz_events for select to authenticated using (status='published' and exists (select 1 from public.danz_attendance a where a.event_id=id and a.user_id=(select auth.uid())));
create policy "read attended published photos" on public.danz_photos for select to authenticated using (status='published' and exists (select 1 from public.danz_attendance a join public.danz_events e on e.id=a.event_id where a.event_id=danz_photos.event_id and a.user_id=(select auth.uid()) and e.status='published'));

