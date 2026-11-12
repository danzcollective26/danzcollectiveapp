-- Pilot rules for 13 November: attendance dominates ALL clothing purchases per event.
begin;
create table public.danz_points_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 created_at timestamptz not null default now(), check(code ~ '^[A-F0-9]{12}$')
);
create table public.danz_points_receipts (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.danz_events(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 reference text not null check(length(reference) between 1 and 80),
 amount_cents integer not null check(amount_cents between 1 and 10000000),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 voided_at timestamptz, unique(event_id,reference)
);
create table public.danz_points_suggestions (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('reward','product','activity','other')),
 body text not null check(length(btrim(body)) between 5 and 1000),
 status text not null default 'new' check(status in ('new','reviewed','planned')),
 created_at timestamptz not null default now()
);
create index danz_points_receipts_user_event on public.danz_points_receipts(user_id,event_id);
create index danz_points_receipts_event_created on public.danz_points_receipts(event_id,created_at desc);
create index danz_points_receipts_created_by on public.danz_points_receipts(created_by);
create index danz_points_suggestions_user_created on public.danz_points_suggestions(user_id,created_at);
create index danz_points_suggestions_created on public.danz_points_suggestions(created_at desc);
alter table public.danz_points_accounts enable row level security;
alter table public.danz_points_receipts enable row level security;
alter table public.danz_points_suggestions enable row level security;
revoke all on public.danz_points_accounts,public.danz_points_receipts,public.danz_points_suggestions from public,anon,authenticated;
grant select on public.danz_points_accounts,public.danz_points_receipts,public.danz_points_suggestions to authenticated;
create policy "own points account" on public.danz_points_accounts for select to authenticated using(user_id=(select auth.uid()));
create policy "own purchase evidence" on public.danz_points_receipts for select to authenticated using(user_id=(select auth.uid()));
create policy "own suggestions" on public.danz_points_suggestions for select to authenticated using(user_id=(select auth.uid()));

create function danz_private.points_user() returns uuid language plpgsql stable security invoker set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Verified account required' using errcode='42501'; end if;
 return u;
end; $$;

create function danz_private.points_summary() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user(); c text; rows jsonb; available bigint; pending bigint;
begin
 insert into public.danz_points_accounts(user_id) values(u) on conflict(user_id) do nothing;
 select a.code into c from public.danz_points_accounts a where a.user_id=u;
 with amounts as (
  select e.id,e.title,e.starts_at,
   case when exists(select 1 from public.danz_attendance a where a.user_id=u and a.event_id=e.id) then 1000 else 0 end as attendance,
   least(600,coalesce((select sum(r.amount_cents)/20 from public.danz_points_receipts r where r.user_id=u and r.event_id=e.id and r.voided_at is null),0))::bigint as clothing
  from public.danz_events e where (e.starts_at at time zone 'Europe/Madrid')::date=date '2026-11-13' and e.status in ('published','archived')
   and (exists(select 1 from public.danz_attendance a where a.user_id=u and a.event_id=e.id)
     or exists(select 1 from public.danz_points_receipts r where r.user_id=u and r.event_id=e.id))
 ) select coalesce(jsonb_agg(jsonb_build_object('eventId',id,'title',title,'startsAt',starts_at,'attendance',attendance,'clothing',clothing,'active',starts_at<=now()) order by starts_at), '[]'::jsonb),
 coalesce(sum(attendance+clothing) filter(where starts_at<=now()),0),coalesce(sum(attendance+clothing) filter(where starts_at>now()),0)
 into rows,available,pending from amounts;
 return jsonb_build_object('code','DNZ-'||c,'available',available,'pending',pending,'events',rows,'ruleVersion','pilot-2026-11-13-v1');
end; $$;

