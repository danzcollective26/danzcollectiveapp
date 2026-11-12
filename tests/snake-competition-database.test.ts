import assert from 'node:assert/strict'
import { before,beforeEach,afterEach,after,test } from 'node:test'
import { readFile,readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { gameReducer,initialGame,mazeWalls,type Direction } from '../src/snake.ts'
const db=new PGlite(),A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002',C='10000000-0000-4000-8000-000000000003'
const read=(p:string)=>readFile(new URL(`../${p}`,import.meta.url),'utf8')
before(async()=>{
 await db.exec(await read('supabase/tests/platform.sql'));await db.exec('alter table auth.users add column email text,add column email_confirmed_at timestamptz');await db.exec("create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$");await db.exec(await read('supabase/tests/baseline.sql'))
 const files=await readdir(new URL('../supabase/migrations',import.meta.url))
 for(const suffix of ['_danz_private_gallery_client_access.sql','_danz_event_passport.sql','_danz_admin_events_codes.sql','_danzpoints_event_pilot.sql'])await db.exec(await read(`supabase/migrations/${files.find(f=>f.endsWith(suffix))}`))
 await db.exec(await read('supabase/tests/data.sql'));await db.exec('create schema cron;create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$')
 const file=files.find(f=>f.endsWith('_danz_snake_competition.sql')),sql=await read(file?`supabase/migrations/${file}`:'supabase/proposals/snake_competition.sql');await db.exec(sql.replace('create extension if not exists pg_cron;','-- Hosted cron dependency checked separately.'))
 const podium=files.find(f=>f.endsWith('_danz_snake_podium_identity.sql'));await db.exec(await read(podium?`supabase/migrations/${podium}`:'supabase/proposals/snake_podium_identity.sql'));await db.query('insert into auth.users(id) values($1)',[C])
 for(const [id,handle] of [[A,'fixture_a'],[B,'fixture_b'],[C,'fixture_c']]){await db.query("update auth.users set email=$2,email_confirmed_at=now() where id=$1",[id,handle+'@example.invalid']);await db.query("insert into danz_private.instagram_links(user_id,handle,status,challenge,verified_at) values($1,$2,'verified','local-fixture',now())",[id,handle]);await db.query('insert into public.danz_profiles(user_id,instagram_handle) values($1,$2) on conflict(user_id) do update set instagram_handle=excluded.instagram_handle',[id,handle])}
})
beforeEach(async()=>{await db.exec('begin')});afterEach(async()=>{await db.exec('rollback')});after(async()=>{await db.close()})
async function user<T>(id:string|null,fn:()=>Promise<T>,role='authenticated'){
 await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,aal:'aal1',is_anonymous:false})]);try{return await fn()}finally{await db.exec('reset role')}
}
async function denied(sql:string,args:unknown[]=[],code='42501'){
 await db.exec('savepoint denied');try{await assert.rejects(()=>db.query(sql,args),(e:any)=>e.code===code)}finally{await db.exec('rollback to savepoint denied;release savepoint denied')}
}
const start=async(id=crypto.randomUUID(),mode='classic',alias='DJ de prueba')=>(await db.query<{v:any}>('select public.danz_snake_start($1,$2,$3) v',[id,mode,alias])).rows[0].v
const board=async(mode='classic',period='week')=>(await db.query<{v:any}>('select public.danz_snake_board($1,$2) v',[mode,period])).rows[0].v

