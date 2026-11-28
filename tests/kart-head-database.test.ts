import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const HEAD = '20000000-0000-4000-8000-000000000003'

before(async () => {
  const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  await db.exec(await read('supabase/tests/platform.sql'))
  const sql = await read('supabase/migrations/20261117120000_kart_custom_heads.sql')
  assert.match(sql, /NOT APPLIED/)
  await db.exec(sql)
  await db.exec(`insert into auth.users values ('${A}'), ('${B}')`)
  await db.query(`insert into public.kart_heads (id,user_id,name,storage_path) values ($1,$2,'TRONCO',$3)`, [HEAD, A, `${A}/${HEAD}.png`])
  await db.query(`insert into storage.objects (bucket_id,name) values ('kart-heads',$1)`, [`${A}/${HEAD}.png`])
})
after(async () => db.close())

async function asUser(uid: string | null, action: () => Promise<void>, role = 'authenticated') {
  await db.exec('begin')
  try {
    await db.exec(`set local role ${role}`)
    await db.query(`select set_config('request.jwt.claim.sub',$1,true)`, [uid ?? ''])
    await db.query(`select set_config('request.jwt.claims',$1,true)`, [JSON.stringify({ sub: uid })])
    await action()
  } finally { await db.exec('rollback') }
}

test('only the owner can read, write and delete a cabezón row and object', async () => {
  const bucket = await db.query<{ public: boolean }>(`select public from storage.buckets where id='kart-heads'`)
  assert.equal(bucket.rows[0].public, false)
  const extra = '20000000-0000-4000-8000-000000000004'
  await asUser(A, async () => {
    assert.equal((await db.query(`select name from public.kart_heads`)).rows.length, 1)
    await db.query(`insert into public.kart_heads (id,user_id,name,storage_path) values ($1,$2,'OTRO',$3)`, [extra, A, `${A}/${extra}.png`])
    await db.query(`insert into storage.objects (bucket_id,name) values ('kart-heads',$1)`, [`${A}/${extra}.png`])
  })
  await asUser(B, async () => {
    assert.equal((await db.query(`select id from public.kart_heads`)).rows.length, 0)
    await assert.rejects(() => db.query(`insert into public.kart_heads (id,user_id,name,storage_path) values ($1,$2,'OTRA',$3)`, [HEAD, A, `${A}/${HEAD}.png`]))
    await assert.rejects(() => db.query(`insert into storage.objects (bucket_id,name) values ('kart-heads',$1)`, [`${A}/${HEAD}.png`]))
  })
  await asUser(null, async () => {
    await assert.rejects(() => db.query(`select id from public.kart_heads`), (error: { code?: string }) => error.code === '42501')
  }, 'anon')
})