create function danz_private.points_suggest(p_id uuid,p_kind text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user(); old public.danz_points_suggestions%rowtype;
begin
 if p_id is null or p_kind is null or p_kind not in ('reward','product','activity','other') or p_body is null or length(btrim(p_body)) not between 5 and 1000 then raise exception 'Invalid suggestion' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select s.* into old from public.danz_points_suggestions s where s.id=p_id;
 if found then
  if old.user_id<>u or old.kind<>p_kind or old.body<>btrim(p_body) then raise exception 'Conflicting request' using errcode='22023'; end if;
  return p_id;
 end if;
 if (select count(*) from public.danz_points_suggestions s where s.user_id=u and s.created_at>now()-interval '1 day')>=5 then raise exception 'Daily suggestion limit reached' using errcode='54000'; end if;
 insert into public.danz_points_suggestions(id,user_id,kind,body) values(p_id,u,p_kind,btrim(p_body)); return p_id;
end; $$;

create function danz_private.points_purchase(p_event_id uuid,p_code text,p_reference text,p_amount_cents integer) returns uuid language plpgsql security definer set search_path='' as $$
declare admin_id uuid:=danz_private.require_admin_scopes(array['events.manage']); u uuid; old public.danz_points_receipts%rowtype; receipt_id uuid; v_code text:=replace(upper(btrim(p_code)),'DNZ-','');
begin
 if p_event_id is null or v_code is null or v_code !~ '^[A-F0-9]{12}$' or p_reference is null or length(btrim(p_reference)) not between 1 and 80 or p_amount_cents is null or p_amount_cents not between 1 and 10000000 then raise exception 'Invalid purchase' using errcode='22023'; end if;
 if not exists(select 1 from public.danz_events e where e.id=p_event_id and e.status='published' and (e.starts_at at time zone 'Europe/Madrid')::date=date '2026-11-13') then raise exception 'Pilot event unavailable' using errcode='22023'; end if;
 select a.user_id into u from public.danz_points_accounts a where a.code=v_code;
 if u is null then raise exception 'Unknown DANZ code' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_event_id::text||btrim(p_reference),0));
 select r.* into old from public.danz_points_receipts r where r.event_id=p_event_id and r.reference=btrim(p_reference);
 if found then
  if old.user_id<>u or old.amount_cents<>p_amount_cents then raise exception 'Conflicting purchase reference' using errcode='22023'; end if;
  return old.id;
 end if;
 insert into public.danz_points_receipts(event_id,user_id,reference,amount_cents,created_by) values(p_event_id,u,btrim(p_reference),p_amount_cents,admin_id) returning id into receipt_id;
 return receipt_id;
end; $$;

create function danz_private.points_admin(p_event_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform danz_private.require_admin_scopes(array['events.manage']);
 return jsonb_build_object(
 'receipts',coalesce((select jsonb_agg(to_jsonb(t)) from (select r.id,r.reference,r.amount_cents,r.voided_at,'DNZ-'||a.code as code from public.danz_points_receipts r join public.danz_points_accounts a using(user_id) where r.event_id=p_event_id order by r.created_at desc limit 100) t),'[]'::jsonb),
 'suggestions',coalesce((select jsonb_agg(to_jsonb(t)) from (select s.id,s.kind,s.body,s.status,s.created_at from public.danz_points_suggestions s order by s.created_at desc limit 100) t),'[]'::jsonb));
end; $$;

create function danz_private.points_void(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform danz_private.require_admin_scopes(array['events.manage']);
 update public.danz_points_receipts set voided_at=coalesce(voided_at,now()) where id=p_id;
 if not found then raise exception 'Purchase unavailable' using errcode='22023'; end if;
end; $$;

create function public.danz_points_summary() returns jsonb language sql security invoker set search_path='' as $$select danz_private.points_summary()$$;
create function public.danz_points_suggest(p_id uuid,p_kind text,p_body text) returns uuid language sql security invoker set search_path='' as $$select danz_private.points_suggest(p_id,p_kind,p_body)$$;
create function public.danz_points_purchase(p_event_id uuid,p_code text,p_reference text,p_amount_cents integer) returns uuid language sql security invoker set search_path='' as $$select danz_private.points_purchase(p_event_id,p_code,p_reference,p_amount_cents)$$;
create function public.danz_points_admin(p_event_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select danz_private.points_admin(p_event_id)$$;
create function public.danz_points_void(p_id uuid) returns void language sql security invoker set search_path='' as $$select danz_private.points_void(p_id)$$;
revoke all on function danz_private.points_user() from public,anon,authenticated;
revoke all on function danz_private.points_summary(),danz_private.points_suggest(uuid,text,text),danz_private.points_purchase(uuid,text,text,integer),danz_private.points_admin(uuid),danz_private.points_void(uuid),public.danz_points_summary(),public.danz_points_suggest(uuid,text,text),public.danz_points_purchase(uuid,text,text,integer),public.danz_points_admin(uuid),public.danz_points_void(uuid) from public,anon,authenticated;
grant execute on function danz_private.points_summary(),danz_private.points_suggest(uuid,text,text),danz_private.points_purchase(uuid,text,text,integer),danz_private.points_admin(uuid),danz_private.points_void(uuid),public.danz_points_summary(),public.danz_points_suggest(uuid,text,text),public.danz_points_purchase(uuid,text,text,integer),public.danz_points_admin(uuid),public.danz_points_void(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
