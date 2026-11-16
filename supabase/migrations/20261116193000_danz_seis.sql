begin;
-- SEIS: el servidor reparte con la semilla y rejuega las decisiones humanas.
-- El cliente no envía puntos. Una victoria real suma 10, con tope semanal y anual.

create type danz_private.seis_seat as (
  hand int[], ai boolean, shield boolean, skip boolean, pending_draw int,
  resaca boolean, blind boolean, said boolean, missed int
);
create type danz_private.seis_cover as (a int, b int, until_step int);
create type danz_private.seis_show as (player int, card int);
create type danz_private.seis_state as (
  level text, rng int, deck int[], discard int[], seats danz_private.seis_seat[],
  current int, direction int, color int, lock text, covers danz_private.seis_cover[],
  wish int[], strobe danz_private.seis_show[], give int, phase text, step int,
  winner int, perfect boolean, capped boolean
);

create table danz_private.seis_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (length(alias) between 2 and 24 and alias !~ '[@<>[:cntrl:]]'),
  opponents int not null check (opponents between 1 and 3),
  level text not null check (level in ('facil','normal','dificil')),
  seed int not null check (seed between 1 and 2147483646),
  week_start date not null,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  abandoned boolean not null default false,
  won boolean,
  turns int,
  points int,
  reason text,
  replay_digest text
);
create index seis_runs_user_started on danz_private.seis_runs(user_id, started_at desc);
create table danz_private.seis_awards (
  run_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  points int not null check (points in (0,10)),
  reason text not null check (reason in ('awarded','week-limit','year-limit')),
  reward_year int not null
);
create index seis_awards_user_year on danz_private.seis_awards(user_id, reward_year) where points > 0;
alter table danz_private.seis_runs enable row level security;
alter table danz_private.seis_awards enable row level security;
revoke all on danz_private.seis_runs, danz_private.seis_awards from public, anon, authenticated;

create function danz_private.seis_rng(rng int) returns int language sql immutable set search_path='' as $$
  select ((rng::bigint * 48271) % 2147483647)::int
$$;
create function danz_private.seis_special(id int) returns text language sql immutable set search_path='' as $$
  select case when id between 70 and 89 then (array['yeppo','yeppo','panas','panas','panas-fuerte','jack-cruzado','jack-cruzado','drop','drop','resaca','wishlist','cambio','cambio','flor-negra','flor-blanca','vinilo-rallado','luz-estrobo','doble-jack','doble-jack','jack-gordo'])[id-69] else null end
$$;
create function danz_private.seis_color(id int) returns int language sql immutable set search_path='' as $$
  select case when id < 50 then id / 10 when id < 70 then (id - 50) / 4 else null end
$$;
create function danz_private.seis_symbol(id int) returns text language sql immutable set search_path='' as $$
  select case
    when id < 50 then (id % 10)::text
    when id < 70 then (array['flor','vinilo','jack','luz'])[1 + (id - 50) % 4]
    else case danz_private.seis_special(id)
      when 'doble-jack' then 'jack' when 'jack-cruzado' then 'jack' when 'jack-gordo' then 'jack'
      when 'vinilo-rallado' then 'vinilo' when 'luz-estrobo' then 'luz'
      when 'yeppo' then 'flor' when 'flor-negra' then 'flor' when 'flor-blanca' then 'flor'
      else null end
  end
$$;
create function danz_private.seis_base(id int) returns int language sql immutable set search_path='' as $$
  select case danz_private.seis_special(id)
    when 'yeppo' then 14 when 'panas' then 13 when 'panas-fuerte' then 16 when 'jack-cruzado' then 18
    when 'drop' then 20 when 'resaca' then 17 when 'wishlist' then 15 when 'cambio' then 16
    when 'flor-negra' then 22 when 'flor-blanca' then 12 when 'vinilo-rallado' then 17
    when 'luz-estrobo' then 16 when 'doble-jack' then 19 when 'jack-gordo' then 24
    else case when danz_private.seis_symbol(id) ~ '^[0-9]$' then danz_private.seis_symbol(id)::int else 8 end
  end
$$;

create function danz_private.seis_put(s danz_private.seis_state, player int, seat danz_private.seis_seat) returns danz_private.seis_state
language plpgsql immutable set search_path='' as $$
declare seats danz_private.seis_seat[];
begin
  seats := s.seats; seats[player + 1] := seat; s.seats := seats; return s;
end $$;
create function danz_private.seis_next(s danz_private.seis_state, origin int default null) returns int
language sql immutable set search_path='' as $$
  select ((coalesce(origin, s.current) + s.direction + cardinality(s.seats) * 2) % cardinality(s.seats))
$$;
create function danz_private.seis_drop(hand int[], id int) returns int[] language plpgsql immutable set search_path='' as $$
declare i int;
begin
  if hand is null then return '{}'; end if;
  for i in 1..coalesce(cardinality(hand),0) loop
    if hand[i] = id then return coalesce(hand[1:i-1], '{}') || coalesce(hand[i+1:cardinality(hand)], '{}'); end if;
  end loop;
  return hand;
end $$;
create function danz_private.seis_has(hand int[], id int) returns boolean language sql immutable set search_path='' as $$
  select id = any(coalesce(hand, '{}'))
$$;

create function danz_private.seis_plain(s danz_private.seis_state, id int) returns boolean language plpgsql immutable set search_path='' as $$
declare symbol text := danz_private.seis_symbol(id); special text := danz_private.seis_special(id); top text := danz_private.seis_symbol(s.discard[1]);
begin
  if special = 'flor-negra' then return true; end if;
  if s.lock is not null then return symbol = s.lock; end if;
  if special is not null and special <> 'jack-gordo' then return true; end if;
  return danz_private.seis_color(id) = s.color or (symbol is not null and symbol = top);
