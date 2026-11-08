import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Real PostgreSQL rules/roles, isolated memory database and synthetic UUIDs.
// No network, credentials, hosted users, photos or emails are used.
const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const EA = '20000000-0000-4000-8000-000000000001'
const EB = '20000000-0000-4000-8000-000000000002'
const PA = '30000000-0000-4000-8000-000000000001'
const PD = '30000000-0000-4000-8000-000000000002'
const PQ = '30000000-0000-4000-8000-000000000003'
const PB = '30000000-0000-4000-8000-000000000004'
const sqlFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

before(async () => {
  await db.exec(await sqlFile('supabase/tests/platform.sql'))
  await db.exec(await sqlFile('supabase/tests/baseline.sql'))
  const blocked = await db.query<{ allowed: boolean }>(
    `select has_table_privilege('authenticated','public.danz_photos','SELECT') as allowed`,
  )
  assert.equal(blocked.rows[0].allowed, false, 'snapshot reproduces missing initial GRANT')
  const migration = (await readdir(new URL('../supabase/migrations/', import.meta.url)))
    .filter(name => name.endsWith('_danz_private_gallery_client_access.sql'))
  assert.equal(migration.length, 1, 'one migration for this permission change')
  await db.exec(await sqlFile(`supabase/migrations/${migration[0]}`))
  await db.exec(await sqlFile('supabase/tests/data.sql'))
})
after(async () => db.close())

async function asUser<T>(uid: string | null, action: () => Promise<T>, role = 'authenticated', setup = ''): Promise<T> {
  assert.ok(['authenticated', 'anon'].includes(role))
  await db.exec('begin')
  try {
    if (setup) await db.exec(setup)
    await db.exec(`set local role ${role}`)
    await db.query(`select set_config('request.jwt.claim.sub',$1,true)`, [uid ?? ''])
    await db.query(`select set_config('request.jwt.claims',$1,true)`, [JSON.stringify({ sub: uid })])
    return await action()
  } finally {
    await db.exec('rollback')
  }
}

async function denied(sql: string, params: unknown[] = [], code = '42501') {
  await db.exec('savepoint expected_denial')
  try {
    await assert.rejects(() => db.query(sql, params), (error: any) => error.code === code)
  } finally {
    await db.exec('rollback to savepoint expected_denial; release savepoint expected_denial')
  }
}

test('client roles lose maintenance and destructive grants; hashes remain closed', async () => {
  const rows = await db.query<{ role: string; table_name: string; excess: boolean }>(`
    select r.role,c.relname as table_name,
      has_table_privilege(r.role,c.oid,'TRUNCATE')
      or has_table_privilege(r.role,c.oid,'REFERENCES')
      or has_table_privilege(r.role,c.oid,'TRIGGER')
      or has_table_privilege(r.role,c.oid,'MAINTAIN')
      or has_table_privilege(r.role,c.oid,'DELETE') as excess
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    cross join (values ('anon'),('authenticated')) r(role)
    where n.nspname='public' and c.relname like 'danz_%' and c.relkind='r'
  `)
  assert.equal(rows.rows.length, 14)
  assert.ok(rows.rows.every(row => !row.excess))
  await asUser(A, () => denied('select code_hash from public.danz_event_access_codes'))
})

test('each attendee sees only their published event, photos and own attendance', async () => {
  for (const [user, event, photo] of [[A, EA, PA], [B, EB, PB]]) {
    await asUser(user, async () => {
      assert.deepEqual((await db.query('select id from public.danz_events')).rows, [{ id: event }])
      assert.deepEqual((await db.query('select id from public.danz_photos')).rows, [{ id: photo }])
      assert.deepEqual((await db.query('select user_id,event_id from public.danz_attendance')).rows, [{ user_id: user, event_id: event }])
    })
  }
})

test('anonymous client cannot read events, profiles, photos or hashes; no Storage rows', async () => {
  await asUser(null, async () => {
    for (const table of ['danz_events','danz_profiles','danz_photos','danz_attendance','danz_admins','danz_photo_reports','danz_event_access_codes']) {
      await denied(`select * from public.${table}`)
    }
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [])
  }, 'anon')
})

test('authenticated role without auth.uid has no event/photo/profile/Storage rows', async () => {
  await asUser(null, async () => {
    for (const table of ['danz_events','danz_photos','danz_profiles','danz_attendance','danz_admins','danz_photo_reports']) {
      assert.deepEqual((await db.query(`select * from public.${table}`)).rows, [])
    }
    assert.deepEqual((await db.query('select * from storage.objects')).rows, [])
  })
})

test('profile reads and updates preserve ownership and server-controlled fields', async () => {
  await asUser(A, async () => {
    assert.deepEqual((await db.query('select user_id from public.danz_profiles')).rows, [{ user_id: A }])
    const own = await db.query('update public.danz_profiles set display_name=$1 where user_id=$2 returning display_name', ['Edited A', A])
    assert.deepEqual(own.rows, [{ display_name: 'Edited A' }])
    assert.equal((await db.query('update public.danz_profiles set display_name=$1 where user_id=$2', ['Bad B', B])).affectedRows, 0)
    await denied('update public.danz_profiles set user_id=$1 where user_id=$2', [B, A])
    await denied(`update public.danz_profiles set created_at=now() where user_id=$1`, [A])
    await denied('delete from public.danz_profiles where user_id=$1', [A])
  })
})

