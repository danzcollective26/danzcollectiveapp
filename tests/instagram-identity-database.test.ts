import assert from 'node:assert/strict'
import{before,beforeEach,afterEach,after,test}from'node:test'
import{readFile,readdir}from'node:fs/promises'
import{PGlite}from'@electric-sql/pglite'
const db=new PGlite(),A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002'
const read=(p:string)=>readFile(new URL(`../${p}`,import.meta.url),'utf8')
before(async()=>{
 await db.exec(await read('supabase/tests/platform.sql'));await db.exec("alter table auth.users add column email text,add column email_confirmed_at timestamptz;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$");await db.exec(await read('supabase/tests/baseline.sql'))
 const files=await readdir(new URL('../supabase/migrations',import.meta.url));for(const suffix of ['_danz_private_gallery_client_access.sql','_danz_event_passport.sql','_danz_admin_events_codes.sql','_danzpoints_event_pilot.sql','_danz_snake_competition.sql']){const f=files.find(f=>f.endsWith(suffix));let sql=await read(`supabase/migrations/${f}`);if(suffix==='_danz_snake_competition.sql'){await db.exec('create schema cron;create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$');sql=sql.replace('create extension if not exists pg_cron;','-- Platform cron fixture')}await db.exec(sql)}
 const f=files.find(f=>f.endsWith('_danz_snake_podium_identity.sql'));await db.exec(await read(f?`supabase/migrations/${f}`:'supabase/proposals/snake_podium_identity.sql'));await db.exec(await read('supabase/tests/data.sql'));await db.query("update auth.users set email='confirmed@example.invalid',email_confirmed_at=now()");await db.query("insert into public.danz_admin_permissions values($1,'events.manage')",[B])
})
beforeEach(async()=>{await db.exec('begin')});afterEach(async()=>{await db.exec('rollback')});after(async()=>{await db.close()})
async function user<T>(id:string|null,fn:()=>Promise<T>,aal='aal1',role='authenticated'){
 await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,aal,is_anonymous:false,user_metadata:{instagram_verified:true}})]);try{return await fn()}finally{await db.exec('reset role')}
}
async function denied(sql:string,args:unknown[]=[],code='42501'){
 await db.exec('savepoint denied');try{await assert.rejects(()=>db.query(sql,args),(e:any)=>e.code===code)}finally{await db.exec('rollback to savepoint denied;release savepoint denied')}
}
const status=async()=>(await db.query<{v:any}>('select public.danz_identity_status() v')).rows[0].v
const request=async(handle='miembro_qa')=>(await db.query<{v:any}>('select public.danz_instagram_request($1) v',[handle])).rows[0].v
const summary=async()=>(await db.query<{v:any}>('select public.danz_points_summary() v')).rows[0].v
const review=(id:string,code:string,approve=true)=>db.query('select public.danz_instagram_review($1,$2,$3)',[id,code,approve])
async function verify(id=A,handle='miembro_qa'){const r=await user(id,()=>request(handle));await user(B,()=>review(id,r.code),'aal2');return r}