end $$;
create function danz_private.seis_can(s danz_private.seis_state, id int) returns boolean language plpgsql immutable set search_path='' as $$
declare hand int[] := (s.seats[s.current + 1]).hand; other int; emergency boolean := true;
begin
  if danz_private.seis_special(id) is distinct from 'jack-gordo' then return danz_private.seis_plain(s, id); end if;
  if hand is not null then
    foreach other in array hand loop
      if other <> id and danz_private.seis_plain(s, other) then emergency := false; end if;
    end loop;
  end if;
  return danz_private.seis_symbol(s.discard[1]) = 'jack' or s.lock = 'jack' or emergency;
end $$;
create function danz_private.seis_legal(s danz_private.seis_state) returns int[] language plpgsql immutable set search_path='' as $$
declare hand int[] := coalesce((s.seats[s.current + 1]).hand, '{}'); legal int[] := '{}'; id int; i int; j int; tmp int;
begin
  if s.phase <> 'play' then return legal; end if;
  foreach id in array hand loop if danz_private.seis_can(s, id) then legal := legal || id; end if; end loop;
  for i in 2..coalesce(cardinality(legal),0) loop
    j := i;
    while j > 1 and legal[j] < legal[j-1] loop tmp := legal[j]; legal[j] := legal[j-1]; legal[j-1] := tmp; j := j - 1; end loop;
  end loop;
  return legal;
end $$;
create function danz_private.seis_pressure(s danz_private.seis_state) returns int language plpgsql immutable set search_path='' as $$
declare i int; lowest int := 99; hand int;
begin
  for i in 0..cardinality(s.seats)-1 loop
    if i <> s.current then hand := coalesce(cardinality((s.seats[i+1]).hand),0); if hand < lowest then lowest := hand; end if; end if;
  end loop;
  return lowest;
end $$;
create function danz_private.seis_score(s danz_private.seis_state, id int, lvl text) returns int language plpgsql immutable set search_path='' as $$
declare special text := danz_private.seis_special(id); mine int := coalesce(cardinality((s.seats[s.current+1]).hand),0); pressure int := danz_private.seis_pressure(s); value int := danz_private.seis_base(id);
begin
  if mine = 1 then value := value + 100; end if;
  if lvl = 'normal' and special is not null then value := value + 12; end if;
  if lvl = 'dificil' and special in ('drop','doble-jack','jack-gordo','resaca','jack-cruzado','vinilo-rallado','luz-estrobo') and pressure <= 2 then value := value + 50; end if;
  if lvl = 'dificil' and special in ('jack-gordo','flor-negra','drop','doble-jack') and mine > 3 and pressure > 2 then value := value - 40; end if;
  return value;
end $$;

