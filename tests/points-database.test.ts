import assert from 'node:assert/strict'
import { before, beforeEach, afterEach, after, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002', E='20000000-0000-4000-8000-000000000001'
const read=(p:string)=>readFile(new URL(`../${p}`,import.meta.url),'utf8')
before(async()=>{
 await db.exec(await read('supabase/tests/platform.sql'))
 await db.exec("create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$")
 await db.exec(await read('supabase/tests/baseline.sql'))
 const files=await readdir(new URL('../supabase/migrations',import.meta.url))
 for(const suffix of ['_danz_private_gallery_client_access.sql','_danz_event_passport.sql','_danz_admin_events_codes.sql','_danzpoints_event_pilot.sql']){
  const names=files.filter(f=>f.endsWith(suffix));assert.equal(names.length,1);await db.exec(await read(`supabase/migrations/${names[0]}`))
 }
 await db.exec(await read('supabase/tests/data.sql'))
 await db.query("insert into public.danz_admin_permissions values($1,'events.manage')",[B])
})
beforeEach(async()=>{
 await db.exec('begin;delete from public.danz_attendance')
 await db.query("update public.danz_events set starts_at='2026-11-13T00:00:00+01',status='published' where id=$1",[E])
 await db.query('insert into public.danz_attendance(user_id,event_id) values($1,$2)',[A,E])
})
afterEach(async()=>{await db.exec('rollback')});after(async()=>{await db.close()})
async function user<T>(id:string|null,fn:()=>Promise<T>,aal='aal1',role='authenticated'){
 await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,aal,user_metadata:{is_admin:true}})])
 try{return await fn()}finally{try{await db.exec('reset role')}catch{/* Preserve the original SQL error for diagnosis. */}}
}
async function denied(sql:string,args:unknown[]=[],code='42501'){
 await db.exec('savepoint denial');try{await assert.rejects(()=>db.query(sql,args),(e:any)=>e.code===code)}finally{await db.exec('rollback to savepoint denial;release savepoint denial')}
}
const summary=async()=> (await db.query<{value:any}>('select public.danz_points_summary() as value')).rows[0].value
const purchase=(code:string,reference:string,amount:number)=>db.query<{id:string}>('select public.danz_points_purchase($1,$2,$3,$4) as id',[E,code,reference,amount])

test('attendance comes from a server stamp; another account and a test date cannot claim it',async()=>{
 const a=await user(A,summary);assert.equal(a.available+a.pending,1000);assert.match(a.code,/^DNZ-[A-F0-9]{12}$/)
 const b=await user(B,summary);assert.equal(b.available+b.pending,0)
 await user(A,async()=>{assert.equal((await db.query('select * from public.danz_points_accounts')).rows.length,1);await denied('insert into public.danz_attendance(user_id,event_id) values($1,$2)',[B,E])})
 await db.query("update public.danz_events set starts_at='2026-11-12T00:00:00+01' where id=$1",[E]);assert.equal((await user(A,summary)).events.length,0)
})
test('only scoped MFA administration can register a verified purchase; clients cannot self-award',async()=>{
 const a=await user(A,summary)
 await user(A,()=>denied('select public.danz_points_purchase($1,$2,$3,2000)',[E,a.code,'test']))
 await user(B,()=>denied('select public.danz_points_purchase($1,$2,$3,2000)',[E,a.code,'test']))
 await user(null,()=>denied('select public.danz_points_summary()'), 'aal1','anon')
 await user(A,()=>denied("insert into public.danz_points_receipts(event_id,user_id,reference,amount_cents,created_by) values($1,$2,'fake',2000,$2)",[E,A]))
})
test('purchases are idempotent, scale with price, cap at 600 per event and recalculate after a void',async()=>{
 const a=await user(A,summary)
 const first=await user(B,()=>purchase(a.code,'ticket-1',2000),'aal2');const retry=await user(B,()=>purchase(a.code,'ticket-1',2000),'aal2');assert.equal(first.rows[0].id,retry.rows[0].id)
 assert.equal((await user(A,summary)).events[0].clothing,100)
 await user(B,()=>purchase(a.code,'ticket-2',4000),'aal2');assert.equal((await user(A,summary)).events[0].clothing,300)
 const last=await user(B,()=>purchase(a.code,'ticket-3',30000),'aal2');const capped=await user(A,summary);assert.equal(capped.events[0].clothing,600);assert.ok(capped.events[0].attendance>capped.events[0].clothing)
 await user(B,()=>denied('select public.danz_points_purchase($1,$2,$3,3000)',[E,a.code,'ticket-1'],'22023'),'aal2')
 await user(B,()=>db.query('select public.danz_points_void($1)',[last.rows[0].id]),'aal2');assert.equal((await user(A,summary)).events[0].clothing,300)
})
test('suggestions are private, idempotent, cannot grant points and have a per-account limit',async()=>{
 const id='70000000-0000-4000-8000-000000000001';const send=()=>db.query('select public.danz_points_suggest($1,$2,$3)',[id,'reward','Una recompensa de prueba'])
 await user(A,send);await user(A,send);assert.equal((await db.query('select * from public.danz_points_suggestions')).rows.length,1)
 await user(B,async()=>{assert.equal((await db.query('select * from public.danz_points_suggestions')).rows.length,0);await denied('select public.danz_points_suggest($1,$2,$3)',[id,'reward','Una recompensa de prueba'],'22023')})
 await user(A,async()=>{for(let i=2;i<=5;i++)await db.query("select public.danz_points_suggest($1,'other','Otra propuesta de prueba')",[`70000000-0000-4000-8000-${String(i).padStart(12,'0')}`]);await denied("select public.danz_points_suggest(gen_random_uuid(),'other','Una propuesta adicional')",[],'54000')})
 assert.equal((await user(A,summary)).available+(await user(A,summary)).pending,1000)
})
