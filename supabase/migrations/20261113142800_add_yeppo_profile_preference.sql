-- Optional local-first mascot preference, owned by the authenticated profile.
alter table public.danz_profiles add column if not exists yeppo_enabled boolean not null default true;
grant select (yeppo_enabled), update (yeppo_enabled), insert (yeppo_enabled) on table public.danz_profiles to authenticated;