create function danz_private.seis_recycle(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare top int; rest int[]; i0 int; i1 int; j1 int; tmp int;
begin
  if coalesce(cardinality(s.discard),0) <= 1 then return s; end if;
  top := s.discard[1]; rest := coalesce(s.discard[2:cardinality(s.discard)], '{}');
  for i0 in reverse coalesce(cardinality(rest),0)-1..1 loop
    s.rng := danz_private.seis_rng(s.rng); i1 := i0 + 1; j1 := (s.rng % (i0 + 1)) + 1; tmp := rest[i1]; rest[i1] := rest[j1]; rest[j1] := tmp;
  end loop;
  s.deck := coalesce(rest, '{}'); s.discard := array[top]; return s;
end $$;
create function danz_private.seis_draw(s danz_private.seis_state, player int, n int) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare i int; id int; seat danz_private.seis_seat;
begin
  for i in 1..n loop
    if coalesce(cardinality(s.deck),0) = 0 then s := danz_private.seis_recycle(s); end if;
    exit when coalesce(cardinality(s.deck),0) = 0;
    id := s.deck[cardinality(s.deck)]; s.deck := coalesce(s.deck[1:cardinality(s.deck)-1], '{}');
    seat := s.seats[player+1]; seat.hand := coalesce(seat.hand, '{}') || id; s := danz_private.seis_put(s, player, seat);
  end loop;
  return s;
end $$;
create function danz_private.seis_covered(s danz_private.seis_state, player int) returns boolean language plpgsql immutable set search_path='' as $$
declare i int; cover danz_private.seis_cover;
begin
  for i in 1..coalesce(cardinality(s.covers),0) loop
    cover := s.covers[i];
    if (cover.a = player or cover.b = player) and cover.until_step > s.step then return true; end if;
  end loop;
  return false;
end $$;
create function danz_private.seis_harm(s danz_private.seis_state, player int, effect text) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare seat danz_private.seis_seat;
begin
  if danz_private.seis_covered(s, player) then return s; end if;
  seat := s.seats[player+1];
  if seat.shield then seat.shield := false; return danz_private.seis_put(s, player, seat); end if;
  if effect = 'lock' then s.lock := 'jack'; return s; end if;
  if effect = 'draw1' then return danz_private.seis_draw(s, player, 1); end if;
  if effect = 'skip' then seat.skip := true; return danz_private.seis_put(s, player, seat); end if;
  if effect = 'resaca' then seat.resaca := true; return danz_private.seis_put(s, player, seat); end if;
  if effect = 'blind' then seat.blind := true; return danz_private.seis_put(s, player, seat); end if;
  if effect = 'plus2' then seat.pending_draw := seat.pending_draw + 2; return danz_private.seis_put(s, player, seat); end if;
  seat.pending_draw := seat.pending_draw + 4; seat.skip := true; return danz_private.seis_put(s, player, seat);
end $$;

create function danz_private.seis_claim(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare i int;
begin
  for i in 0..cardinality(s.seats)-1 loop
    if coalesce(cardinality((s.seats[i+1]).hand),0) = 0 then
      s.winner := i; s.perfect := i = 0 and (s.seats[1]).said; s.phase := 'over'; return s;
    end if;
  end loop;
  return s;
end $$;
create function danz_private.seis_cap(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare i int; best int := 0; size int;
begin
  for i in 1..cardinality(s.seats)-1 loop
    size := coalesce(cardinality((s.seats[i+1]).hand),0);
    if size < coalesce(cardinality((s.seats[best+1]).hand),0) then best := i; end if;
  end loop;
  s.winner := best; s.capped := true; s.perfect := false; s.phase := 'over'; return s;
end $$;

create function danz_private.seis_advance(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare guard int; seat danz_private.seis_seat; kept danz_private.seis_cover[] := '{}'; i int; count int;
begin
  if s.step >= 500 then return danz_private.seis_cap(s); end if;
  seat := s.seats[s.current+1]; seat.blind := false; s := danz_private.seis_put(s, s.current, seat);
  for guard in 1..8 loop
    s.current := danz_private.seis_next(s); s.step := s.step + 1;
    if s.step >= 500 then return danz_private.seis_cap(s); end if;
    kept := '{}';
    for i in 1..coalesce(cardinality(s.covers),0) loop if (s.covers[i]).until_step > s.step then kept := kept || s.covers[i]; end if; end loop;
    s.covers := kept; seat := s.seats[s.current+1];
    if seat.pending_draw > 0 then count := seat.pending_draw; seat.pending_draw := 0; s := danz_private.seis_put(s, s.current, seat); s := danz_private.seis_draw(s, s.current, count); seat := s.seats[s.current+1]; end if;
    if seat.skip then seat.skip := false; seat.blind := false; s := danz_private.seis_put(s, s.current, seat); continue; end if;
    if seat.resaca then
      seat.resaca := false; s := danz_private.seis_put(s, s.current, seat);
      if coalesce(cardinality(seat.hand),0) = 0 then return danz_private.seis_claim(s); end if;
      s.phase := 'resaca'; return s;
    end if;
    s.phase := 'play'; return s;
  end loop;
  if s.step >= 500 then return danz_private.seis_cap(s); end if;
  return s;
end $$;
create function danz_private.seis_finish(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare i int; seat danz_private.seis_seat; say boolean;
begin
  if exists (select 1 from generate_series(0, cardinality(s.seats)-1) g where coalesce(cardinality((s.seats[g+1]).hand),0) = 0) then return danz_private.seis_claim(s); end if;
  for i in 0..cardinality(s.seats)-1 loop
    seat := s.seats[i+1];
    if coalesce(cardinality(seat.hand),0) <> 1 then seat.said := false; s := danz_private.seis_put(s, i, seat); end if;
  end loop;
  for i in 0..cardinality(s.seats)-1 loop
    seat := s.seats[i+1];
    if seat.ai and coalesce(cardinality(seat.hand),0) = 1 and not seat.said then
      say := true;
      if s.level = 'facil' then s.rng := danz_private.seis_rng(s.rng); say := s.rng % 3 <> 0; end if;
      if say then seat.said := true; s := danz_private.seis_put(s, i, seat);
      else s := danz_private.seis_draw(s, i, 2); end if;
    end if;
  end loop;
  if coalesce(cardinality((s.seats[1]).hand),0) = 1 and not (s.seats[1]).said then s.phase := 'seis'; return s; end if;
  return danz_private.seis_advance(s);
end $$;

create function danz_private.seis_play(s danz_private.seis_state, id int) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare seat danz_private.seis_seat; tone int;
begin
  seat := s.seats[s.current+1];
  if not danz_private.seis_has(seat.hand, id) or not danz_private.seis_can(s, id) then raise exception 'card' using errcode='22023'; end if;
  seat.hand := danz_private.seis_drop(seat.hand, id); seat.missed := 0; s := danz_private.seis_put(s, s.current, seat);
  s.discard := array_prepend(id, coalesce(s.discard, '{}')); s.lock := null;
  tone := danz_private.seis_color(id); if tone is not null then s.color := tone; end if;
  return danz_private.seis_resolve(s, danz_private.seis_special(id));
end $$;

create function danz_private.seis_resolve(s danz_private.seis_state, special text) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare i int; target int; id int; seat danz_private.seis_seat; shown danz_private.seis_show;
begin
  if special is null then return danz_private.seis_finish(s); end if;
  if special = 'yeppo' then s.phase := 'yeppo'; return s; end if;
  if special in ('panas','panas-fuerte') then s.phase := 'panas-who'; return s; end if;
  if special = 'jack-cruzado' then s.direction := -s.direction; return danz_private.seis_finish(danz_private.seis_harm(s, danz_private.seis_next(s), 'lock')); end if;
  if special = 'drop' then
    for i in 0..cardinality(s.seats)-1 loop if i <> s.current then s := danz_private.seis_harm(s, i, 'draw1'); end if; end loop;
    return danz_private.seis_finish(danz_private.seis_harm(s, danz_private.seis_next(s), 'skip'));
  end if;
  if special = 'resaca' then return danz_private.seis_finish(danz_private.seis_harm(s, danz_private.seis_next(s), 'resaca')); end if;
  if special = 'wishlist' then
    s.wish := '{}';
    for i in 1..3 loop
      if coalesce(cardinality(s.deck),0) = 0 then s := danz_private.seis_recycle(s); end if;
      exit when coalesce(cardinality(s.deck),0) = 0;
      id := s.deck[cardinality(s.deck)]; s.deck := coalesce(s.deck[1:cardinality(s.deck)-1], '{}'); s.wish := s.wish || id;
    end loop;
    if coalesce(cardinality(s.wish),0) = 0 then return danz_private.seis_finish(s); end if;
    s.phase := 'wishlist'; return s;
  end if;
  if special in ('cambio','flor-negra','flor-blanca') then s.phase := 'color'; return s; end if;
  if special = 'vinilo-rallado' then return danz_private.seis_finish(danz_private.seis_harm(s, danz_private.seis_next(s), 'blind')); end if;
  if special = 'luz-estrobo' then
    s.strobe := '{}';
    for i in 0..cardinality(s.seats)-1 loop
      seat := s.seats[i+1];
      if coalesce(cardinality(seat.hand),0) > 0 then
        s.rng := danz_private.seis_rng(s.rng);
        shown.player := i; shown.card := seat.hand[(s.rng % cardinality(seat.hand)) + 1]; s.strobe := s.strobe || shown;
      end if;
    end loop;
    if coalesce(cardinality(s.strobe),0) = 0 then return danz_private.seis_finish(s); end if;
    s.phase := 'strobe'; return s;
  end if;
  if special = 'doble-jack' then return danz_private.seis_finish(danz_private.seis_harm(s, danz_private.seis_next(s), 'plus2')); end if;
  target := danz_private.seis_next(s);
  return danz_private.seis_finish(danz_private.seis_harm(s, target, 'gordo'));
end $$;

create function danz_private.seis_symbol_code(code text) returns text language sql immutable set search_path='' as $$
  select case code when 'f' then 'flor' when 'v' then 'vinilo' when 'j' then 'jack' when 'l' then 'luz' when '-' then null else case when code ~ '^[0-9]$' then code else null end end
$$;
create function danz_private.seis_best_color(s danz_private.seis_state) returns int language plpgsql immutable set search_path='' as $$
declare counts int[] := array[0,0,0,0,0]; id int; tone int; best int := 0; i int;
begin
  foreach id in array coalesce((s.seats[s.current+1]).hand, '{}') loop
    tone := danz_private.seis_color(id); if tone is not null then counts[tone+1] := counts[tone+1] + 1; end if;
  end loop;
  for i in 1..4 loop if counts[i+1] > counts[best+1] then best := i; end if; end loop;
  return best;
end $$;
create function danz_private.seis_demand(s danz_private.seis_state) returns text language plpgsql immutable set search_path='' as $$
declare counts jsonb := '{}'::jsonb; id int; symbol text; best text := ''; tally int := 1; value int; token text;
begin
  foreach id in array coalesce((s.seats[s.current+1]).hand, '{}') loop
    symbol := danz_private.seis_symbol(id);
    if symbol is not null then counts := jsonb_set(counts, array[symbol], to_jsonb(coalesce((counts->>symbol)::int,0) + 1)); end if;
  end loop;
  foreach token in array array['0','1','2','3','4','5','6','7','8','9','flor','vinilo','jack','luz'] loop
    value := coalesce((counts->>token)::int,0);
    if value > tally then best := token; tally := value; end if;
  end loop;
  if best = '' then return '-'; end if;
  return case best when 'flor' then 'f' when 'vinilo' then 'v' when 'jack' then 'j' when 'luz' then 'l' else best end;
end $$;
create function danz_private.seis_target(s danz_private.seis_state) returns int language plpgsql immutable set search_path='' as $$
declare i int; best int := null; size int;
begin
  for i in 0..cardinality(s.seats)-1 loop
    if i <> s.current and (best is null or coalesce(cardinality((s.seats[i+1]).hand),0) < coalesce(cardinality((s.seats[best+1]).hand),0)) then best := i; end if;
  end loop;
  return best;
end $$;
create function danz_private.seis_best_index(ids int[]) returns int language plpgsql immutable set search_path='' as $$
declare i int; best int := 1;
begin
  for i in 2..coalesce(cardinality(ids),0) loop
    if danz_private.seis_base(ids[i]) > danz_private.seis_base(ids[best]) or (danz_private.seis_base(ids[i]) = danz_private.seis_base(ids[best]) and ids[i] < ids[best]) then best := i; end if;
  end loop;
  return best - 1;
end $$;
create function danz_private.seis_worst(ids int[]) returns int language plpgsql immutable set search_path='' as $$
declare id int; worst int := ids[1];
begin
  foreach id in array ids loop
    if danz_private.seis_base(id) < danz_private.seis_base(worst) or (danz_private.seis_base(id) = danz_private.seis_base(worst) and id > worst) then worst := id; end if;
  end loop;
  return worst;
end $$;

create function danz_private.seis_show_ids(shown danz_private.seis_show[]) returns int[] language plpgsql immutable set search_path='' as $$
declare ids int[] := '{}'; j int;
begin
  for j in 1..coalesce(cardinality(shown),0) loop ids := ids || (shown[j]).card; end loop;
  return ids;
end $$;
create function danz_private.seis_choose(s danz_private.seis_state, out state danz_private.seis_state, out action text) language plpgsql immutable set search_path='' as $$
declare easy boolean; legal int[]; lvl text; seat danz_private.seis_seat; options int[] := '{}'; i int;
begin
  state := s; seat := state.seats[state.current+1]; easy := seat.blind or state.level = 'facil'; lvl := case when seat.blind then 'facil' else state.level end;
  if state.phase = 'play' then
    legal := danz_private.seis_legal(state);
    if coalesce(cardinality(legal),0) = 0 then action := 'd'; return; end if;
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'p' || legal[(state.rng % cardinality(legal)) + 1]; return; end if;
    action := 'p' || legal[1];
    for i in 2..cardinality(legal) loop
      if danz_private.seis_score(state, legal[i], lvl) > danz_private.seis_score(state, substring(action from 2)::int, lvl) or (danz_private.seis_score(state, legal[i], lvl) = danz_private.seis_score(state, substring(action from 2)::int, lvl) and legal[i] < substring(action from 2)::int) then action := 'p' || legal[i]; end if;
    end loop;
    return;
  elsif state.phase = 'color' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'c' || (state.rng % 5); else action := 'c' || danz_private.seis_best_color(state); end if;
  elsif state.phase = 'demand' then action := 'y' || case when easy then '-' else danz_private.seis_demand(state) end;
  elsif state.phase = 'panas-who' then
    for i in 0..cardinality(state.seats)-1 loop if i <> state.current then options := options || i; end if; end loop;
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'a' || options[(state.rng % cardinality(options)) + 1]; else action := 'a' || danz_private.seis_target(state); end if;
  elsif state.phase = 'panas-how' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'm' || (state.rng % 2);
    else action := 'm' || case when coalesce(cardinality(seat.hand),0) <= coalesce(cardinality((state.seats[danz_private.seis_target(state)+1]).hand),0) then 0 else 1 end; end if;
  elsif state.phase = 'wishlist' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'w' || (state.rng % cardinality(state.wish)); else action := 'w' || danz_private.seis_best_index(state.wish); end if;
  elsif state.phase = 'order' then
    if easy or state.level <> 'dificil' then action := 'o0';
    else action := 'o' || case when danz_private.seis_base(state.wish[1]) <= danz_private.seis_base(state.wish[2]) then 0 else 1 end; end if;
  elsif state.phase = 'resaca' then action := case when not easy and coalesce(cardinality(seat.hand),0) > 2 then 'r1' else 'r0' end;
  elsif state.phase = 'discard' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'q' || seat.hand[(state.rng % cardinality(seat.hand)) + 1]; else action := 'q' || danz_private.seis_worst(seat.hand); end if;
  elsif state.phase = 'strobe' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := 'l' || (state.rng % cardinality(state.strobe));
    else action := 'l' || danz_private.seis_best_index(danz_private.seis_show_ids(state.strobe)); end if;
  elsif state.phase = 'give' then action := 'g-';
  elsif state.phase = 'yeppo' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := case when state.rng % 2 = 0 then 'e0' else 'e1' end;
    else action := case when danz_private.seis_pressure(state) <= 2 then 'e0' else 'e1' end; end if;
  elsif state.phase = 'boon' then
    if easy then state.rng := danz_private.seis_rng(state.rng); action := case when state.rng % 2 = 0 then 'b0' else 'b1' end;
    else action := case when danz_private.seis_pressure(state) <= 2 then 'b0' else 'b1' end; end if;
  else action := 'n'; end if;
end $$;

create function danz_private.seis_swap(s danz_private.seis_state, left_seat int, right_seat int) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare a danz_private.seis_seat; b danz_private.seis_seat; left_card int; right_card int; index int;
begin
  a := s.seats[left_seat+1]; b := s.seats[right_seat+1];
  if coalesce(cardinality(a.hand),0) = 0 or coalesce(cardinality(b.hand),0) = 0 then return s; end if;
  s.rng := danz_private.seis_rng(s.rng); index := (s.rng % cardinality(a.hand)) + 1; left_card := a.hand[index]; a.hand := danz_private.seis_drop(a.hand, left_card);
  s := danz_private.seis_put(s, left_seat, a); b := s.seats[right_seat+1];
  s.rng := danz_private.seis_rng(s.rng); index := (s.rng % cardinality(b.hand)) + 1; right_card := b.hand[index]; b.hand := coalesce(danz_private.seis_drop(b.hand, right_card), '{}') || left_card;
  s := danz_private.seis_put(s, right_seat, b); a := s.seats[left_seat+1]; a.hand := coalesce(a.hand, '{}') || right_card; return danz_private.seis_put(s, left_seat, a);
end $$;

create function danz_private.seis_act(s danz_private.seis_state, action text) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare seat danz_private.seis_seat; before int; id int; idx int; target int; symbol text; shown danz_private.seis_show; cover danz_private.seis_cover; i int;
begin
  if s.phase = 'over' then raise exception 'over' using errcode='22023'; end if;
  seat := s.seats[s.current+1];
  if s.phase = 'play' then
    if action = 'd' then
      before := coalesce(cardinality(seat.hand),0); s := danz_private.seis_draw(s, s.current, 1); seat := s.seats[s.current+1];
      if coalesce(cardinality(seat.hand),0) > before and danz_private.seis_can(s, seat.hand[cardinality(seat.hand)]) then return danz_private.seis_play(s, seat.hand[cardinality(seat.hand)]); end if;
      s.lock := null; seat.missed := seat.missed + 1; s := danz_private.seis_put(s, s.current, seat); return danz_private.seis_finish(s);
    end if;
    if action !~ '^p[0-9]+$' then raise exception 'phase' using errcode='22023'; end if;
    return danz_private.seis_play(s, substring(action from 2)::int);
  elsif s.phase = 'color' then
    if action !~ '^c[0-4]$' then raise exception 'phase' using errcode='22023'; end if;
    s.color := substring(action from 2)::int;
    if danz_private.seis_special(s.discard[1]) = 'cambio' then s.phase := 'demand'; return s; end if;
    if danz_private.seis_special(s.discard[1]) = 'flor-negra' then s.phase := 'boon'; return s; end if;
    return danz_private.seis_finish(s);
  elsif s.phase = 'demand' then
    if action !~ '^y[0-9fvlj-]$' then raise exception 'phase' using errcode='22023'; end if;
    symbol := danz_private.seis_symbol_code(substring(action from 2 for 1));
    if substring(action from 2 for 1) <> '-' and symbol is null then raise exception 'phase' using errcode='22023'; end if;
    s.lock := symbol; return danz_private.seis_finish(s);
  elsif s.phase = 'panas-who' then
    if action !~ '^a[0-9]$' then raise exception 'phase' using errcode='22023'; end if;
    target := substring(action from 2)::int;
    if target = s.current or target < 0 or target >= cardinality(s.seats) then raise exception 'target' using errcode='22023'; end if;
    if danz_private.seis_special(s.discard[1]) = 'panas-fuerte' then
      cover.a := s.current; cover.b := target; cover.until_step := s.step + cardinality(s.seats) * 2; s.covers := coalesce(s.covers, '{}') || cover; return danz_private.seis_finish(s);
    end if;
    s.give := target; s.phase := 'panas-how'; return s;
  elsif s.phase = 'panas-how' then
    if action not in ('m0','m1') or s.give is null then raise exception 'phase' using errcode='22023'; end if;
    target := s.give; s.give := null;
    if action = 'm0' then cover.a := s.current; cover.b := target; cover.until_step := s.step + cardinality(s.seats); s.covers := coalesce(s.covers, '{}') || cover;
    else s := danz_private.seis_swap(s, s.current, target); end if;
    return danz_private.seis_finish(s);
  elsif s.phase = 'wishlist' then
    if action !~ '^w[0-2]$' then raise exception 'phase' using errcode='22023'; end if;
    idx := substring(action from 2)::int;
    if idx < 0 or idx >= coalesce(cardinality(s.wish),0) then raise exception 'phase' using errcode='22023'; end if;
    seat.hand := coalesce(seat.hand, '{}') || s.wish[idx+1]; s := danz_private.seis_put(s, s.current, seat);
    s.wish := coalesce(s.wish[1:idx], '{}') || coalesce(s.wish[idx+2:cardinality(s.wish)], '{}');
    if coalesce(cardinality(s.wish),0) = 2 then s.phase := 'order'; return s; end if;
    s.deck := coalesce(s.deck, '{}') || coalesce(s.wish, '{}'); s.wish := '{}'; return danz_private.seis_finish(s);
  elsif s.phase = 'order' then
    if action not in ('o0','o1') then raise exception 'phase' using errcode='22023'; end if;
    if action = 'o0' then for i in reverse coalesce(cardinality(s.wish),0)..1 loop s.deck := coalesce(s.deck, '{}') || s.wish[i]; end loop; else s.deck := coalesce(s.deck, '{}') || s.wish; end if;
    s.wish := '{}'; return danz_private.seis_finish(s);
  elsif s.phase = 'resaca' then
    if action = 'r0' then
      s.rng := danz_private.seis_rng(s.rng); idx := (s.rng % cardinality(seat.hand)) + 1; id := seat.hand[idx]; seat.hand := danz_private.seis_drop(seat.hand, id); s := danz_private.seis_put(s, s.current, seat);
      s.discard := s.discard[1:1] || id || coalesce(s.discard[2:cardinality(s.discard)], '{}'); return danz_private.seis_finish(s);
    elsif action = 'r1' then s := danz_private.seis_draw(s, s.current, 2); s.phase := 'discard'; return s;
    else raise exception 'phase' using errcode='22023'; end if;
  elsif s.phase = 'discard' then
    if action !~ '^q[0-9]+$' then raise exception 'phase' using errcode='22023'; end if;
    id := substring(action from 2)::int;
    if not danz_private.seis_has(seat.hand, id) then raise exception 'card' using errcode='22023'; end if;
    seat.hand := danz_private.seis_drop(seat.hand, id); s := danz_private.seis_put(s, s.current, seat);
    s.discard := s.discard[1:1] || id || coalesce(s.discard[2:cardinality(s.discard)], '{}'); return danz_private.seis_finish(s);
  elsif s.phase = 'strobe' then
    if action !~ '^l[0-9]+$' then raise exception 'phase' using errcode='22023'; end if;
    idx := substring(action from 2)::int;
    if idx < 0 or idx >= coalesce(cardinality(s.strobe),0) then raise exception 'phase' using errcode='22023'; end if;
    s.give := idx; s.phase := 'give'; return s;
  elsif s.phase = 'give' then
    if action !~ '^g(-|[0-9])$' or s.give is null then raise exception 'phase' using errcode='22023'; end if;
    shown := s.strobe[s.give+1]; target := case when substring(action from 2) = '-' then s.current else substring(action from 2)::int end;
    if target < 0 or target >= cardinality(s.seats) then raise exception 'target' using errcode='22023'; end if;
    if shown.player <> target then
      seat := s.seats[shown.player+1]; seat.hand := danz_private.seis_drop(seat.hand, shown.card); s := danz_private.seis_put(s, shown.player, seat);
      seat := s.seats[target+1]; seat.hand := coalesce(seat.hand, '{}') || shown.card; s := danz_private.seis_put(s, target, seat);
    end if;
    s.strobe := '{}'; s.give := null; return danz_private.seis_finish(s);
  elsif s.phase = 'yeppo' then
    if action = 'e0' then seat.shield := true; s := danz_private.seis_put(s, s.current, seat); return danz_private.seis_finish(s); end if;
    if action <> 'e1' then raise exception 'phase' using errcode='22023'; end if;
    before := coalesce(cardinality(seat.hand),0); s := danz_private.seis_draw(s, s.current, 1); seat := s.seats[s.current+1];
    if coalesce(cardinality(seat.hand),0) > before and danz_private.seis_can(s, seat.hand[cardinality(seat.hand)]) then return danz_private.seis_play(s, seat.hand[cardinality(seat.hand)]); end if;
    return danz_private.seis_finish(s);
  elsif s.phase = 'boon' then
    if action = 'b0' then seat.shield := true; s := danz_private.seis_put(s, s.current, seat); return danz_private.seis_finish(s); end if;
    if action <> 'b1' then raise exception 'phase' using errcode='22023'; end if;
    return danz_private.seis_finish(s);
  elsif action = 's' then seat := s.seats[1]; seat.said := true; s := danz_private.seis_put(s, 0, seat); return danz_private.seis_advance(s);
  elsif action = 'n' then s := danz_private.seis_draw(s, 0, 2); seat := s.seats[1]; seat.said := false; s := danz_private.seis_put(s, 0, seat); return danz_private.seis_advance(s);
  else raise exception 'phase' using errcode='22023'; end if;
end $$;

create function danz_private.seis_human(s danz_private.seis_state) returns boolean language sql immutable set search_path='' as $$
  select s.phase <> 'over' and (s.phase = 'seis' or not (s.seats[s.current + 1]).ai)
$$;
create function danz_private.seis_until(s danz_private.seis_state) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare guard int; chosen record;
begin
  for guard in 1..800 loop
    exit when s.phase = 'over' or danz_private.seis_human(s);
    select * into chosen from danz_private.seis_choose(s);
    s := danz_private.seis_act(chosen.state, chosen.action);
  end loop;
  return s;
end $$;
create function danz_private.seis_deal(seed int, opponents int, level text) returns danz_private.seis_state language plpgsql immutable set search_path='' as $$
declare s danz_private.seis_state; cards int[]; i0 int; i1 int; j1 int; tmp int; round int; p int; guard int; id int; seat danz_private.seis_seat; tone int;
begin
  if seed is null or seed < 1 or seed > 2147483646 or opponents not between 1 and 3 or level not in ('facil','normal','dificil') then raise exception 'setup' using errcode='22023'; end if;
  s.level := level; s.rng := seed; s.deck := array(select generate_series(0,89)); s.discard := '{}'; s.seats := '{}'; s.covers := '{}'; s.wish := '{}'; s.strobe := '{}';
  s.current := 0; s.direction := 1; s.lock := null; s.give := null; s.phase := 'play'; s.step := 0; s.winner := null; s.perfect := false; s.capped := false;
  cards := s.deck;
  for i0 in reverse 89..1 loop
    s.rng := danz_private.seis_rng(s.rng); i1 := i0 + 1; j1 := (s.rng % (i0 + 1)) + 1; tmp := cards[i1]; cards[i1] := cards[j1]; cards[j1] := tmp;
  end loop;
  for p in 0..opponents loop
    seat.hand := '{}'; seat.ai := p <> 0; seat.shield := false; seat.skip := false; seat.pending_draw := 0; seat.resaca := false; seat.blind := false; seat.said := false; seat.missed := 0;
    s.seats := s.seats || seat;
  end loop;
  for round in 1..7 loop
    for p in 0..opponents loop
      id := cards[cardinality(cards)]; cards := coalesce(cards[1:cardinality(cards)-1], '{}');
      seat := s.seats[p+1]; seat.hand := seat.hand || id; s.seats[p+1] := seat;
    end loop;
  end loop;
  guard := 0;
  while guard < 30 and coalesce(cardinality(cards),0) > 0 and danz_private.seis_special(cards[cardinality(cards)]) is not null loop
    id := cards[cardinality(cards)]; cards := array_prepend(id, coalesce(cards[1:cardinality(cards)-1], '{}')); guard := guard + 1;
  end loop;
  id := cards[cardinality(cards)]; cards := coalesce(cards[1:cardinality(cards)-1], '{}');
  tone := danz_private.seis_color(id); s.deck := cards; s.discard := array[id]; s.color := coalesce(tone, 1);
  return s;
end $$;

create function danz_private.seis_fingerprint(s danz_private.seis_state) returns text language plpgsql immutable set search_path='' as $$
declare hands text := ''; flags text := ''; covers text := ''; strobe text := ''; i int; seat danz_private.seis_seat; cover danz_private.seis_cover; shown danz_private.seis_show;
begin
  for i in 1..cardinality(s.seats) loop
    seat := s.seats[i];
    hands := hands || case when i > 1 then '/' else '' end || array_to_string(coalesce(seat.hand, '{}'), '.');
    flags := flags || case when i > 1 then '/' else '' end || (case when seat.shield then '1' else '0' end) || '.' || (case when seat.skip then '1' else '0' end) || '.' || seat.pending_draw::text || '.' || (case when seat.resaca then '1' else '0' end) || '.' || (case when seat.blind then '1' else '0' end) || '.' || (case when seat.said then '1' else '0' end) || '.' || seat.missed::text;
  end loop;
  for i in 1..coalesce(cardinality(s.covers),0) loop cover := s.covers[i]; covers := covers || case when i > 1 then '/' else '' end || cover.a::text || '.' || cover.b::text || '.' || cover.until_step::text; end loop;
  for i in 1..coalesce(cardinality(s.strobe),0) loop shown := s.strobe[i]; strobe := strobe || case when i > 1 then '/' else '' end || shown.player::text || '.' || shown.card::text; end loop;
  return array_to_string(array[
    s.phase, s.current::text, s.color::text, coalesce(s.lock, '-'), s.direction::text,
    array_to_string(coalesce(s.discard, '{}'), '.'), hands, array_to_string(coalesce(s.deck, '{}'), '.'),
    coalesce(s.winner::text, '-'), case when s.capped then '1' else '0' end, s.step::text, s.rng::text,
    flags, covers, array_to_string(coalesce(s.wish, '{}'), '.'), strobe, coalesce(s.give::text, '-'), case when s.perfect then '1' else '0' end
  ], '|');
end $$;

create function danz_private.seis_replay(seed int, opponents int, level text, actions text) returns jsonb language plpgsql immutable set search_path='' as $$
declare s danz_private.seis_state; total int; i int; action text;
begin
  if actions is null or length(actions) > 8000 or (actions <> '' and actions !~ '^([a-z0-9-]+)(,[a-z0-9-]+)*$') then raise exception 'actions' using errcode='22023'; end if;
  s := danz_private.seis_deal(seed, opponents, level);
  if actions <> '' then
    total := 1 + length(actions) - length(replace(actions, ',', ''));
    for i in 1..total loop
      action := split_part(actions, ',', i);
      if not danz_private.seis_human(s) then raise exception 'turn' using errcode='22023'; end if;
      s := danz_private.seis_act(s, action);
      s := danz_private.seis_until(s);
    end loop;
  end if;
  return jsonb_build_object('fingerprint', danz_private.seis_fingerprint(s), 'won', s.phase = 'over' and s.winner = 0 and coalesce(cardinality((s.seats[1]).hand),0) = 0 and not s.capped, 'phase', s.phase, 'turns', s.step);
end $$;

create function danz_private.seis_start_game(p_id uuid, p_opponents int, p_level text, p_alias text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid := danz_private.points_user(); r danz_private.seis_runs%rowtype; wk date := date_trunc('week', clock_timestamp() at time zone 'Europe/Madrid')::date;
begin
  if p_id is null or p_opponents not between 1 and 3 or p_level not in ('facil','normal','dificil') or p_alias is null or length(btrim(p_alias)) not between 2 and 24 or p_alias ~ '[@<>[:cntrl:]]' then raise exception 'Invalid SEIS match' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text, 126));
  select * into r from danz_private.seis_runs where id = p_id;
  if found then
    if r.user_id <> u or r.alias <> btrim(p_alias) or r.opponents <> p_opponents or r.level <> p_level then raise exception 'Conflicting game' using errcode='22023'; end if;
    if r.submitted_at is not null or r.abandoned or r.expires_at <= clock_timestamp() then raise exception 'Game already closed' using errcode='55000'; end if;
  else
    if (select count(*) from danz_private.seis_runs where user_id = u and started_at > clock_timestamp() - interval '1 hour') >= 30 then raise exception 'Hourly game limit' using errcode='54000'; end if;
    update danz_private.seis_runs set abandoned = true where user_id = u and submitted_at is null and not abandoned;
    insert into danz_private.seis_runs(id, user_id, alias, opponents, level, seed, week_start, expires_at)
    values (p_id, u, btrim(p_alias), p_opponents, p_level, 1 + floor(random() * 2147483646)::int, wk, least(clock_timestamp() + interval '45 minutes', (wk + 7)::timestamp at time zone 'Europe/Madrid'))
    returning * into r;
  end if;
  return jsonb_build_object('id', r.id, 'seed', r.seed, 'opponents', r.opponents, 'level', r.level, 'expiresAt', r.expires_at);
end $$;
create function danz_private.seis_submit_game(p_id uuid, p_actions text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid := danz_private.points_user(); r danz_private.seis_runs%rowtype; result jsonb; t timestamptz := clock_timestamp(); actions_n int; amount int := 0; why text := 'lost'; yr int;
begin
  if p_id is null or p_actions is null or length(p_actions) not between 1 and 8000 or p_actions !~ '^([a-z0-9-]+)(,[a-z0-9-]+)*$' then raise exception 'Invalid replay' using errcode='22023'; end if;
  select * into r from danz_private.seis_runs where id = p_id and user_id = u for update;
  if not found then raise exception 'Game unavailable' using errcode='42501'; end if;
  if r.submitted_at is not null then
    if r.replay_digest <> md5(p_actions) then raise exception 'Conflicting result' using errcode='22023'; end if;
    return jsonb_build_object('saved', true, 'won', r.won, 'turns', r.turns, 'points', coalesce(r.points, 0), 'reason', coalesce(r.reason, 'lost'));
  end if;
  if r.abandoned or t >= r.expires_at then raise exception 'Game expired' using errcode='55000'; end if;
  actions_n := 1 + length(p_actions) - length(replace(p_actions, ',', ''));
  if extract(epoch from (t - r.started_at)) * 1000 < actions_n * 250 then raise exception 'Impossible duration' using errcode='22023'; end if;
  result := danz_private.seis_replay(r.seed, r.opponents, r.level, p_actions);
  if result->>'phase' <> 'over' then raise exception 'Incomplete game' using errcode='22023'; end if;
  if (result->>'won')::boolean then
    yr := extract(year from r.week_start)::int; amount := 10; why := 'awarded';
    if (select count(*) from danz_private.seis_awards a where a.user_id = u and a.reward_year = yr and a.points > 0) >= 20 then amount := 0; why := 'year-limit';
    elsif (select count(*) from danz_private.seis_awards a where a.user_id = u and a.week_start = r.week_start and a.points > 0) >= 3 then amount := 0; why := 'week-limit'; end if;
    insert into danz_private.seis_awards(run_id, user_id, week_start, points, reason, reward_year) values (r.id, u, r.week_start, amount, why, yr);
  end if;
  update danz_private.seis_runs set submitted_at = t, won = (result->>'won')::boolean, turns = (result->>'turns')::int, points = amount, reason = why, replay_digest = md5(p_actions) where id = r.id;
  return jsonb_build_object('saved', true, 'won', (result->>'won')::boolean, 'turns', (result->>'turns')::int, 'points', amount, 'reason', why);
end $$;
create function danz_private.seis_start(p_id uuid, p_opponents int, p_level text, p_alias text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not danz_private.identity_ready() then raise exception 'Confirmed email and verified Instagram required' using errcode='42501'; end if;
  return danz_private.seis_start_game(p_id, p_opponents, p_level, p_alias);
end $$;
create function danz_private.seis_submit(p_id uuid, p_actions text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not danz_private.identity_ready() then raise exception 'Confirmed email and verified Instagram required' using errcode='42501'; end if;
  return danz_private.seis_submit_game(p_id, p_actions);
end $$;

create or replace function danz_private.points_earned_summary() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid := danz_private.points_user(); base jsonb; total bigint; seis bigint; awards jsonb;
begin
  perform danz_private.snake_settle();
  base := danz_private.points_event_summary();
  select coalesce(sum(points),0) into total from danz_private.snake_weeks where user_id = u;
  select coalesce(sum(points),0) into seis from danz_private.seis_awards where user_id = u;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.week desc), '[]'::jsonb) into awards from (
    select week_start as week, points, reason from danz_private.snake_weeks where user_id = u order by week_start desc limit 20
  ) t;
  return base || jsonb_build_object('available', (base->>'available')::bigint + total + seis, 'arcade', total + seis, 'arcadeAwards', awards, 'seis', seis);
end $$;

create function public.danz_seis_start(p_id uuid, p_opponents int, p_level text, p_alias text) returns jsonb language sql security invoker set search_path='' as $$
  select danz_private.seis_start(p_id, p_opponents, p_level, p_alias)
$$;
create function public.danz_seis_submit(p_id uuid, p_actions text) returns jsonb language sql security invoker set search_path='' as $$
  select danz_private.seis_submit(p_id, p_actions)
$$;
revoke all on function danz_private.seis_replay(int,int,text,text), danz_private.seis_start_game(uuid,int,text,text), danz_private.seis_submit_game(uuid,text), danz_private.seis_start(uuid,int,text,text), danz_private.seis_submit(uuid,text), public.danz_seis_start(uuid,int,text,text), public.danz_seis_submit(uuid,text) from public, anon, authenticated;
grant execute on function danz_private.seis_start(uuid,int,text,text), danz_private.seis_submit(uuid,text), public.danz_seis_start(uuid,int,text,text), public.danz_seis_submit(uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;