test('only registered accounts can compete; private tables, replay and settlement remain inaccessible',async()=>{
 await user(null,()=>denied("select public.danz_snake_board('classic','week')"),'anon')
 await user(A,async()=>{await denied('select * from danz_private.snake_runs');await denied('select * from danz_private.snake_weeks');await denied('select danz_private.snake_settle()');await denied("select danz_private.snake_replay(1,'classic','RRRR')");await db.query("select set_config('request.jwt.claims','{\"is_anonymous\":true}',true)");await denied("select public.danz_snake_board('classic','week')")})
})
test('challenges enforce owner, request identity, nickname privacy and one active game',async()=>{
 const id=crypto.randomUUID(),a=await user(A,()=>start(id));assert.ok(a.seed>0);assert.deepEqual(await user(A,()=>start(id)),a)
 await user(B,()=>denied("select public.danz_snake_start($1,'classic','DJ de prueba')",[id],'22023'));await user(B,()=>denied("select public.danz_snake_submit($1,'RRRR')",[id]))
 await user(A,()=>denied("select public.danz_snake_start(gen_random_uuid(),'classic','email@example.com')",[],'22023'));await user(A,()=>start());await user(A,()=>denied("select public.danz_snake_submit($1,'RRRR')",[id],'55000'))
})
test('server scores are replayed, retry-safe, private and reject impossible durations or expired tickets',async()=>{
 const r=await user(A,()=>start());await db.query("update danz_private.snake_runs set started_at=clock_timestamp()-interval '10 seconds' where id=$1",[r.id]);const send=()=>db.query<{v:any}>('select public.danz_snake_submit($1,$2) v',[r.id,'RRRR'])
 assert.equal((await user(A,send)).rows[0].v.score,10);assert.equal((await user(A,send)).rows[0].v.score,10);await user(A,()=>denied("select public.danz_snake_submit($1,'RRRRR')",[r.id],'22023'))
 assert.equal((await user(A,()=>board())).mine.score,10);const b=await user(B,()=>board());assert.equal(b.mine,null);assert.equal(b.rows[0].mine,false);assert.equal(JSON.stringify(b).includes(A),false)
 const fresh=await user(A,()=>start());await user(A,()=>denied("select public.danz_snake_submit($1,'RRRRRRRRRR')",[fresh.id],'22023'));await db.query("update danz_private.snake_runs set expires_at=clock_timestamp()-interval '1 second' where id=$1",[fresh.id]);await user(A,()=>denied("select public.danz_snake_submit($1,'RRRR')",[fresh.id],'55000'))
})
test('server/browser replay agrees through foods, collisions and transitions; all twelve maps match',async()=>{
 for(let stage=1;stage<=12;stage++)assert.deepEqual((await db.query<{v:number[]}>('select danz_private.snake_walls($1) v',[stage])).rows[0].v,mazeWalls(stage).map(p=>p.y*19+p.x))
 for(const mode of ['classic','maze'] as const)for(const seed of [1,12345,2147483646]){
  let game=gameReducer(initialGame(),{type:'ranked',mode,seed})
  for(let step=0;step<1300&&!game.over;step++){
   const dirs:Direction[]=['up','down','left','right'],path:[number,Direction[]][]=[[game.snake[0].y*19+game.snake[0].x,[]]],seen=new Set<number>();let route:Direction[]=[]
   while(path.length){const[cell,steps]=path.shift()!;if(seen.has(cell))continue;seen.add(cell);if(game.foods.some(f=>f.y*19+f.x===cell)){route=steps;break}for(const d of dirs){const x=cell%19+(d==='right'?1:d==='left'?-1:0),y=Math.floor(cell/19)+(d==='down'?1:d==='up'?-1:0);if(x<0||x>18||y<0||y>18||game.walls.some(p=>p.x===x&&p.y===y)||game.snake.slice(1,-1).some(p=>p.x===x&&p.y===y))continue;path.push([y*19+x,[...steps,d]])}}
   if(route[0])game=gameReducer(game,{type:'turn',direction:route[0]});game=gameReducer(game,{type:'tick',random:.77});if(game.levelUp)game=gameReducer(game,{type:'start'})
  }
  assert.ok(game.score>=50);const result=(await db.query<{v:any}>('select danz_private.snake_replay($1,$2,$3) v',[seed,mode,game.replay])).rows[0].v;assert.equal(result.score,game.score);assert.equal(result.stage,game.stage)
 }
 await denied("select danz_private.snake_replay(1,'classic','LR')",[],'22023');await denied("select danz_private.snake_replay(1,'classic','RRRRRRRRRRRR')",[],'22023')
})
async function historical(week:string,id=A,score=100,alias='Campeón'){
 await db.query("insert into danz_private.snake_runs(id,user_id,alias,mode,seed,week_start,started_at,expires_at,submitted_at,score,stage,replay_digest) values(gen_random_uuid(),$1,$2,'classic',1,$3::date,$3::date,$3::date+1,$3::date+interval '1 hour'+case when $2='Empate posterior' then interval '1 second' else interval '0 seconds' end,$4,1,'fixture')",[id,alias,week,score])
}
test('weekly payouts are idempotent and tie-safe, with a break after three paid wins',async()=>{
 for(const w of ['2025-03-03','2025-03-10','2025-03-17','2025-03-24','2025-03-31'])await historical(w);await historical('2025-03-03',B,100,'Empate posterior');await db.exec('select danz_private.snake_settle();select danz_private.snake_settle()')
 const w=(await db.query<any>('select * from danz_private.snake_weeks where user_id=$1 order by week_start',[A])).rows;assert.deepEqual(w.map(r=>r.points),[50,50,50,0,50]);assert.equal(w[0].user_id,A);assert.equal(w[3].reason,'streak-limit')
 const sum=(await user(A,()=>db.query<{v:any}>('select public.danz_points_summary() v'))).rows[0].v;assert.equal(sum.arcade,200);assert.equal(sum.available,200);assert.equal((await user(B,()=>db.query<{v:any}>('select public.danz_points_summary() v'))).rows[0].v.arcade,25)
})
test('annual awards stop at twenty and restart in the year of closure; maze has its own board',async()=>{
 for(let i=0;i<42;i+=2)await historical(new Date(Date.UTC(2024,0,1+i*7)).toISOString().slice(0,10));await historical('2024-12-30');await db.exec('select danz_private.snake_settle()')
 assert.deepEqual((await db.query<any>('select reward_year,sum(points)::integer as points,count(*) filter(where points>0)::integer as wins from danz_private.snake_weeks group by reward_year order by reward_year')).rows,[{reward_year:2024,points:1000,wins:20},{reward_year:2025,points:50,wins:1}])
 const r=await user(B,()=>start(crypto.randomUUID(),'maze'));await db.query("update danz_private.snake_runs set started_at=clock_timestamp()-interval '10 seconds' where id=$1",[r.id]);await user(B,()=>db.query("select public.danz_snake_submit($1,'RRRR')",[r.id]));assert.equal((await user(B,()=>board('maze'))).mine.score,10);assert.equal((await user(B,()=>board())).mine,null)
})

