create table if not exists public.danz_photo_reports (
 id uuid primary key default gen_random_uuid(),
 photo_id uuid not null references public.danz_photos(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(length(trim(reason)) between 5 and 2000),
 status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now()
);
alter table public.danz_photo_reports enable row level security;
create policy "report visible event photo" on public.danz_photo_reports for insert to authenticated with check (
 reporter_id=(select auth.uid()) and exists (
 select 1 from public.danz_photos p where p.id=photo_id and p.status='published'
 )
);
create policy "read own reports" on public.danz_photo_reports for select to authenticated using (reporter_id=(select auth.uid()));
create index if not exists danz_photo_reports_photo_idx on public.danz_photo_reports(photo_id);
create index if not exists danz_photos_event_idx on public.danz_photos(event_id);
create index if not exists danz_attendance_event_idx on public.danz_attendance(event_id);
