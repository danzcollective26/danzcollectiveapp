begin;
create table danz_private.snake_runs (
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 alias text not null check(length(alias) between 2 and 24 and alias !~ '[@<>[:cntrl:]]'),
 mode text not null check(mode in ('classic','maze')),seed integer not null check(seed between 1 and 2147483646),
 week_start date not null,started_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null,
 submitted_at timestamptz,abandoned boolean not null default false,score integer check(score>=0),stage integer,replay_digest text
);
create index snake_runs_user_started on danz_private.snake_runs(user_id,started_at desc);
create index snake_runs_week_score on danz_private.snake_runs(week_start,mode,score desc,submitted_at,id) where submitted_at is not null;
create table danz_private.snake_weeks (
 week_start date primary key,user_id uuid references auth.users(id) on delete set null,alias text not null,score integer not null,
 points integer not null check(points in (0,50)),reason text not null check(reason in ('awarded','streak-limit','year-limit')),
 reward_year integer not null,settled_at timestamptz not null default clock_timestamp()
);
create index snake_weeks_user_year on danz_private.snake_weeks(user_id,reward_year) where points>0;
alter table danz_private.snake_runs enable row level security;
alter table danz_private.snake_weeks enable row level security;
revoke all on danz_private.snake_runs,danz_private.snake_weeks from public,anon,authenticated;
create function danz_private.snake_walls(p_stage integer) returns integer[] language sql immutable set search_path='' as $$select case p_stage
when 1 then array[60,61,79,80,280,281,299,300]
when 2 then array[62,81,100,119,138,157,195,214,252,271,290,70,89,108,127,146,165,203,222,260,279,298]
when 3 then array[79,80,81,82,83,84,86,87,88,89,90,91,269,270,271,272,273,274,276,277,278,279,280,281,98,117,136,155,193,212,231,250,110,129,148,167,205,224,243,262]
when 4 then array[60,61,63,64,65,66,67,68,69,70,71,72,136,137,138,139,140,141,142,143,144,145,147,148,212,213,215,216,217,218,219,220,221,222,223,224,288,289,290,291,292,293,294,295,296,297,299,300]
when 5 then array[60,288,61,289,62,290,63,291,64,292,65,293,67,295,68,296,69,297,70,298,71,299,72,300,79,91,98,110,117,129,136,148,155,167,193,205,212,224,231,243,250,262,269,281,120,234,121,235,122,236,124,238,125,239,126,240,139,145,158,164,196,202,215,221]
when 6 then array[41,60,79,117,136,155,193,212,231,269,288,307,45,64,83,121,140,159,197,216,235,273,292,311,49,68,87,125,144,163,201,220,239,277,296,315,53,72,91,129,148,167,205,224,243,281,300,319,59,61,63,65,67,69,71,73,135,137,139,141,143,145,147,149,211,213,215,217,219,221,223,225,287,289,291,293,295,297,299,301]
when 7 then array[40,59,78,97,116,135,154,192,211,230,249,268,287,306,42,61,80,99,118,137,156,194,213,232,251,270,289,308,44,63,82,101,120,139,158,196,215,234,253,272,291,310,46,65,84,103,122,141,160,198,217,236,255,274,293,312,48,67,86,105,124,143,162,200,219,238,257,276,295,314,50,69,88,107,126,145,164,202,221,240,259,278,297,316,52,71,90,109,128,147,166,204,223,242,261,280,299,318,54,73,92,111,130,149,168,206,225,244,263,282,301,320]
when 8 then array[38,39,40,41,43,44,45,46,48,49,50,51,53,54,55,56,76,77,78,79,81,82,83,84,86,87,88,89,91,92,93,94,114,115,116,117,119,120,121,122,124,125,126,127,129,130,131,132,152,153,154,155,157,158,159,160,162,163,164,165,167,168,169,170,190,191,192,193,195,196,197,198,200,201,202,203,205,206,207,208,228,229,230,231,233,234,235,236,238,239,240,241,243,244,245,246,266,267,268,269,271,272,273,274,276,277,278,279,281,282,283,284,304,305,306,307,309,310,311,312,314,315,316,317,319,320,321,322]
when 9 then array[20,324,21,325,22,326,23,327,24,328,25,329,26,330,27,331,29,333,30,334,31,335,32,336,33,337,34,338,35,339,36,340,39,55,58,74,77,93,96,112,115,131,134,150,153,169,191,207,210,226,229,245,248,264,267,283,286,302,305,321,60,288,61,289,62,290,63,291,64,292,65,293,67,295,68,296,69,297,70,298,71,299,72,300,79,91,98,110,117,129,136,148,155,167,193,205,212,224,231,243,250,262,269,281,100,252,101,253,102,254,103,255,105,257,106,258,107,259,108,260,119,127,138,146,157,165,195,203,214,222,233,241,140,216,141,217,143,219,144,220,159,163,197,201]
when 10 then array[0,1,2,3,4,5,6,7,8,10,11,12,13,14,16,17,18,38,39,40,42,43,44,45,46,48,49,50,51,52,53,54,55,56,76,77,78,79,80,81,82,83,84,86,87,88,89,90,92,93,94,114,115,116,118,119,120,121,122,124,125,126,127,128,129,130,131,132,152,153,154,155,156,157,158,159,160,162,163,164,165,166,168,169,170,190,191,192,194,195,196,197,198,200,201,202,203,204,205,206,207,208,228,229,230,231,232,233,234,235,236,238,239,240,241,242,244,245,246,266,267,268,270,271,272,273,274,276,277,278,279,280,281,282,283,284,304,305,306,307,308,309,310,311,312,314,315,316,317,318,320,321,322,342,343,344,346,347,348,349,350,352,353,354,355,356,357,358,359,360]
when 11 then array[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,23,33,37,38,39,40,42,44,46,48,49,50,52,53,54,56,57,59,63,65,69,73,75,76,78,79,80,82,84,86,88,89,90,92,94,95,97,101,105,109,111,113,114,116,118,120,121,122,124,125,126,128,130,132,133,137,147,149,151,152,154,155,156,158,159,160,162,163,164,165,166,168,170,171,189,190,192,193,194,196,198,200,202,204,205,206,208,209,213,215,219,221,223,227,228,229,230,232,234,235,236,238,240,242,244,245,246,247,249,251,255,257,261,265,266,268,270,272,274,276,277,278,279,280,281,282,284,285,287,293,297,301,303,304,306,307,308,310,311,312,314,316,318,320,322,323,337,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360]
when 12 then array[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,25,33,37,38,39,40,41,42,44,46,47,48,49,50,52,54,56,57,61,63,65,71,73,75,76,78,80,82,84,86,87,88,89,90,92,94,95,97,99,101,103,107,111,113,114,116,118,120,122,123,124,126,128,129,130,132,133,135,139,141,145,147,151,152,154,155,156,157,158,160,162,163,164,165,166,168,170,171,189,190,191,192,194,196,197,198,200,202,203,204,205,206,207,208,209,213,215,219,221,227,228,230,231,232,234,236,237,238,240,242,243,244,246,247,253,255,263,265,266,267,268,269,270,271,272,274,275,276,277,278,279,280,282,284,285,291,299,301,303,304,306,307,308,309,310,311,312,313,314,315,316,318,319,320,322,323,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360]
else array[]::integer[] end $$;
-- Integer replay: client scores are never accepted as inputs.
create function danz_private.snake_replay(p_seed integer,p_mode text,p_moves text) returns jsonb language plpgsql immutable set search_path='' as $$
declare body integer[]:=array[179,178,177];foods integer[]:=array[183];walls integer[]:=array[]::integer[];
 seed bigint:=p_seed;stage integer:=1;goals integer:=0;score integer:=0;direction text:='R';d text;head integer;nx integer;ny integer;target integer;picked boolean;collision boolean;free integer[];i integer;cell integer;ix integer;needed integer;duration_ms bigint:=0;