test('the podium awards 50/25/10 to three different accounts using each personal best',async()=>{
 await historical('2025-04-07',A,300);await historical('2025-04-07',A,350);await historical('2025-04-07',B,200,'Segundo');await historical('2025-04-07',C,100,'Tercero');await db.exec('select danz_private.snake_settle();select danz_private.snake_settle()')
 const rows=(await db.query<any>('select place,user_id,score,points from danz_private.snake_weeks order by place')).rows
 assert.deepEqual(rows,[{place:1,user_id:A,score:350,points:50},{place:2,user_id:B,score:200,points:25},{place:3,user_id:C,score:100,points:10}])
 for(const [id,points] of [[A,50],[B,25],[C,10]] as const){const s=(await user(id,()=>db.query<{v:any}>('select public.danz_points_summary() v'))).rows[0].v;assert.equal(s.arcade,points)}
})
test('streak limits follow the person even when they change podium position',async()=>{
 for(const [week,score] of [['2025-05-05',300],['2025-05-12',150],['2025-05-19',50],['2025-05-26',300]] as const){await historical(week,A,score);await historical(week,B,200,'Segundo');await historical(week,C,100,'Tercero')}
 await db.exec('select danz_private.snake_settle()')
 const rows=(await db.query<any>('select place,points,reason from danz_private.snake_weeks where user_id=$1 order by week_start',[A])).rows
 assert.deepEqual(rows.map(r=>r.place),[1,2,3,1]);assert.deepEqual(rows.map(r=>r.points),[50,25,10,0]);assert.equal(rows[3].reason,'streak-limit')
})
