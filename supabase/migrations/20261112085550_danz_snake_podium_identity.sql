begin;
-- Preserve earlier first-place settlements while allowing one award per podium place.
alter table danz_private.snake_weeks add column place integer not null default 1 check(place between 1 and 3);
alter table danz_private.snake_weeks drop constraint snake_weeks_pkey;
alter table danz_private.snake_weeks add primary key(week_start,place);
alter table danz_private.snake_weeks add constraint snake_weeks_one_user_per_week unique(week_start,user_id);
alter table danz_private.snake_weeks drop constraint snake_weeks_points_check;
alter table danz_private.snake_weeks add constraint snake_weeks_points_check check(points in(0,10,25,50));
create or replace function danz_private.snake_settle() returns void language plpgsql security definer set search_path='' as $$
declare wk date;winner record;yr integer;amount integer;why text;
begin
 perform pg_advisory_xact_lock(191993,12);
 for wk in select distinct r.week_start from danz_private.snake_runs r where r.mode='classic' and r.score>0 and r.submitted_at is not null
 and r.week_start<date_trunc('week',clock_timestamp() at time zone 'Europe/Madrid')::date
 and not exists(select 1 from danz_private.snake_weeks w where w.week_start=r.week_start) order by r.week_start loop
  yr:=extract(year from wk+7);
  for winner in
   with best as(select distinct on(r.user_id) r.user_id,r.alias,r.score,r.submitted_at,r.id from danz_private.snake_runs r where r.week_start=wk and r.mode='classic' and r.score>0 and r.submitted_at is not null order by r.user_id,r.score desc,r.submitted_at,r.id)
   select *,row_number() over(order by score desc,submitted_at,id) as place from best order by score desc,submitted_at,id limit 3
  loop
   amount:=case winner.place when 1 then 50 when 2 then 25 else 10 end;why:='awarded';
   if(select count(*) from danz_private.snake_weeks w where w.user_id=winner.user_id and w.reward_year=yr and w.points>0)>=20 then amount:=0;why:='year-limit';
   elsif(select count(*) from danz_private.snake_weeks w where w.user_id=winner.user_id and w.week_start in(wk-7,wk-14,wk-21) and w.points>0)=3 then amount:=0;why:='streak-limit';end if;
   insert into danz_private.snake_weeks(week_start,place,user_id,alias,score,points,reason,reward_year) values(wk,winner.place,winner.user_id,winner.alias,winner.score,amount,why,yr) on conflict do nothing;
  end loop;
 end loop;
 delete from danz_private.snake_runs where submitted_at is null and started_at<clock_timestamp()-interval '2 days';
end;$$;
create or replace function danz_private.snake_board(p_mode text,p_period text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();wk date:=date_trunc('week',clock_timestamp() at time zone 'Europe/Madrid')::date;rows jsonb;mine jsonb;awards jsonb;
begin
 if p_mode is null or p_mode not in ('classic','maze') or p_period is null or p_period not in ('week','all') then raise exception 'Invalid board' using errcode='22023';end if;perform danz_private.snake_settle();
 with best as(select distinct on(user_id) user_id,alias,score,stage,submitted_at,id from danz_private.snake_runs where mode=p_mode and score>0 and submitted_at is not null and(p_period='all' or week_start=wk) order by user_id,score desc,submitted_at,id),ranked as(select *,row_number() over(order by score desc,submitted_at,id) as position from best)
 select coalesce(jsonb_agg(jsonb_build_object('rank',position,'alias',alias,'score',score,'stage',stage,'mine',user_id=u) order by position) filter(where position<=20),'[]'::jsonb),(jsonb_agg(jsonb_build_object('rank',position,'alias',alias,'score',score,'stage',stage,'mine',true)) filter(where user_id=u))->0 into rows,mine from ranked;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.week desc,t.place),'[]'::jsonb) into awards from(select week_start as week,place,alias,score,points,reason from danz_private.snake_weeks order by week_start desc,place limit 24)t;
 return jsonb_build_object('rows',rows,'mine',mine,'awards',awards,'weekStart',wk,'closesAt',(wk+7)::timestamp at time zone 'Europe/Madrid','rewards',jsonb_build_array(50,25,10),'yearLimit',20,'streakLimit',3);
end;$$;
notify pgrst,'reload schema';

