-- DANZ membership numbering. Review before applying to production.
-- The current sole entry in danz_admins is the founding administrator, assigned #1.
-- Existing authenticated users retain their chronological signup order.
-- This migration never renumbers existing rows; PostgreSQL sequence values are not reused.
begin;
create table if not exists public.danz_membership_numbers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_number bigint generated always as identity (start with 1 increment by 1),
  assigned_at timestamptz not null default now(),
  constraint danz_membership_number_positive check (member_number > 0),
  constraint danz_membership_number_unique unique(member_number)
);
alter table public.danz_membership_numbers enable row level security;
revoke all on public.danz_membership_numbers from public, anon, authenticated;
grant select on public.danz_membership_numbers to authenticated;
drop policy if exists "members read only their number" on public.danz_membership_numbers;
create policy "members read only their number"
  on public.danz_membership_numbers for select to authenticated
  using (user_id = (select auth.uid()));

-- Explicitly fail rather than guessing if founding-admin data is ambiguous.
do $$
declare
  founder uuid;
  existing_count integer;
begin
  select count(*) into existing_count from public.danz_admins;
  if existing_count <> 1 then raise exception 'Expected exactly one founding admin, found %', existing_count; end if;
  select a.user_id into founder from public.danz_admins a limit 1;
  if founder is null then raise exception 'No founder found'; end if;
  if not exists(select 1 from auth.users where id = founder) then raise exception 'Founder account absent'; end if;

  insert into public.danz_membership_numbers(user_id, member_number)
    overriding system value
    values (founder, 1)
    on conflict (user_id) do nothing;

  if not exists (select 1 from public.danz_membership_numbers where user_id=founder and member_number=1)
    then raise exception 'Founding admin membership number is not 1'; end if;

  -- Advance the sequence past the manually reserved #1 before importing other users.
  perform setval(pg_get_serial_sequence('public.danz_membership_numbers','member_number'),
      (select coalesce(max(member_number), 1) from public.danz_membership_numbers), true);

  insert into public.danz_membership_numbers(user_id)
  select id from auth.users where id <> founder
    and not exists(select 1 from public.danz_membership_numbers m where m.user_id=auth.users.id)
  order by created_at, id;

  -- Initialize next sequence value after existing membership numbers, including founder 1.
  perform setval(pg_get_serial_sequence('public.danz_membership_numbers','member_number'),
      (select coalesce(max(member_number), 0) from public.danz_membership_numbers), true);
end $$;

create or replace function public.danz_register_member_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.danz_membership_numbers (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.danz_register_member_number() from public, anon, authenticated;
drop trigger if exists danz_assign_member_number on auth.users;
create trigger danz_assign_member_number
  after insert on auth.users for each row
  execute function public.danz_register_member_number();
commit;

-- Verification (read-only):
-- select count(*), min(member_number), max(member_number) from public.danz_membership_numbers;
-- select member_number from public.danz_membership_numbers where user_id=auth.uid();
