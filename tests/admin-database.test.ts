import assert from 'node:assert/strict'
import { before, beforeEach, after, afterEach, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002'
const E='20000000-0000-4000-8000-000000000003', C='40000000-0000-4000-8000-000000000001'
const hash=createHash('sha256').update('SYNTHETICADMINACCESS12345').digest('hex')
const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),'utf8')
before(async()=>{
  await db.exec(await read('supabase/tests/platform.sql'))
  await db.exec("create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim',true),''),nullif(current_setting('request.jwt.claims',true),''))::jsonb$$")
  await db.exec(await read('supabase/tests/baseline.sql'))
  const files=await readdir(new URL('../supabase/migrations/',import.meta.url))
  for(const suffix of ['_danz_private_gallery_client_access.sql','_danz_event_passport.sql','_danz_admin_events_codes.sql']) {
    const file=files.filter(f=>f.endsWith(suffix)); assert.equal(file.length,1)
    await db.exec(await read(`supabase/migrations/${file[0]}`))
  }
  await db.exec(await read('supabase/tests/data.sql'))
  await db.query("insert into public.danz_admin_permissions values($1,'events.manage'),($1,'codes.manage')",[B])
})
beforeEach(async()=>{await db.exec('begin')})
afterEach(async()=>{await db.exec('rollback')})
after(async()=>{await db.close()})
async function user<T>(id:string|null,aal:string,fn:()=>Promise<T>,role='authenticated'){
  assert.ok(['authenticated','anon'].includes(role)); await db.exec(`set local role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,aal,user_metadata:{is_admin:true}})])
  try{return await fn()}finally{try{await db.exec('reset role')}catch{/* Rollback below restores the role after an unexpected SQL failure. */}}
}
async function denied(query:string,args:unknown[]=[],code='42501'){
  await db.exec('savepoint denial')
  try{await assert.rejects(()=>db.query(query,args),(e:any)=>e.code===code)}finally{await db.exec('rollback to savepoint denial;release savepoint denial')}
}
const save=(status='draft',title='Synthetic new event')=>db.query('select * from public.danz_admin_save_event($1,$2,$3,$4,$5)',[E,title,'2027-01-01T22:00:00Z','2027-01-02T06:00:00Z',status])
const issue=()=>db.query('select * from public.danz_admin_issue_code($1,$2,$3,$4,$5)',[E,C,hash,'2027-01-03T00:00:00Z',2])

test('guests, attendees and aal1 admins cannot access administrative RPCs',async()=>{
  for(const [id,aal,role] of [[null,'aal2','anon'],[null,'aal2','authenticated'],[A,'aal2','authenticated'],[B,'aal1','authenticated']] as const){
    await user(id,aal,async()=>{
      await denied('select * from public.danz_admin_events()')
      await denied('select * from public.danz_admin_save_event($1,$2,null,null,$3)',[E,'Forbidden','draft'])
      await denied('select * from public.danz_admin_issue_code($1,$2,$3,$4,2)',[E,C,hash,'2027-01-03'])
      await denied('select * from public.danz_admin_revoke_code($1)',[C])
    },role)
  }
})
test('MFA is not a substitute for membership; scopes cannot be self-assigned',async()=>{
  await user(A,'aal2',async()=>{
    assert.deepEqual((await db.query('select * from public.danz_admin_context()')).rows,[{is_admin:false,permissions:[]}])
    await denied("insert into public.danz_admin_permissions values($1,'events.manage')",[A])
    await denied('insert into public.danz_admins(user_id) values($1)',[A])
    assert.equal((await db.query('select * from public.danz_admin_permissions')).rows.length,0)
  })
})
test('an authorized admin can create, publish, archive and update one event idempotently',async()=>{
  await user(B,'aal2',async()=>{
    await save(); await save('published','Public title'); await save('archived','Archived title')
    const rows=await db.query<{id:string;status:string;title:string}>('select * from public.danz_admin_events()')
    assert.equal(rows.rows.filter(e=>e.id===E).length,1)
    assert.equal(rows.rows.find(e=>e.id===E)?.title,'Archived title')
    assert.equal(rows.rows.find(e=>e.id===E)?.status,'archived')
    await denied('delete from public.danz_events where id=$1',[E])
    await denied("insert into public.danz_events(title) values('Direct insert')")
  })
})
test('invalid titles, statuses and dates are rejected by the server',async()=>{
  await user(B,'aal2',async()=>{
    for(const [title,start,end,status] of [[' ',null,null,'draft'],['x'.repeat(121),null,null,'draft'],['Test',null,null,'published'],['Test','2027-01-02','2027-01-01','draft'],['Test',null,null,'wrong']]){
      await denied('select * from public.danz_admin_save_event($1,$2,$3,$4,$5)',[E,title,start,end,status],'22023')
    }
  })
})
test('separate scopes constrain events and codes; removal takes effect without a new JWT',async()=>{
  await db.query("delete from public.danz_admin_permissions where user_id=$1 and permission='codes.manage'",[B])
  await user(B,'aal2',async()=>{await save();await denied('select * from public.danz_admin_codes($1)',[E])})
  await db.query('delete from public.danz_admin_permissions where user_id=$1',[B])
  await db.query("insert into public.danz_admin_permissions values($1,'codes.manage')",[B])
  await user(B,'aal2',async()=>{
    await denied('select * from public.danz_admin_save_event($1,$2,null,null,$3)',[E,'Changed','draft'])
    await issue();assert.equal((await db.query('select * from public.danz_admin_codes($1)',[E])).rows.length,1)
  })
  await db.query('delete from public.danz_admins where user_id=$1',[B])
  await user(B,'aal2',async()=>{await denied('select * from public.danz_admin_events()')})
})
test('issuing the same request twice stores only its hash and preserves capacity',async()=>{
  await user(B,'aal2',async()=>{
    await save('published');await issue();await issue()
    const rows=await db.query<{code_hash?:string;used_count:number}>('select * from public.danz_admin_codes($1)',[E])
    assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].used_count,0);assert.ok(!('code_hash' in rows.rows[0]))
    await denied('select * from public.danz_event_access_codes')
  })
  assert.equal((await db.query<{code_hash:string}>('select code_hash from public.danz_event_access_codes where id=$1',[C])).rows[0].code_hash,hash)
})
test('expiry, malformed hashes, invalid capacity and conflicting retries are rejected',async()=>{
  await user(B,'aal2',async()=>{
    await save('published')
    for(const [codeHash,expiry,limit] of [[hash,'2020-01-01',1],['plaintext','2027-01-03',1],[hash,'2027-01-03',0],[hash,null,1]]){
      await denied('select * from public.danz_admin_issue_code($1,$2,$3,$4,$5)',[E,C,codeHash,expiry,limit],'22023')
    }
    await issue()
    await denied('select * from public.danz_admin_issue_code($1,$2,$3,$4,3)',[E,C,hash,'2027-01-03'],'22023')
  })
})
test('revocation blocks new canjes but preserves existing stamps and used_count',async()=>{
  await user(B,'aal2',async()=>{await save('published');await issue()})
  await user(A,'aal1',async()=>{assert.equal((await db.query<{status:string}>('select * from public.danz_redeem_event_code($1)',['SYNTHETICADMINACCESS12345'])).rows[0].status,'granted')})
  await user(B,'aal2',async()=>{await db.query('select * from public.danz_admin_revoke_code($1)',[C]);await db.query('select * from public.danz_admin_revoke_code($1)',[C])})
  await user(B,'aal1',async()=>{assert.equal((await db.query<{status:string}>('select * from public.danz_redeem_event_code($1)',['SYNTHETICADMINACCESS12345'])).rows[0].status,'unavailable')})
  await user(A,'aal1',async()=>{assert.equal((await db.query<{status:string}>('select * from public.danz_redeem_event_code($1)',['SYNTHETICADMINACCESS12345'])).rows[0].status,'already_attended')})
  assert.equal((await db.query<{used_count:number}>('select used_count from public.danz_event_access_codes where id=$1',[C])).rows[0].used_count,1)
})