begin
 if p_seed is null or p_seed not between 1 and 2147483646 or p_mode is null or p_mode not in ('classic','maze') or p_moves is null or length(p_moves) not between 1 and 20000 or p_moves!~'^[UDLR]+$' then raise exception 'Invalid replay' using errcode='22023';end if;
 if p_mode='maze' then walls:=danz_private.snake_walls(1);end if;
 for i in 1..length(p_moves) loop
  d:=substr(p_moves,i,1);
  if (direction='R' and d='L') or (direction='L' and d='R') or (direction='U' and d='D') or (direction='D' and d='U') then raise exception 'Reverse move' using errcode='22023';end if;
  direction:=d;head:=body[1];nx:=head%19;ny:=head/19;
  nx:=nx+case d when 'R' then 1 when 'L' then -1 else 0 end;ny:=ny+case d when 'D' then 1 when 'U' then -1 else 0 end;
  target:=ny*19+nx;picked:=target=any(foods);
  duration_ms:=duration_ms+(150-(least(10,1+score/50)-1)*8)/2;
  collision:=nx<0 or nx>=19 or ny<0 or ny>=19 or target=any(walls) or target=any(body[1:cardinality(body)-case when picked then 0 else 1 end]);
  if collision then if i<>length(p_moves) then raise exception 'Moves after collision' using errcode='22023';end if;exit;end if;
  if picked then body:=array_prepend(target,body);score:=score+10;goals:=goals+1;foods:=array_remove(foods,target);else body:=array_prepend(target,body[1:cardinality(body)-1]);end if;
  if p_mode='maze' and picked and goals>=5 and stage<12 then stage:=stage+1;goals:=0;direction:='R';walls:=danz_private.snake_walls(stage);body:=array[179,178,177];foods:=array[183];end if;
  if cardinality(body)=361-cardinality(walls) then if i<>length(p_moves) then raise exception 'Moves after completion' using errcode='22023';end if;exit;end if;
  needed:=least(5,1+score/50);
  while cardinality(foods)<needed loop
   free:=array[]::integer[];for cell in 0..360 loop if not(cell=any(body) or cell=any(walls) or cell=any(foods)) then free:=array_append(free,cell);end if;end loop;
   if cardinality(free)=0 then exit;end if;seed:=(seed*48271)%2147483647;ix:=floor((seed::double precision/2147483647)*cardinality(free))::integer+1;foods:=array_append(foods,free[ix]);
  end loop;
 end loop;
 return jsonb_build_object('score',score,'stage',stage,'minimumMs',greatest(0,duration_ms-150));
