-- Synthetic local data only. Never apply these records to the hosted project.
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002');
insert into public.danz_profiles (user_id,display_name) values
  ('10000000-0000-4000-8000-000000000001','Synthetic A'),
  ('10000000-0000-4000-8000-000000000002','Synthetic B');
insert into public.danz_events (id,title,status) values
  ('20000000-0000-4000-8000-000000000001','Synthetic event A','published'),
  ('20000000-0000-4000-8000-000000000002','Synthetic event B','published');
insert into public.danz_attendance (user_id,event_id) values
  ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002');
insert into public.danz_admins (user_id) values
  ('10000000-0000-4000-8000-000000000002');
insert into public.danz_photos (id,event_id,storage_path,status) values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','a/published.jpg','published'),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','a/draft.jpg','draft'),
  ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','a/quarantined.jpg','quarantined'),
  ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','b/published.jpg','published');
insert into public.danz_event_access_codes (event_id,code_hash) values
  ('20000000-0000-4000-8000-000000000001','synthetic-hash-not-a-real-code');
insert into storage.objects (bucket_id,name) values
  ('danz-event-photos','a/published.jpg'),
  ('danz-event-photos','a/draft.jpg'),
  ('danz-event-photos','a/quarantined.jpg'),
  ('danz-event-photos','b/published.jpg'),
  ('danz-event-photos','unlinked.jpg'),
  ('other-private-bucket','a/published.jpg');
