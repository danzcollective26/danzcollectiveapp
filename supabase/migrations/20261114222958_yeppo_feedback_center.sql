-- Applied to production via Supabase migration 20261114222958.
-- Yeppo feedback is private to its author and designated DANZ administrators.
create table if not exists public.danz_yeppo_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check (category in ('error','sugerencia','ayuda','yeppo')),
 section text not null check (section in ('inicio','pasaporte','fotos','arcade','danzers','danzin','danzflor','danzpoints','cuenta','admin')),
 message text not null check (char_length(btrim(message)) between 10 and 1500),
 status text not null default 'new' check (status in ('new','reviewing','resolved')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists danz_yeppo_feedback_user_created_idx on public.danz_yeppo_feedback(user_id,created_at desc);
create index if not exists danz_yeppo_feedback_status_created_idx on public.danz_yeppo_feedback(status,created_at desc);
alter table public.danz_yeppo_feedback enable row level security;
revoke all on public.danz_yeppo_feedback from anon,authenticated;
grant select,insert on public.danz_yeppo_feedback to authenticated;
grant update(status,updated_at) on public.danz_yeppo_feedback to authenticated;
drop policy if exists danz_yeppo_feedback_member_insert on public.danz_yeppo_feedback;
create policy danz_yeppo_feedback_member_insert on public.danz_yeppo_feedback for insert to authenticated with check ((select auth.uid()) = user_id and status = 'new');
drop policy if exists danz_yeppo_feedback_member_or_admin_read on public.danz_yeppo_feedback;
create policy danz_yeppo_feedback_member_or_admin_read on public.danz_yeppo_feedback for select to authenticated using (
 (select auth.uid()) = user_id or exists (select 1 from public.danz_admins a where a.user_id = (select auth.uid()))
);
drop policy if exists danz_yeppo_feedback_admin_update on public.danz_yeppo_feedback;
create policy danz_yeppo_feedback_admin_update on public.danz_yeppo_feedback for update to authenticated using (
 exists (select 1 from public.danz_admins a where a.user_id = (select auth.uid()))
) with check (
 exists (select 1 from public.danz_admins a where a.user_id = (select auth.uid()))
);
