import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {tasks,visualWrittenOutcome} from '../src/visual.js';
const uid='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
test('visual migration preserves old work, permits MAX immediately, and saves authoritative branch outcomes',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
 for(const file of ['schema.sql','outcomes.sql','002-writing-and-dialogue.sql'])await db.exec(readFileSync(new URL('../backend/'+file,import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1,$2),($3,$4)',[uid,'teacher@example.test',other,'student@example.test']);
 const course=async code=>(await db.query('insert into public.oracle_courses(name,join_code,instructor_id) values($1,$1,$2) returning id',[code,uid])).rows[0].id;
 const old=await course('old-edition-test-code');
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.query("select public.join_course('old-edition-test-code')");
 const previous=(await db.query('select public.submit_written_task($1,1,$2) as r',[old,'My earlier work must remain unchanged.'])).rows[0].r;
 await db.exec('reset role');await db.exec(readFileSync(new URL('../backend/003-visual-max.sql',import.meta.url),'utf8'));
 // Migration is safe to apply twice.
 await db.exec(readFileSync(new URL('../backend/003-visual-max.sql',import.meta.url),'utf8'));
 await db.exec('set role authenticated');
 assert.deepEqual((await db.query('select public.my_progress($1) as r',[old])).rows[0].r.entries[0],previous);
 assert.deepEqual((await db.query('select public.submit_visual_task($1,1,$2) as r',[old,'This cannot overwrite prior work.'])).rows[0].r,previous);
 await assert.rejects(()=>db.query('select public.submit_visual_task($1,2,$2)',[old,'This would mix editions.']),/earlier version/);
 for(const route of [0,1,2]){
  await db.exec('reset role');const code='visual-route-'+route;const c=await course(code);await db.exec('set role authenticated');await db.query('select public.join_course($1)',[code]);
  await assert.rejects(()=>db.query('select public.submit_visual_task($1,2,$2)',[c,'Try to skip the first task.']),/in order/);
  if(route===0){const request=crypto.randomUUID();assert.equal((await db.query('select public.reserve_oracle_dialogue($1,$2,$3) as r',[c,request,'MAX, how do I begin my first assignment?'])).rows[0].r.allowed,true);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);await assert.rejects(()=>db.query('select public.my_oracle_dialogue($1)',[c]),/Join/);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);}
  for(const task of tasks){const response='Visual edition 3 · '+task.title+'\nMy detailed observation is recorded.';const result=(await db.query('select public.submit_visual_task($1,$2,$3,$4) as r',[c,task.id,response,task.id===7?route:null])).rows[0].r;assert.deepEqual(result,visualWrittenOutcome(task,response,route,task.id>7?route:-1));}
  const progress=(await db.query('select public.my_progress($1) as r',[c])).rows[0].r;assert.equal(progress.entries.length,9);
  assert.equal(progress.entries.reduce((s,e)=>s+e.paid,0),route===0?36:24);
  await db.query('select public.finish_game($1,$2)',[c,'I contributed observations and judgments to building the Oracle. My work has value.']);
  const roster=(await db.query('select public.instructor_records() as r')).rows[0].r;assert.ok(roster.some(r=>r.course_name===code&&r.completed_at&&r.responses.length===9));
 }
 await db.exec('reset role; set role anon');await assert.rejects(()=>db.query('select public.submit_visual_task($1,1,$2)',[old,'An anonymous submission should fail.']),/permission denied/);
 }finally{await db.close();}
});