test('typed Instagram handles and editable metadata never verify an account; confirmed email is required',async()=>{
 assert.equal((await user(A,status)).verified,false)
 await user(A,()=>denied("select public.danz_snake_start(gen_random_uuid(),'classic','Alias')"))
 await db.query('update auth.users set email_confirmed_at=null where id=$1',[A]);await user(A,()=>denied("select public.danz_instagram_request('miembro_qa')"));assert.equal((await user(A,status)).emailVerified,false)
 await user(null,()=>denied('select public.danz_identity_status()'),'aal1','anon')
})
test('requests are normalized, idempotent, private and never self-approved',async()=>{
 const r=await user(A,()=>request('@Miembro_QA'));assert.equal(r.handle,'miembro_qa');assert.match(r.code,/^DANZ-[A-F0-9]{10}$/);assert.deepEqual(await user(A,()=>request('miembro_qa')),r);assert.equal(r.verified,false)
 assert.equal((await user(B,status)).code,null)
 await user(A,async()=>{await denied('select * from danz_private.instagram_links');await denied("update danz_private.instagram_links set status='verified' where user_id=$1",[A]);await denied('select danz_private.identity_ready()');await denied("select danz_private.snake_start_game(gen_random_uuid(),'classic','Alias')");await denied('select danz_private.points_earned_summary()')})
})
test('only scoped MFA staff can approve exact current evidence and attach it to the profile',async()=>{
 const r=await user(A,()=>request());await user(A,()=>denied('select public.danz_instagram_review($1,$2,true)',[A,r.code]),'aal2');await user(B,()=>denied('select public.danz_instagram_review($1,$2,true)',[A,r.code]));await user(B,()=>denied("select public.danz_instagram_review($1,'DANZ-WRONGCODE',true)",[A],'22023'),'aal2')
 await user(B,()=>review(A,r.code),'aal2');await user(B,()=>review(A,r.code),'aal2');assert.equal((await user(A,status)).verified,true);assert.equal((await db.query<any>('select instagram_handle from public.danz_profiles where user_id=$1',[A])).rows[0].instagram_handle,'miembro_qa')
 await user(A,()=>denied('select public.danz_instagram_admin()'))
})
test('earned points stay reserved until email and Instagram are verified, and return to reserved after profile changes',async()=>{
 await db.query("insert into danz_private.snake_weeks(week_start,place,user_id,alias,score,points,reason,reward_year) values('2025-01-06',1,$1,'Fixture',100,50,'awarded',2025)",[A]);const before=await user(A,summary);assert.equal(before.available,0);assert.equal(before.pending,50);assert.equal(before.identityVerified,false)
 await verify();const after=await user(A,summary);assert.equal(after.available,50);assert.equal(after.pending,0);assert.equal(after.identityVerified,true)
 await user(A,()=>db.query("update public.danz_profiles set instagram_handle='otro_usuario' where user_id=$1",[A]));const changed=await user(A,status);assert.equal(changed.verified,false);assert.equal(changed.status,'changed');const held=await user(A,summary);assert.equal(held.available,0);assert.equal(held.pending,50)
})
test('verified accounts can start and submit, but changing the profile cannot bypass the gate',async()=>{
 await verify();const r=(await user(A,()=>db.query<{v:any}>("select public.danz_snake_start(gen_random_uuid(),'classic','Miembro') v"))).rows[0].v;await db.query("update danz_private.snake_runs set started_at=clock_timestamp()-interval '10 seconds' where id=$1",[r.id])
 await user(A,()=>db.query("update public.danz_profiles set instagram_handle=null where user_id=$1",[A]));await user(A,()=>denied("select public.danz_snake_submit($1,'RRRR')",[r.id]));await user(A,()=>db.query("update public.danz_profiles set instagram_handle='miembro_qa' where user_id=$1",[A]));assert.equal((await user(A,()=>db.query<{v:any}>("select public.danz_snake_submit($1,'RRRR') v",[r.id]))).rows[0].v.score,10)
})
test('one verified Instagram can belong to only one account even when two pending requests race',async()=>{
 const a=await user(A,()=>request('compartido')),b=await user(B,()=>request('compartido'));await user(B,()=>review(A,a.code),'aal2');await user(B,()=>denied('select public.danz_instagram_review($1,$2,true)',[B,b.code],'22023'),'aal2');assert.equal((await user(A,status)).verified,true);assert.equal((await user(B,status)).verified,false)
})
test('stale, rejected and expired requests cannot be approved and daily changes are bounded',async()=>{
 const a=await user(A,()=>request('primero'));const b=await user(A,()=>request('segundo'));assert.notEqual(a.code,b.code);await user(B,()=>denied('select public.danz_instagram_review($1,$2,true)',[A,a.code],'22023'),'aal2');await user(B,()=>review(A,b.code,false),'aal2');assert.equal((await user(A,status)).status,'rejected')
 for(const h of ['tercero','cuarto','quinto'])await user(A,()=>request(h));await user(A,()=>denied("select public.danz_instagram_request('sexto')",[],'54000'))
 const current=await user(A,status);await db.query("update danz_private.instagram_links set requested_at=clock_timestamp()-interval '8 days' where user_id=$1",[A]);await user(B,()=>denied('select public.danz_instagram_review($1,$2,true)',[A,current.code],'22023'),'aal2')
})
