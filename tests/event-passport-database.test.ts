import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const EA = '20000000-0000-4000-8000-000000000001'
const EB = '20000000-0000-4000-8000-000000000002'
const CODE = 'DANZACCESSA123456'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const file = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

before(async () => {
  await db.exec(await file('supabase/tests/platform.sql'))
  await db.exec(await file('supabase/tests/baseline.sql'))
  const migrations = await readdir(new URL('../supabase/migrations/', import.meta.url))
  for (const suffix of ['_danz_private_gallery_client_access.sql', '_danz_event_passport.sql']) {
    const names = migrations.filter(name => name.endsWith(suffix))
    assert.equal(names.length, 1)
    await db.exec(await file(`supabase/migrations/${names[0]}`))
  }
  await db.exec(await file('supabase/tests/data.sql'))
  await db.exec('delete from public.danz_attendance; delete from public.danz_event_access_codes')
  await db.query('insert into public.danz_event_access_codes (event_id,code_hash,max_uses) values ($1,$2,1)', [EA, hash(CODE)])
})
beforeEach(async () => { await db.exec('begin') })
afterEach(async () => { await db.exec('rollback') })
after(async () => { await db.close() })

async function asUser<T>(uid: string | null, action: () => Promise<T>, role = 'authenticated', anonymous = false) {
  assert.ok(['authenticated', 'anon'].includes(role))
  await db.exec(`set local role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [uid ?? '', JSON.stringify({ sub: uid, is_anonymous: anonymous })])
  try { return await action() } finally { await db.exec('reset role') }
}
const redeem = (code: string | null = CODE) => db.query<{ status: string; event_id: string | null; granted_at: string | null }>('select * from public.danz_redeem_event_code($1)', [code])
const passport = () => db.query<{ event_id: string; title: string; event_status: string }>('select * from public.danz_my_passport()')

async function denied(sql: string, params: unknown[] = []) {
  await db.exec('savepoint expected_denial')
  try { await assert.rejects(() => db.query(sql, params), (error: any) => error.code === '42501') }
  finally { await db.exec('rollback to savepoint expected_denial; release savepoint expected_denial') }
}

test('RPCs are denied to guests, missing identities and anonymous Auth accounts', async () => {
  await asUser(null, async () => {
    await denied('select * from public.danz_redeem_event_code($1)', [CODE])
    await denied('select * from public.danz_my_passport()')
  }, 'anon')
  for (const [uid, anonymous] of [[null, false], [A, true]] as const) {
    await asUser(uid, async () => {
      await denied('select * from public.danz_redeem_event_code($1)', [CODE])
      await denied('select * from public.danz_my_passport()')
    }, 'authenticated', anonymous)
  }
})

test('a formatted code grants only the current account and unlocks its published gallery', async () => {
  await asUser(A, async () => {
    assert.equal((await db.query('select * from public.danz_events')).rows.length, 0)
    const result = (await redeem(' danz-access-a123456 ')).rows[0]
    assert.equal(result.status, 'granted')
    assert.equal(result.event_id, EA)
    assert.ok(result.granted_at)
    assert.deepEqual((await db.query<{ id: string }>('select id from public.danz_events')).rows, [{ id: EA }])
    assert.equal((await db.query('select * from storage.objects')).rows.length, 1)
  })
  assert.equal((await db.query<{ used_count: number }>('select used_count from public.danz_event_access_codes')).rows[0].used_count, 1)
  assert.deepEqual((await db.query<{ user_id: string }>('select user_id from public.danz_attendance')).rows, [{ user_id: A }])
})

test('repeated redemption preserves the original stamp and consumes no extra use', async () => {
  await asUser(A, async () => {
    const first = (await redeem()).rows[0]
    const second = (await redeem()).rows[0]
    assert.equal(first.status, 'granted')
    assert.equal(second.status, 'already_attended')
    assert.deepEqual(second.granted_at, first.granted_at)
  })
  assert.equal((await db.query<{ used_count: number }>('select used_count from public.danz_event_access_codes')).rows[0].used_count, 1)
})

test('the final use cannot authorize a second account or a second attendance', async () => {
  assert.equal((await asUser(A, () => redeem())).rows[0].status, 'granted')
  assert.deepEqual((await asUser(B, () => redeem())).rows[0], { status: 'unavailable', event_id: null, granted_at: null })
  assert.equal((await db.query('select * from public.danz_attendance')).rows.length, 1)
})

test('an alternative code for an already attended event does not consume capacity', async () => {
  const second = 'SECONDACCESS1234'
  await db.query('insert into public.danz_event_access_codes (event_id,code_hash,max_uses) values ($1,$2,1)', [EA, hash(second)])
  await asUser(A, async () => {
    await redeem()
    assert.equal((await redeem(second)).rows[0].status, 'already_attended')
  })
  assert.equal((await db.query<{ used_count: number }>('select used_count from public.danz_event_access_codes where code_hash=$1', [hash(second)])).rows[0].used_count, 0)
})

test('expired, revoked, exhausted, draft and unknown codes reveal the same empty outcome', async () => {
  const codes = ['EXPIREDACCESS1234', 'REVOKEDACCESS1234', 'EXHAUSTED12345678', 'DRAFTACCESS12345']
  for (const code of codes) await db.query('insert into public.danz_event_access_codes (event_id,code_hash,max_uses) values ($1,$2,1)', [EB, hash(code)])
  await db.query("update public.danz_event_access_codes set expires_at=now()-interval '1 second' where code_hash=$1", [hash(codes[0])])
  await db.query('update public.danz_event_access_codes set revoked_at=now() where code_hash=$1', [hash(codes[1])])
  await db.query('update public.danz_event_access_codes set used_count=1 where code_hash=$1', [hash(codes[2])])
  const draft = '20000000-0000-4000-8000-000000000003'
  await db.query("insert into public.danz_events(id,title,status) values($1,'Private draft','draft')", [draft])
  await db.query('update public.danz_event_access_codes set event_id=$1 where code_hash=$2', [draft, hash(codes[3])])
  await asUser(A, async () => {
    for (const code of [...codes, 'UNKNOWNACCESS1234']) assert.deepEqual((await redeem(code)).rows[0], { status: 'unavailable', event_id: null, granted_at: null })
  })
  assert.equal((await db.query('select * from public.danz_attendance')).rows.length, 0)
})

test('failed attempts persist, are bounded per account and reset after ten minutes', async () => {
  await asUser(A, async () => {
    for (let index = 0; index < 8; index++) assert.equal((await redeem('UNKNOWNACCESS1234')).rows[0].status, 'unavailable')
    assert.equal((await redeem()).rows[0].status, 'rate_limited')
  })
  const attempts = await db.query<{ attempts: number }>('select attempts from danz_private.code_attempts where user_id=$1', [A])
  assert.equal(attempts.rows[0].attempts, 9)
  assert.equal((await asUser(B, () => redeem())).rows[0].status, 'granted', 'one account cannot exhaust another account\'s attempt window')
  await db.query("update danz_private.code_attempts set window_started=now()-interval '11 minutes' where user_id=$1", [A])
  assert.equal((await asUser(A, () => redeem())).rows[0].status, 'unavailable', 'window resets, but code capacity remains enforced')
  assert.equal((await db.query<{ attempts: number }>('select attempts from danz_private.code_attempts where user_id=$1', [A])).rows[0].attempts, 1)
})

test('malformed and oversized requests consume an attempt without exposing code data', async () => {
  await asUser(A, async () => {
    for (const value of [null, '', 'short', 'A'.repeat(1000), '<script>']) assert.equal((await redeem(value)).rows[0].status, 'unavailable')
    await denied('select * from public.danz_event_access_codes')
    await denied('select * from danz_private.code_attempts')
    await denied('insert into public.danz_attendance(user_id,event_id) values($1,$2)', [B, EB])
    await denied('delete from public.danz_attendance')
  })
  assert.equal((await db.query<{ attempts: number }>('select attempts from danz_private.code_attempts where user_id=$1', [A])).rows[0].attempts, 5)
})

test('the permanent passport is isolated by account and keeps archived event stamps', async () => {
  await db.query('insert into public.danz_attendance(user_id,event_id) values($1,$2),($3,$4)', [A, EA, B, EB])
  await db.query("update public.danz_events set status='archived' where id=$1", [EA])
  await asUser(A, async () => {
    assert.deepEqual((await passport()).rows.map(row => [row.event_id, row.title, row.event_status]), [[EA, 'Synthetic event A', 'archived']])
    assert.equal((await db.query('select * from public.danz_events')).rows.length, 0)
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0)
  })
  assert.deepEqual((await asUser(B, passport)).rows.map(row => row.event_id), [EB])
})

test('privileged helpers have fixed paths and are absent from the public API schema', async () => {
  const funcs = await db.query<{ nspname: string; proname: string; prosecdef: boolean; proconfig: string[] }>("select n.nspname,p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='danz_private' or p.proname in ('danz_redeem_event_code','danz_my_passport')")
  assert.equal(funcs.rows.length, 4)
  for (const row of funcs.rows) {
    assert.equal(row.prosecdef, row.nspname === 'danz_private')
    assert.deepEqual(row.proconfig, ['search_path=""'])
  }
})