test('profile creation allows own user and rejects another owner', async () => {
  await asUser(A, async () => {
    assert.deepEqual((await db.query('insert into public.danz_profiles(user_id,display_name) values ($1,$2) returning user_id', [A,'New A'])).rows, [{ user_id: A }])
    await denied('insert into public.danz_profiles(user_id,display_name) values ($1,$2)', [B,'Spoof B'])
    await denied('insert into public.danz_profiles(user_id,created_at) values ($1,now())', [A])
  }, 'authenticated', 'delete from public.danz_profiles')
})

test('reports start pending; client cannot choose status, identity or inaccessible photo', async () => {
  await asUser(A, async () => {
    const report = await db.query('insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ($1,$2,$3) returning reporter_id,status', [PA,A,'Synthetic privacy request'])
    assert.deepEqual(report.rows, [{ reporter_id: A, status: 'pending' }])
    await denied(`insert into public.danz_photo_reports(photo_id,reporter_id,reason,status) values ($1,$2,'Synthetic request','resolved')`, [PA,A])
    await denied(`update public.danz_photo_reports set status='resolved' where reporter_id=$1`, [A])
    await denied(`insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ($1,$2,'Synthetic request')`, [PA,B])
    for (const photo of [PD,PQ,PB]) {
      await denied(`insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ($1,$2,'Synthetic request')`, [photo,A])
    }
    await denied(`insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ($1,$2,'x')`, [PA,A], '23514')
  })
})

test('report history is visible only to its author', async () => {
  const setup = `insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ('${PA}','${A}','Synthetic private report')`
  await asUser(B, async () => {
    assert.deepEqual((await db.query('select * from public.danz_photo_reports')).rows, [])
  }, 'authenticated', setup)
})

test('Storage allows only exact published photo paths from own event', async () => {
  for (const [user, path] of [[A,'a/published.jpg'], [B,'b/published.jpg']]) {
    await asUser(user, async () => {
      assert.deepEqual((await db.query('select bucket_id,name from storage.objects')).rows, [{ bucket_id: 'danz-event-photos', name: path }])
    })
  }
})

test('draft or archived event hides its photos and Storage, including existing attendees', async () => {
  for (const status of ['draft','archived']) {
    await asUser(A, async () => {
      assert.deepEqual((await db.query('select id from public.danz_events')).rows, [])
      assert.deepEqual((await db.query('select id from public.danz_photos')).rows, [])
      assert.deepEqual((await db.query('select name from storage.objects')).rows, [])
      await denied(`insert into public.danz_photo_reports(photo_id,reporter_id,reason) values ($1,$2,'Synthetic request')`, [PA,A])
    }, 'authenticated', `update public.danz_events set status='${status}' where id='${EA}'`)
  }
})

test('attendance revocation immediately removes event, photo and Storage selection', async () => {
  await asUser(A, async () => {
    assert.deepEqual((await db.query('select id from public.danz_events')).rows, [])
    assert.deepEqual((await db.query('select id from public.danz_photos')).rows, [])
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [])
  }, 'authenticated', `delete from public.danz_attendance where user_id='${A}'`)
})

test('photo quarantine removes object selection immediately', async () => {
  await asUser(A, async () => {
    assert.deepEqual((await db.query('select id from public.danz_photos')).rows, [])
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [])
  }, 'authenticated', `update public.danz_photos set status='quarantined' where id='${PA}'`)
})

test('attendee cannot award attendance, create admins or write event/photo objects', async () => {
  await asUser(A, async () => {
    await denied('insert into public.danz_attendance(user_id,event_id) values ($1,$2)', [A,EB])
    await denied('insert into public.danz_admins(user_id) values ($1)', [A])
    await denied(`update public.danz_events set status='published' where id=$1`, [EA])
    await denied(`update public.danz_photos set status='published' where id=$1`, [PD])
    await denied(`insert into storage.objects(bucket_id,name) values ('danz-event-photos','rogue.jpg')`)
    assert.equal((await db.query(`delete from storage.objects where name='a/published.jpg'`)).affectedRows, 0)
  })
})

test('admin membership read does not confer client-side admin writes', async () => {
  await asUser(B, async () => {
    assert.deepEqual((await db.query('select user_id from public.danz_admins')).rows, [{ user_id: B }])
    await denied(`insert into public.danz_events(title) values ('Unauthorized client event')`)
    await denied('select code_hash from public.danz_event_access_codes')
  })
})

test('reporter index is present and all seven public tables retain RLS', async () => {
  const result = await db.query<{ total: number }>(`select count(*)::int as total from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'danz_%' and c.relkind='r' and c.relrowsecurity`)
  assert.equal(result.rows[0].total, 7)
  assert.equal((await db.query(`select 1 from pg_indexes where schemaname='public' and indexname='danz_photo_reports_reporter_idx'`)).rows.length, 1)
})