-- Instagram identity required for competition and available DANZPOINTS.
create table danz_private.instagram_links(
 user_id uuid primary key references auth.users(id) on delete cascade,
 handle text not null check(handle~'^[a-z0-9_.]{1,30}$'),
 status text not null default 'pending' check(status in('pending','verified','rejected')),
 challenge text not null,requested_at timestamptz not null default clock_timestamp(),
 verified_at timestamptz,verified_by uuid references auth.users(id) on delete set null,
 window_started timestamptz not null default clock_timestamp(),changes integer not null default 1 check(changes between 1 and 5)
);
create unique index instagram_one_verified_account on danz_private.instagram_links(handle) where status='verified';
create index instagram_pending_requests on danz_private.instagram_links(requested_at) where status='pending';
create index instagram_reviewer on danz_private.instagram_links(verified_by);
alter table danz_private.instagram_links enable row level security;
revoke all on danz_private.instagram_links from public,anon,authenticated;

create function danz_private.identity_ready() returns boolean language plpgsql stable security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();begin
 return exists(select 1 from auth.users a join danz_private.instagram_links i on i.user_id=a.id join public.danz_profiles p on p.user_id=a.id
 where a.id=u and a.email is not null and a.email_confirmed_at is not null and i.status='verified' and lower(coalesce(p.instagram_handle,''))=i.handle);
end;$$;
create function danz_private.identity_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();i danz_private.instagram_links%rowtype;email_ok boolean;profile_handle text;
begin
 select a.email is not null and a.email_confirmed_at is not null into email_ok from auth.users a where a.id=u;
 select * into i from danz_private.instagram_links where user_id=u;
 select p.instagram_handle into profile_handle from public.danz_profiles p where p.user_id=u;
 return jsonb_build_object('verified',danz_private.identity_ready(),'emailVerified',coalesce(email_ok,false),'handle',i.handle,'profileHandle',profile_handle,
 'status',case when i.status='verified' and lower(coalesce(profile_handle,''))<>i.handle then 'changed' else coalesce(i.status,'none') end,
 'code',case when i.status='pending' then i.challenge else null end,'expiresAt',case when i.status='pending' then i.requested_at+interval '7 days' else null end);