end;$$;
create function danz_private.snake_settle() returns void language plpgsql security definer set search_path='' as $$
declare wk date;winner danz_private.snake_runs%rowtype;yr integer;amount integer;why text;
begin
 perform pg_advisory_xact_lock(191993,12);
 for wk in select distinct r.week_start from danz_private.snake_runs r where r.mode='classic' and r.score>0 and r.submitted_at is not null and r.week_start<date_trunc('week',clock_timestamp() at time zone 'Europe/Madrid')::date and not exists(select 1 from danz_private.snake_weeks w where w.week_start=r.week_start) order by r.week_start loop
  select r.* into winner from danz_private.snake_runs r where r.week_start=wk and r.mode='classic' and r.score>0 and r.submitted_at is not null order by r.score desc,r.submitted_at,r.id limit 1;
  yr:=extract(year from wk+7);amount:=50;why:='awarded';
  if (select count(*) from danz_private.snake_weeks w where w.user_id=winner.user_id and w.reward_year=yr and w.points>0)>=20 then amount:=0;why:='year-limit';
  elsif (select count(*) from danz_private.snake_weeks w where w.user_id=winner.user_id and w.week_start in(wk-7,wk-14,wk-21) and w.points>0)=3 then amount:=0;why:='streak-limit';end if;
  insert into danz_private.snake_weeks(week_start,user_id,alias,score,points,reason,reward_year) values(wk,winner.user_id,winner.alias,winner.score,amount,why,yr) on conflict do nothing;
 end loop;
 delete from danz_private.snake_runs where submitted_at is null and started_at<clock_timestamp()-interval '2 days';
end;$$;
create function danz_private.snake_start(p_id uuid,p_mode text,p_alias text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();r danz_private.snake_runs%rowtype;wk date:=date_trunc('week',clock_timestamp() at time zone 'Europe/Madrid')::date;
begin
 if p_id is null or p_mode is null or p_mode not in ('classic','maze') or p_alias is null or length(btrim(p_alias)) not between 2 and 24 or p_alias~'[@<>[:cntrl:]]' then raise exception 'Invalid competition nickname or mode' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,123));select * into r from danz_private.snake_runs where id=p_id;
 if found then
  if r.user_id<>u or r.alias<>btrim(p_alias) or r.mode<>p_mode then raise exception 'Conflicting game' using errcode='22023';end if;
  if r.submitted_at is not null or r.abandoned or r.expires_at<=clock_timestamp() then raise exception 'Game already closed' using errcode='55000';end if;
 else
  if (select count(*) from danz_private.snake_runs where user_id=u and started_at>clock_timestamp()-interval '1 hour')>=60 then raise exception 'Hourly game limit' using errcode='54000';end if;
  update danz_private.snake_runs set abandoned=true where user_id=u and submitted_at is null and not abandoned;
  insert into danz_private.snake_runs(id,user_id,alias,mode,seed,week_start,expires_at) values(p_id,u,btrim(p_alias),p_mode,1+floor(random()*2147483646)::integer,wk,least(clock_timestamp()+interval '30 minutes',(wk+7)::timestamp at time zone 'Europe/Madrid')) returning * into r;
 end if;
 return jsonb_build_object('id',r.id,'seed',r.seed,'mode',r.mode,'expiresAt',r.expires_at);
