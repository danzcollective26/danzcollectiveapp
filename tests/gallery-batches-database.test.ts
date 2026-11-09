import assert from 'node:assert/strict'
import { before, beforeEach, afterEach, after, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002'
const E='20000000-0000-4000-8000-000000000001', OTHER='20000000-0000-4000-8000-000000000002'
const P='30000000-0000-4000-8000-000000000010', NEXT='30000000-0000-4000-8000-000000000011'
const hash='a'.repeat(64)
const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),'utf8')
before(async()=>{
  await db.exec(await read('supabase/tests/platform.sql'))
  await db.exec("alter table storage.objects add column metadata jsonb; create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$")
  await db.exec(await read('supabase/tests/baseline.sql'))
  const files=await readdir(new URL('../supabase/migrations/',import.meta.url))
  for(const suffix of ['_danz_private_gallery_client_access.sql','_danz_event_passport.sql','_danz_admin_events_codes.sql','_danz_gallery_batches.sql']) {
    const found=files.filter(f=>f.endsWith(suffix)); assert.equal(found.length,1)
    await db.exec(await read(`supabase/migrations/${found[0]}`))
  }
  await db.exec(await read('supabase/tests/data.sql'))
  await db.query("insert into public.danz_admin_permissions values($1,'events.manage')",[B])
})
beforeEach(()=>db.exec('begin'))
afterEach(()=>db.exec('rollback'))
after(()=>db.close())
async function user<T>(id:string|null,aal:string,fn:()=>Promise<T>,role='authenticated'){
  await db.exec(`set local role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,aal,user_metadata:{is_admin:true}})])
  try{return await fn()}finally{await db.exec('reset role')}
}
async function denied(sql:string,args:unknown[]=[],code='42501') {
  await db.exec('savepoint denial')
  try{await assert.rejects(()=>db.query(sql,args),(e:any)=>e.code===code)}finally{await db.exec('rollback to savepoint denial; release savepoint denial')}
}
type Slot={id:string;storage_path:string;preview_path:string;upload_ready:boolean;original_exists:boolean;preview_exists:boolean}
const prepare=(id=P,sum=hash,event=E,size=1000,preview=100)=>db.query<Slot>('select * from public.danz_prepare_photo($1,$2,$3,$4,$5,$6,$7)',[event,id,'Watermarked JPG.jpg',size,preview,'image/jpeg',sum])
async function objects(slot:Slot,size=1000,preview=100){
  await db.query("insert into storage.objects(bucket_id,name,metadata) values('danz-event-photos',$1,$2),('danz-event-photos',$3,$4)",[slot.storage_path,JSON.stringify({size}),slot.preview_path,JSON.stringify({size:preview})])
}
test('gallery RPCs require membership, scope and MFA; forged user metadata does not grant access',async()=>{
  for(const [id,aal,role] of [[null,'aal2','anon'],[A,'aal2','authenticated'],[B,'aal1','authenticated']] as const) {
    await user(id,aal,async()=>{
      await denied('select * from public.danz_gallery_usage()')
      await denied('select * from public.danz_admin_photos($1,0)',[E])
      await denied('select * from public.danz_prepare_photo($1,$2,$3,1000,100,$4,$5)',[E,P,'Photo.jpg','image/jpeg',hash])
      await denied('select public.danz_photo_state($1,$2,$3)',[E,[P],'published'])
    },role)
  }
})
test('reservation is idempotent by checksum, stays a draft and charges space once',async()=>{
  await user(B,'aal2',async()=>{
    const slot=(await prepare()).rows[0]
    const again=(await prepare(NEXT)).rows[0]
    assert.equal(again.id,slot.id); assert.equal(slot.upload_ready,false)
    assert.equal((await db.query<{used_bytes:number}>('select * from public.danz_gallery_usage()')).rows[0].used_bytes,1100)
    const list=(await db.query<{status:string}>('select * from public.danz_admin_photos($1,0)',[E])).rows
    assert.equal(list.find((p:any)=>p.id===P)?.status,'draft')
  })
  await user(A,'aal1',async()=>{assert.equal((await db.query('select id from public.danz_photos where id=$1',[P])).rows.length,0)})
})
test('only the reserved admin can upload exact object paths; attendees cannot read draft originals or previews',async()=>{
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0])
  await user(A,'aal1',async()=>{await denied("insert into storage.objects(bucket_id,name) values('danz-event-photos',$1)",[slot.storage_path])})
  await user(B,'aal1',async()=>{await denied("insert into storage.objects(bucket_id,name) values('danz-event-photos',$1)",[slot.storage_path])})
  await user(B,'aal2',async()=>{
    await denied("insert into storage.objects(bucket_id,name) values('danz-event-photos','unreserved.jpg')")
    await objects(slot)
    await db.query('select public.danz_finish_photo($1)',[slot.id])
    await denied("insert into storage.objects(bucket_id,name) values('danz-event-photos',$1)",[slot.storage_path])
  })
  await user(A,'aal1',async()=>{assert.equal((await db.query('select name from storage.objects where name=$1 or name=$2',[slot.storage_path,slot.preview_path])).rows.length,0)})
})
test('incomplete or mismatched uploads cannot finish or publish',async()=>{
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0])
  await user(B,'aal2',async()=>{
    await denied('select public.danz_finish_photo($1)',[P],'22023')
    await denied('select public.danz_photo_state($1,$2,$3)',[E,[P],'published'],'22023')
    await objects(slot,999)
    await denied('select public.danz_finish_photo($1)',[P],'22023')
  })
})
test('published originals and previews are private to attendees and survive event archival',async()=>{
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0])
  await objects(slot)
  await user(B,'aal2',async()=>{await db.query('select public.danz_finish_photo($1)',[P]); await db.query('select public.danz_photo_state($1,$2,$3)',[E,[P],'published'])})
  await db.query("update public.danz_events set status='archived' where id=$1",[E])
  await user(A,'aal1',async()=>{
    assert.equal((await db.query('select id from public.danz_events where id=$1',[E])).rows.length,1)
    assert.equal((await db.query('select id from public.danz_photos where id=$1',[P])).rows.length,1)
    assert.equal((await db.query('select name from storage.objects where name=$1 or name=$2',[slot.storage_path,slot.preview_path])).rows.length,2)
  })
  await user(B,'aal1',async()=>{assert.equal((await db.query('select name from storage.objects where name=$1 or name=$2',[slot.storage_path,slot.preview_path])).rows.length,0)})
  await user(B,'aal2',async()=>{await db.query('select public.danz_photo_state($1,$2,$3)',[E,[P],'quarantined'])})
  await user(A,'aal1',async()=>{assert.equal((await db.query('select name from storage.objects where name=$1 or name=$2',[slot.storage_path,slot.preview_path])).rows.length,0)})
})
test('budget includes existing objects and pending reservations without double counting uploads',async()=>{
  await db.query("insert into storage.objects(bucket_id,name,metadata) values('other-bucket','synthetic-cost', $1)",[JSON.stringify({size:899998000})])
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0])
  await user(B,'aal2',async()=>{await denied('select * from public.danz_prepare_photo($1,$2,$3,1000,100,$4,$5)',[E,NEXT,'Second.jpg','image/jpeg','b'.repeat(64)],'54000')})
  await objects(slot)
  await user(B,'aal2',async()=>{
    assert.equal((await db.query<{used_bytes:number}>('select * from public.danz_gallery_usage()')).rows[0].used_bytes,899999100)
    await db.query('select public.danz_finish_photo($1)',[P])
    assert.equal((await db.query<{used_bytes:number}>('select * from public.danz_gallery_usage()')).rows[0].used_bytes,899999100)
  })
})
test('wrong event, conflicting content and out-of-range file sizes cannot be published or reserved',async()=>{
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0]); await objects(slot)
  await user(B,'aal2',async()=>{
    await denied('select * from public.danz_prepare_photo($1,$2,$3,1000,100,$4,$5)',[OTHER,P,'Other.jpg','image/jpeg',hash],'22023')
    await denied('select * from public.danz_prepare_photo($1,$2,$3,26214401,100,$4,$5)',[E,NEXT,'Huge.jpg','image/jpeg','b'.repeat(64)],'22023')
    await db.query('select public.danz_finish_photo($1)',[P])
    await denied('select public.danz_photo_state($1,$2,$3)',[OTHER,[P],'published'],'22023')
  })
})
test('removing the administrative scope immediately stops reserved uploads and management',async()=>{
  const slot=await user(B,'aal2',async()=>(await prepare()).rows[0])
  await db.query('delete from public.danz_admin_permissions where user_id=$1',[B])
  await user(B,'aal2',async()=>{
    await denied('select * from public.danz_gallery_usage()')
    await denied("insert into storage.objects(bucket_id,name) values('danz-event-photos',$1)",[slot.storage_path])
  })
})
