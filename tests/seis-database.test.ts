import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, test } from 'node:test'
import { readdir, readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { apply, createMatch, fingerprint, humanWon, legalPlays, needsHuman, playUntilHuman, type Level, type SeisState } from '../src/arcade/seis/engine.ts'

const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

before(async () => {
  await db.exec(await read('supabase/tests/platform.sql'))
  await db.exec('alter table auth.users add column email text, add column email_confirmed_at timestamptz')
  await db.exec("create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$")
  await db.exec(await read('supabase/tests/baseline.sql'))
  const files = await readdir(new URL('../supabase/migrations', import.meta.url))
  for (const suffix of ['_danz_private_gallery_client_access.sql', '_danz_event_passport.sql', '_danz_admin_events_codes.sql', '_danzpoints_event_pilot.sql']) {
    await db.exec(await read(`supabase/migrations/${files.find(file => file.endsWith(suffix))}`))
  }
  await db.exec(await read('supabase/tests/data.sql'))
  await db.exec('create schema cron; create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$')
  const snake = await read(`supabase/migrations/${files.find(file => file.endsWith('_danz_snake_competition.sql'))}`)
  await db.exec(snake.replace('create extension if not exists pg_cron;', '-- cron fixture'))
  await db.exec(await read(`supabase/migrations/${files.find(file => file.endsWith('_danz_snake_podium_identity.sql'))}`))
  await db.exec(await read(`supabase/migrations/${files.find(file => file.endsWith('_danz_seis.sql'))}`))
  for (const [id, handle] of [[A, 'fixture_a'], [B, 'fixture_b']] as const) {
    await db.query('update auth.users set email=$2, email_confirmed_at=now() where id=$1', [id, `${handle}@example.invalid`])
    await db.query("insert into danz_private.instagram_links(user_id, handle, status, challenge, verified_at) values($1,$2,'verified','local-fixture',now())", [id, handle])
    await db.query('insert into public.danz_profiles(user_id, instagram_handle) values($1,$2) on conflict(user_id) do update set instagram_handle=excluded.instagram_handle', [id, handle])
  }
})
beforeEach(async () => { await db.exec('begin') })
afterEach(async () => { await db.exec('rollback') })
after(async () => { await db.close() })

async function user<T>(id: string | null, fn: () => Promise<T>, role = 'authenticated') {
  await db.exec(`set local role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [id ?? '', JSON.stringify({ sub: id, aal: 'aal1', is_anonymous: false })])
  try { return await fn() } finally { await db.exec('reset role') }
}
async function denied(sql: string, args: unknown[] = [], code = '42501') {
  await db.exec('savepoint denied')
  try { await assert.rejects(() => db.query(sql, args), (error: { code?: string }) => error.code === code) } finally { await db.exec('rollback to savepoint denied; release savepoint denied') }
}
function humanAction(state: SeisState) {
  if (state.phase === 'play') { const legal = legalPlays(state); return legal[0] !== undefined ? `p${legal[0]}` : 'd' }
  if (state.phase === 'seis') return 's'
  if (state.phase === 'color') return 'c0'
  if (state.phase === 'demand') return 'y-'
  if (state.phase === 'panas-who') return 'a1'
  if (state.phase === 'panas-how') return 'm0'
  if (state.phase === 'wishlist') return 'w0'
  if (state.phase === 'order') return 'o0'
  if (state.phase === 'resaca') return 'r0'
  if (state.phase === 'discard') return `q${state.players[state.current].hand[0]}`
  if (state.phase === 'strobe') return 'l0'
  if (state.phase === 'give') return 'g-'
  if (state.phase === 'yeppo') return 'e0'
  if (state.phase === 'boon') return 'b1'
  return 'd'
}
function script(seed: number, opponents: number, level: Level) {
  const actions: string[] = []
  let state = createMatch(seed, opponents, level)
  let guard = 0
  while (state.phase !== 'over' && guard++ < 600) {
    if (!needsHuman(state)) { state = playUntilHuman(state); continue }
    const action = humanAction(state)
    actions.push(action)
    const next = apply(state, action)
    if (!next.ok) throw new Error(next.error)
    state = playUntilHuman(next.state)
  }
  return { actions, state }
}
async function server(seed: number, opponents: number, level: Level, actions: string) {
  return (await db.query<{ v: { fingerprint: string; won: boolean; phase: string; turns: number } }>('select danz_private.seis_replay($1,$2,$3,$4) v', [seed, opponents, level, actions])).rows[0].v
}

test('the private replay matches the game module from the opening deal through a full table', async () => {
  for (const [seed, opponents, level] of [[426, 2, 'normal'], [7, 1, 'facil'], [99, 3, 'dificil']] as const) {
    const opening = await server(seed, opponents, level, '')
    assert.equal(opening.fingerprint, fingerprint(createMatch(seed, opponents, level)), `apertura ${seed}`)
  }
  const game = script(7, 1, 'normal')
  let state = createMatch(7, 1, 'normal')
  const played: string[] = []
  for (const action of game.actions) {
    played.push(action)
    const next = apply(state, action)
    assert.equal(next.ok, true)
    if (!next.ok) break
    state = playUntilHuman(next.state)
    const step = await server(7, 1, 'normal', played.join(','))
    assert.equal(step.fingerprint, fingerprint(state), played.join(','))
  }
  assert.equal((await server(7, 1, 'normal', game.actions.join(','))).won, humanWon(game.state))
})

test('only a verified account can ask for a seeded match, and the server awards the win', async () => {
  await user(null, () => denied("select public.danz_seis_start(gen_random_uuid(),1,'normal','DJ de prueba')"), 'anon')
  await user(A, () => denied('select * from danz_private.seis_runs'))
  await user(A, () => denied("select danz_private.seis_replay(1,1,'normal','')"))
  const id = crypto.randomUUID()
  const started = await user(A, async () => (await db.query<{ v: { id: string; seed: number } }>('select public.danz_seis_start($1,1,$2,$3) v', [id, 'normal', 'DJ de prueba'])).rows[0].v)
  assert.equal(started.id, id)
  assert.equal(started.seed > 0, true)
  await db.query('update danz_private.seis_runs set seed=11, started_at=clock_timestamp() - interval \'10 minutes\' where id=$1', [id])
  const game = script(11, 1, 'normal')
  assert.equal(humanWon(game.state), true)
  const send = () => db.query<{ v: { saved: boolean; won: boolean; points: number; reason: string } }>('select public.danz_seis_submit($1,$2) v', [id, game.actions.join(',')])
  const saved = await user(A, send)
  assert.equal(saved.rows[0].v.saved, true)
  assert.equal(saved.rows[0].v.won, true)
  assert.equal(saved.rows[0].v.points, 10)
  assert.equal(saved.rows[0].v.reason, 'awarded')
  const again = await user(A, send)
  assert.deepEqual(again.rows[0].v, saved.rows[0].v)
  await user(A, () => denied('select public.danz_seis_submit($1,$2)', [id, `${game.actions.join(',')},p1`], '22023'))
  const summary = await user(A, async () => (await db.query<{ v: { arcade: number; seis: number; available: number } }>('select public.danz_points_summary() v')).rows[0].v)
  assert.equal(summary.seis, saved.rows[0].v.points)
  assert.equal(summary.arcade, saved.rows[0].v.points)
  assert.equal(summary.available, saved.rows[0].v.points)
  await user(B, async () => {
    const other = (await db.query<{ v: { seis: number } }>('select public.danz_points_summary() v')).rows[0].v
    assert.equal(other.seis, 0)
  })
})

test('three paid SEIS wins in the same Madrid week stop the fourth award', async () => {
  for (let i = 0; i < 3; i += 1) await db.query("insert into danz_private.seis_awards(run_id,user_id,week_start,points,reason,reward_year) values(gen_random_uuid(),$1,date_trunc('week', clock_timestamp() at time zone 'Europe/Madrid')::date,10,'awarded',extract(year from date_trunc('week', clock_timestamp() at time zone 'Europe/Madrid'))::int)", [A])
  const id = crypto.randomUUID()
  await user(A, () => db.query('select public.danz_seis_start($1,1,$2,$3)', [id, 'normal', 'DJ de prueba']))
  await db.query('update danz_private.seis_runs set seed=11, started_at=clock_timestamp() - interval \'10 minutes\' where id=$1', [id])
  const game = script(11, 1, 'normal')
  const saved = await user(A, async () => (await db.query<{ v: { points: number; reason: string; won: boolean } }>('select public.danz_seis_submit($1,$2) v', [id, game.actions.join(',')])).rows[0].v)
  assert.equal(saved.won, true)
  assert.equal(saved.points, 0)
  assert.equal(saved.reason, 'week-limit')
})