end;$$;
create function danz_private.snake_submit(p_id uuid,p_moves text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();r danz_private.snake_runs%rowtype;result jsonb;t timestamptz:=clock_timestamp();
begin
 if p_id is null or p_moves is null or length(p_moves) not between 1 and 20000 or p_moves!~'^[UDLR]+$' then raise exception 'Invalid replay' using errcode='22023';end if;
 select * into r from danz_private.snake_runs where id=p_id and user_id=u for update;if not found then raise exception 'Game unavailable' using errcode='42501';end if;
 if r.submitted_at is not null then
  if r.replay_digest<>md5(p_moves) then raise exception 'Conflicting result' using errcode='22023';end if;
  return jsonb_build_object('score',r.score,'stage',r.stage,'saved',true);
 end if;
 if r.abandoned or t>=r.expires_at then raise exception 'Game expired' using errcode='55000';end if;
 result:=danz_private.snake_replay(r.seed,r.mode,p_moves);
 if extract(epoch from(t-r.started_at))*1000<(result->>'minimumMs')::bigint then raise exception 'Impossible duration' using errcode='22023';end if;
 update danz_private.snake_runs set submitted_at=t,score=(result->>'score')::integer,stage=(result->>'stage')::integer,replay_digest=md5(p_moves) where id=r.id;
 return result||jsonb_build_object('saved',true);
end;$$;
create function danz_private.snake_board(p_mode text,p_period text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();wk date:=date_trunc('week',clock_timestamp() at time zone 'Europe/Madrid')::date;rows jsonb;mine jsonb;awards jsonb;
begin
 if p_mode is null or p_mode not in ('classic','maze') or p_period is null or p_period not in ('week','all') then raise exception 'Invalid board' using errcode='22023';end if;perform danz_private.snake_settle();
 with best as(select distinct on(user_id) user_id,alias,score,stage,submitted_at,id from danz_private.snake_runs where mode=p_mode and score>0 and submitted_at is not null and(p_period='all' or week_start=wk) order by user_id,score desc,submitted_at,id),ranked as(select *,row_number() over(order by score desc,submitted_at,id) as position from best)
 select coalesce(jsonb_agg(jsonb_build_object('rank',position,'alias',alias,'score',score,'stage',stage,'mine',user_id=u) order by position) filter(where position<=20),'[]'::jsonb),(jsonb_agg(jsonb_build_object('rank',position,'alias',alias,'score',score,'stage',stage,'mine',true)) filter(where user_id=u))->0 into rows,mine from ranked;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.week desc),'[]'::jsonb) into awards from(select week_start as week,alias,score,points,reason from danz_private.snake_weeks order by week_start desc limit 8)t;
 return jsonb_build_object('rows',rows,'mine',mine,'awards',awards,'weekStart',wk,'closesAt',(wk+7)::timestamp at time zone 'Europe/Madrid','reward',50,'yearLimit',20,'streakLimit',3);
end;$$;
alter function danz_private.points_summary() rename to points_event_summary;
create function danz_private.points_summary() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=danz_private.points_user();base jsonb;total bigint;awards jsonb;
begin
 perform danz_private.snake_settle();base:=danz_private.points_event_summary();select coalesce(sum(points),0) into total from danz_private.snake_weeks where user_id=u;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.week desc),'[]'::jsonb) into awards from(select week_start as week,points,reason from danz_private.snake_weeks where user_id=u order by week_start desc limit 20)t;
 return base||jsonb_build_object('available',(base->>'available')::bigint+total,'arcade',total,'arcadeAwards',awards);
end;$$;
create function public.danz_snake_start(p_id uuid,p_mode text,p_alias text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.snake_start(p_id,p_mode,p_alias)$$;
create function public.danz_snake_submit(p_id uuid,p_moves text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.snake_submit(p_id,p_moves)$$;
create function public.danz_snake_board(p_mode text,p_period text) returns jsonb language sql security invoker set search_path='' as $$select danz_private.snake_board(p_mode,p_period)$$;
revoke all on function danz_private.snake_walls(integer),danz_private.snake_replay(integer,text,text),danz_private.snake_settle(),danz_private.snake_start(uuid,text,text),danz_private.snake_submit(uuid,text),danz_private.snake_board(text,text),danz_private.points_summary(),danz_private.points_event_summary(),public.danz_snake_start(uuid,text,text),public.danz_snake_submit(uuid,text),public.danz_snake_board(text,text) from public,anon,authenticated;
grant execute on function danz_private.snake_start(uuid,text,text),danz_private.snake_submit(uuid,text),danz_private.snake_board(text,text),danz_private.points_summary(),public.danz_snake_start(uuid,text,text),public.danz_snake_submit(uuid,text),public.danz_snake_board(text,text) to authenticated;
-- Catch-up also runs on authenticated ranking/balance reads.
create extension if not exists pg_cron;
select cron.schedule('danz-snake-weekly-close','0 * * * *','select danz_private.snake_settle()');
notify pgrst,'reload schema';
commit;
