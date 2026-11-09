-- Gallery batches. The 900 MB application budget leaves headroom within 1 GB;
-- it is not a provider billing meter. Original download bytes are preserved.
begin;
alter table public.danz_photos
  add column preview_path text unique,
  add column original_name text,
  add column original_bytes bigint not null default 0 check(original_bytes>=0),
  add column preview_bytes bigint not null default 0 check(preview_bytes>=0),
  add column mime_type text,
  add column sha256 text check(sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  add column upload_ready boolean not null default true;
create unique index danz_photos_event_checksum_idx on public.danz_photos(event_id,sha256) where sha256 is not null;
create index danz_photos_event_page_idx on public.danz_photos(event_id,created_at,id);

create function danz_private.gallery_bytes() returns bigint
language sql stable security definer set search_path='' as $$
  select coalesce((select sum(coalesce((o.metadata->>'size')::bigint,0)) from storage.objects o),0)
    + coalesce((select sum(
      case when not exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=p.storage_path) then p.original_bytes else 0 end
      + case when not exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=p.preview_path) then p.preview_bytes else 0 end)
      from public.danz_photos p where not p.upload_ready),0);
$$;
revoke all on function danz_private.gallery_bytes() from public,anon,authenticated;

create function danz_private.gallery_usage()
returns table(used_bytes bigint,limit_bytes bigint,photo_count bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  return query select danz_private.gallery_bytes(),900000000::bigint,(select count(*) from public.danz_photos);
end; $$;

create function danz_private.prepare_photo(p_event_id uuid,p_id uuid,p_name text,p_size bigint,p_preview_size bigint,p_mime text,p_sha256 text)
returns table(id uuid,storage_path text,preview_path text,upload_ready boolean,original_exists boolean,preview_exists boolean)
language plpgsql security definer set search_path='' as $$
declare v public.danz_photos; v_extra bigint; v_original boolean; v_preview boolean;
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  if p_id is null or p_event_id is null or p_name is null or char_length(p_name) not between 1 and 180
    or p_size is null or p_size not between 1 and 26214400
    or p_preview_size is null or p_preview_size not between 1 and 1048576
    or p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp')
    or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid photo fields' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(70264491095::bigint);
  perform 1 from public.danz_events e where e.id=p_event_id for share;
  if not found then raise exception 'Event unavailable' using errcode='22023'; end if;
  select p.* into v from public.danz_photos p where p.id=p_id or (p.event_id=p_event_id and p.sha256=p_sha256) limit 1 for update;
  if found then
    if v.event_id<>p_event_id or v.sha256 is distinct from p_sha256 or v.original_bytes<>p_size or v.mime_type<>p_mime then
      raise exception 'Conflicting photo request' using errcode='22023';
    end if;
    v_original := exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=v.storage_path);
    v_preview := exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=v.preview_path);
    -- A different browser may encode a different preview. It can replace the
    -- reservation only while no preview has been stored; originals never change.
    if not v.upload_ready and not v_preview then
      v_extra := p_preview_size-v.preview_bytes;
      if danz_private.gallery_bytes()+v_extra>900000000 then raise exception 'Gallery storage budget exceeded' using errcode='54000'; end if;
      update public.danz_photos p set preview_bytes=p_preview_size where p.id=v.id;
    end if;
  else
    if danz_private.gallery_bytes()+p_size+p_preview_size>900000000 then
      raise exception 'Gallery storage budget exceeded' using errcode='54000';
    end if;
    insert into public.danz_photos(id,event_id,storage_path,preview_path,original_name,original_bytes,preview_bytes,mime_type,sha256,upload_ready,status)
      values(p_id,p_event_id,p_event_id::text||'/'||p_id::text||'/original.'||case p_mime when 'image/jpeg' then 'jpg' when 'image/png' then 'png' else 'webp' end,
        p_event_id::text||'/'||p_id::text||'/preview.jpg',p_name,p_size,p_preview_size,p_mime,p_sha256,false,'draft') returning * into v;
    v_original:=false; v_preview:=false;
  end if;
  return query select v.id,v.storage_path,v.preview_path,v.upload_ready,v_original,v_preview;
end; $$;

create function danz_private.finish_photo(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v public.danz_photos;
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  select * into v from public.danz_photos p where p.id=p_id for update;
  if not found then raise exception 'Photo unavailable' using errcode='22023'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=v.storage_path and (o.metadata->>'size')::bigint=v.original_bytes)
    or not exists(select 1 from storage.objects o where o.bucket_id='danz-event-photos' and o.name=v.preview_path and (o.metadata->>'size')::bigint=v.preview_bytes) then
    raise exception 'Photo upload incomplete' using errcode='22023';
  end if;
  update public.danz_photos p set upload_ready=true where p.id=p_id;
end; $$;

create function danz_private.admin_photos(p_event_id uuid,p_offset integer default 0)
returns setof public.danz_photos language plpgsql stable security definer set search_path='' as $$
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  if p_offset is null or p_offset<0 then raise exception 'Invalid page' using errcode='22023'; end if;
  return query select p.* from public.danz_photos p where p.event_id=p_event_id order by p.created_at,p.id offset p_offset limit 60;
end; $$;

