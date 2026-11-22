-- Members opt in to displaying their verified Instagram identity to other members.
-- Existing profiles remain private. Verification itself is independent of this preference.
alter table public.danz_profiles
  add column if not exists instagram_public boolean not null default false;

grant select (instagram_public), update (instagram_public), insert (instagram_public)
  on table public.danz_profiles to authenticated;

comment on column public.danz_profiles.instagram_public is
  'Opt-in to display the verified Instagram link publicly; never expose unverified handles.';
