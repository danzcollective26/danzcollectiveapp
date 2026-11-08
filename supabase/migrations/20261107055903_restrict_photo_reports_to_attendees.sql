drop policy if exists "report visible event photo" on public.danz_photo_reports;
create policy "report accessible published photo" on public.danz_photo_reports for insert to authenticated with check (
 reporter_id=(select auth.uid()) and exists (
 select 1 from public.danz_photos p join public.danz_events e on e.id=p.event_id
 join public.danz_attendance a on a.event_id=p.event_id
 where p.id=photo_id and p.status='published' and e.status='published' and a.user_id=(select auth.uid())
 )
);