create function danz_private.photo_state(p_event_id uuid,p_ids uuid[],p_status text) returns integer
language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
  perform danz_private.require_admin_scopes(array['events.manage']);
  if p_status is null or p_status not in ('draft','published','quarantined') or p_ids is null or cardinality(p_ids) not between 1 and 600 then
    raise exception 'Invalid batch' using errcode='22023';
  end if;
  perform 1 from public.danz_photos p where p.event_id=p_event_id and p.id=any(p_ids) for update;
  if (select count(*) from public.danz_photos p where p.event_id=p_event_id and p.id=any(p_ids) and p.upload_ready)
    <> (select count(distinct x) from unnest(p_ids) x) then
    raise exception 'Batch contains unavailable photos' using errcode='22023';
  end if;
  update public.danz_photos p set status=p_status where p.event_id=p_event_id and p.id=any(p_ids);
  get diagnostics v_count=row_count;
  return v_count;
end; $$;

-- Boolean helper never raises for attendees: it can safely share permissive RLS
-- with attendee reads. Membership/scopes are checked freshly, not user_metadata.
create function danz_private.manage_photo_object(p_path text,p_pending_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null
    and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
    and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
    and exists(select 1 from public.danz_admin_permissions a join public.danz_admins b on b.user_id=a.user_id
      where a.user_id=(select auth.uid()) and a.permission='events.manage')
    and exists(select 1 from public.danz_photos p where (p.storage_path=p_path or p.preview_path=p_path) and (not p_pending_only or not p.upload_ready));
$$;
revoke all on function danz_private.manage_photo_object(text,boolean) from public,anon,authenticated;
grant execute on function danz_private.manage_photo_object(text,boolean) to authenticated;
create policy "admin read reserved DANZ photo objects" on storage.objects for select to authenticated
  using(bucket_id='danz-event-photos' and danz_private.manage_photo_object(name,false));
create policy "admin upload reserved DANZ photo objects" on storage.objects for insert to authenticated
  with check(bucket_id='danz-event-photos' and danz_private.manage_photo_object(name,true));
-- Overwrite and deletion remain denied. Retries inspect which objects exist.

-- Archiving stops new passes but retains published memories for past attendees.
alter policy "read attended published events" on public.danz_events to authenticated
  using(status in ('published','archived') and exists(select 1 from public.danz_attendance a where a.event_id=id and a.user_id=(select auth.uid())));
alter policy "read attended published photos" on public.danz_photos to authenticated
  using(status='published' and upload_ready and exists(select 1 from public.danz_attendance a join public.danz_events e on e.id=a.event_id
    where a.event_id=danz_photos.event_id and a.user_id=(select auth.uid()) and e.status in ('published','archived')));
alter policy "read attended published DANZ photo objects" on storage.objects to authenticated
  using(bucket_id='danz-event-photos' and (select auth.uid()) is not null and exists(
    select 1 from public.danz_photos p join public.danz_events e on e.id=p.event_id join public.danz_attendance a on a.event_id=p.event_id
    where (p.storage_path=storage.objects.name or p.preview_path=storage.objects.name) and p.status='published' and p.upload_ready
      and e.status in ('published','archived') and a.user_id=(select auth.uid())));
alter policy "report accessible published photo" on public.danz_photo_reports to authenticated
  with check(reporter_id=(select auth.uid()) and exists(select 1 from public.danz_photos p join public.danz_events e on e.id=p.event_id join public.danz_attendance a on a.event_id=p.event_id
    where p.id=photo_id and p.status='published' and p.upload_ready and e.status in ('published','archived') and a.user_id=(select auth.uid())));

create function public.danz_gallery_usage() returns table(used_bytes bigint,limit_bytes bigint,photo_count bigint)
language sql stable security invoker set search_path='' as $$select * from danz_private.gallery_usage();$$;
create function public.danz_prepare_photo(p_event_id uuid,p_id uuid,p_name text,p_size bigint,p_preview_size bigint,p_mime text,p_sha256 text)
returns table(id uuid,storage_path text,preview_path text,upload_ready boolean,original_exists boolean,preview_exists boolean)
language sql security invoker set search_path='' as $$select * from danz_private.prepare_photo(p_event_id,p_id,p_name,p_size,p_preview_size,p_mime,p_sha256);$$;
create function public.danz_finish_photo(p_id uuid) returns void
language sql security invoker set search_path='' as $$select danz_private.finish_photo(p_id);$$;
create function public.danz_admin_photos(p_event_id uuid,p_offset integer default 0) returns setof public.danz_photos
language sql stable security invoker set search_path='' as $$select * from danz_private.admin_photos(p_event_id,p_offset);$$;
create function public.danz_photo_state(p_event_id uuid,p_ids uuid[],p_status text) returns integer
language sql security invoker set search_path='' as $$select danz_private.photo_state(p_event_id,p_ids,p_status);$$;

revoke all on function public.danz_gallery_usage(),public.danz_prepare_photo(uuid,uuid,text,bigint,bigint,text,text),public.danz_finish_photo(uuid),public.danz_admin_photos(uuid,integer),public.danz_photo_state(uuid,uuid[],text),
  danz_private.gallery_usage(),danz_private.prepare_photo(uuid,uuid,text,bigint,bigint,text,text),danz_private.finish_photo(uuid),danz_private.admin_photos(uuid,integer),danz_private.photo_state(uuid,uuid[],text) from public,anon,authenticated;
grant execute on function public.danz_gallery_usage(),public.danz_prepare_photo(uuid,uuid,text,bigint,bigint,text,text),public.danz_finish_photo(uuid),public.danz_admin_photos(uuid,integer),public.danz_photo_state(uuid,uuid[],text),
  danz_private.gallery_usage(),danz_private.prepare_photo(uuid,uuid,text,bigint,bigint,text,text),danz_private.finish_photo(uuid),danz_private.admin_photos(uuid,integer),danz_private.photo_state(uuid,uuid[],text) to authenticated;
commit;