end;$$;
create function danz_private.instagram_request(p_handle text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();h text:=lower(regexp_replace(btrim(p_handle),'^@',''));i danz_private.instagram_links%rowtype;window_at timestamptz;count_changes integer;
begin
 if h is null or h!~'^[a-z0-9_.]{1,30}$' then raise exception 'Invalid Instagram handle' using errcode='22023';end if;
 if not exists(select 1 from auth.users a where a.id=u and a.email is not null and a.email_confirmed_at is not null) then raise exception 'Confirmed email required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,124));select * into i from danz_private.instagram_links where user_id=u for update;
 if i.handle=h and ((i.status='pending' and i.requested_at>clock_timestamp()-interval '7 days') or (i.status='verified' and danz_private.identity_ready())) then return danz_private.identity_status();end if;
 if exists(select 1 from danz_private.instagram_links where handle=h and status='verified' and user_id<>u) then raise exception 'Instagram already linked' using errcode='22023';end if;
 window_at:=case when i.window_started>clock_timestamp()-interval '1 day' then i.window_started else clock_timestamp() end;
 count_changes:=case when i.window_started>clock_timestamp()-interval '1 day' then i.changes+1 else 1 end;
 if count_changes>5 then raise exception 'Daily change limit' using errcode='54000';end if;
 insert into danz_private.instagram_links(user_id,handle,challenge,window_started,changes) values(u,h,'DANZ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),window_at,count_changes)
 on conflict(user_id) do update set handle=excluded.handle,status='pending',challenge=excluded.challenge,requested_at=clock_timestamp(),verified_at=null,verified_by=null,window_started=excluded.window_started,changes=excluded.changes;
 return danz_private.identity_status();
end;$$;
create function danz_private.instagram_admin() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform danz_private.require_admin_scopes(array['events.manage']);
 return coalesce((select jsonb_agg(to_jsonb(t) order by t.requested_at) from(select user_id,handle,challenge,requested_at from danz_private.instagram_links where status='pending' and requested_at>clock_timestamp()-interval '7 days' order by requested_at limit 100)t),'[]'::jsonb);
end;$$;
create function danz_private.instagram_review(p_user uuid,p_code text,p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
declare admin_id uuid:=danz_private.require_admin_scopes(array['events.manage']);i danz_private.instagram_links%rowtype;
begin
 if p_user is null or p_code is null or p_approve is null then raise exception 'Invalid review' using errcode='22023';end if;
 select * into i from danz_private.instagram_links where user_id=p_user for update;
 if not found or i.challenge<>p_code or i.requested_at<=clock_timestamp()-interval '7 days' then raise exception 'Request changed or expired' using errcode='22023';end if;
 if i.status=(case when p_approve then 'verified' else 'rejected' end) then return;end if;
 if i.status<>'pending' then raise exception 'Request already reviewed' using errcode='22023';end if;
 if p_approve then
  if not exists(select 1 from auth.users a where a.id=p_user and a.email is not null and a.email_confirmed_at is not null) then raise exception 'Confirmed email required' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended(i.handle,125));
  if exists(select 1 from danz_private.instagram_links where handle=i.handle and status='verified' and user_id<>p_user) then raise exception 'Instagram already linked' using errcode='22023';end if;
  insert into public.danz_profiles(user_id,instagram_handle) values(p_user,i.handle) on conflict(user_id) do update set instagram_handle=excluded.instagram_handle;
 end if;
 update danz_private.instagram_links set status=case when p_approve then 'verified' else 'rejected' end,verified_at=case when p_approve then clock_timestamp() else null end,verified_by=admin_id where user_id=p_user;
end;$$;

-- Keep replay/ticket logic and its privileges private behind the verified identity gate.
alter function danz_private.snake_start(uuid,text,text) rename to snake_start_game;
alter function danz_private.snake_submit(uuid,text) rename to snake_submit_game;
create function danz_private.snake_start(p_id uuid,p_mode text,p_alias text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not danz_private.identity_ready() then raise exception 'Confirmed email and verified Instagram required' using errcode='42501';end if;
 return danz_private.snake_start_game(p_id,p_mode,p_alias);
end;$$;
create function danz_private.snake_submit(p_id uuid,p_moves text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not danz_private.identity_ready() then raise exception 'Confirmed email and verified Instagram required' using errcode='42501';end if;
 return danz_private.snake_submit_game(p_id,p_moves);
end;$$;
alter function danz_private.points_summary() rename to points_earned_summary;
create function danz_private.points_summary() returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb;ready boolean;info jsonb;
begin
 info:=danz_private.identity_status();ready:=(info->>'verified')::boolean;base:=danz_private.points_earned_summary();
 if not ready then base:=base||jsonb_build_object('available',0,'pending',(base->>'pending')::bigint+(base->>'available')::bigint);end if;
 return base||jsonb_build_object('identityVerified',ready,'emailVerified',(info->>'emailVerified')::boolean);
end;$$;
create or replace function public.danz_snake_start(p_id uuid,p_mode text,p_alias text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.snake_start(p_id,p_mode,p_alias)$$;
create or replace function public.danz_snake_submit(p_id uuid,p_moves text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.snake_submit(p_id,p_moves)$$;
create or replace function public.danz_points_summary() returns jsonb language sql security invoker set search_path='' as $$select danz_private.points_summary()$$;
create function public.danz_identity_status() returns jsonb language sql stable security invoker set search_path='' as $$select danz_private.identity_status()$$;
create function public.danz_instagram_request(p_handle text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.instagram_request(p_handle)$$;
create function public.danz_instagram_admin() returns jsonb language sql stable security invoker set search_path='' as $$select danz_private.instagram_admin()$$;
create function public.danz_instagram_review(p_user uuid,p_code text,p_approve boolean) returns void language sql security invoker set search_path='' as $$select danz_private.instagram_review(p_user,p_code,p_approve)$$;
revoke all on function danz_private.identity_ready(),danz_private.identity_status(),danz_private.instagram_request(text),danz_private.instagram_admin(),danz_private.instagram_review(uuid,text,boolean),danz_private.snake_start_game(uuid,text,text),danz_private.snake_submit_game(uuid,text),danz_private.snake_start(uuid,text,text),danz_private.snake_submit(uuid,text),danz_private.points_earned_summary(),danz_private.points_summary(),public.danz_identity_status(),public.danz_instagram_request(text),public.danz_instagram_admin(),public.danz_instagram_review(uuid,text,boolean) from public,anon,authenticated;
grant execute on function danz_private.identity_status(),danz_private.instagram_request(text),danz_private.instagram_admin(),danz_private.instagram_review(uuid,text,boolean),danz_private.snake_start(uuid,text,text),danz_private.snake_submit(uuid,text),danz_private.points_summary(),public.danz_identity_status(),public.danz_instagram_request(text),public.danz_instagram_admin(),public.danz_instagram_review(uuid,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
