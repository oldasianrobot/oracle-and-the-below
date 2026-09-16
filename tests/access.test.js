import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCode,newCode,newToken,hashToken,codeDigest} from '../supabase/functions/oracle-access/security.js';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {tasks,visualWrittenOutcome} from '../src/visual.js';
const teacher='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
test('codes use random words and four digits; normalized codes have keyed, domain-separated digests',async()=>{
 assert.equal(normalizeCode(' Otter LANTERN 4827 '),'otter-lantern-4827');
 const codes=new Set(Array.from({length:1000},newCode));assert.equal(codes.size,1000);
 for(const code of codes)assert.match(code,/^[a-z]+-[a-z]+-\d{4}$/);
 assert.equal(await codeDigest('OTTER LANTERN 4827','key1'),await codeDigest('otter-lantern-4827','key1'));
 assert.notEqual(await codeDigest('otter-lantern-4827','key1'),await codeDigest('otter-lantern-4827','key2'));
 assert.notEqual(await codeDigest('otter-lantern-4827','key1'),await hashToken('otter-lantern-4827'));
 assert.match(newToken(),/^[a-f0-9]{64}$/);
});
test('private access preserves work, isolates records, revokes sessions, and enforces limits and ownership',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
 for(const file of ['schema.sql','outcomes.sql','002-writing-and-dialogue.sql','003-visual-max.sql','004-private-access.sql'])await db.exec(readFileSync(new URL('../backend/'+file,import.meta.url),'utf8'));
 // Idempotent migration, no deletion of historical records.
 await db.exec(readFileSync(new URL('../backend/004-private-access.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1,$2),($3,$4)',[teacher,'teacher@example.test',other,'other@example.test']);
 const c=(await db.query("insert into public.oracle_courses(name,join_code,instructor_id) values('Code class','old-class-code-test',$1) returning id",[teacher])).rows[0].id;
 const participants=[0,1,2].map(()=>({id:crypto.randomUUID(),digest:newToken()}));
 const query=async(sql,args=[])=>(await db.query(sql,args)).rows[0]?.r;
 const manage=async(action,items=null,participant=null,who=teacher)=>query('select public.code_instructor($1,$2,$3,$4,$5) as r',[who,action,c,items,participant]);
 const login=async(digest,session)=>query('select public.code_login($1,$2) as r',[digest,session]);
 const student=async(session,action,payload={})=>query('select public.code_student($1,$2,$3) as r',[session,action,payload]);
 await db.exec('set role anon');await assert.rejects(()=>manage('records'),/permission denied/);await assert.rejects(()=>login('a'.repeat(64),'b'.repeat(64)),/permission denied/);
 await db.exec('reset role; set role authenticated');await assert.rejects(()=>student('a'.repeat(64),'progress'),/permission denied/);
 await db.exec('reset role; set role service_role');
 await assert.rejects(()=>manage('records',null,null,other),/Instructor/);
 const batch=await manage('create',participants);assert.equal(batch.length,3);assert.equal(batch[0].worker_label,'Worker 001');assert.ok(!JSON.stringify(batch).includes('digest'));
 assert.deepEqual(await manage('create',participants),batch);
 assert.match((await login(newToken(),newToken())).error,/not recognized/);
 const one=newToken(),two=newToken();await login(participants[0].digest,one);await login(participants[1].digest,two);
 assert.equal((await student(one,'progress')).worker_label,'Worker 001');
 assert.equal((await student(two,'progress')).entries.length,0);
 await assert.rejects(()=>student(newToken(),'progress'),/session has ended/);
 await assert.rejects(()=>student(one,'submit',{task:2,response:'Cannot skip the first task.'}),/in order/);
 await assert.rejects(()=>student(one,'finish',{reflection:'A long reflection still cannot replace doing all the assignments.'}),/nine/);
 const request=crypto.randomUUID();assert.equal((await student(one,'reserve',{request_id:request,message:'MAX, how should I begin the first task?'})).allowed,true);
 await assert.rejects(()=>student(two,'reserve',{request_id:request,message:'Try to read another worker message.'}),/unavailable/);
 await db.query('select public.code_finish_dialogue($1,$2)',[request,{reply:'Describe what you can see.',source:'authored'}]);
 assert.equal((await student(one,'reserve',{request_id:request,message:'MAX, how should I begin the first task?'})).cached.reply,'Describe what you can see.');
 assert.equal((await student(two,'dialogue')).length,0);
 // Both old and new paths count code-based requests against the global AI budget.
 await db.exec('reset role; update oracle_private.ai_limits set daily_limit=1; set role service_role');
 assert.match((await student(two,'reserve',{request_id:crypto.randomUUID(),message:'Another student asks for help.'})).reason,/daily/);
 await db.exec('reset role; update oracle_private.ai_limits set daily_limit=40; set role service_role');
 for(const task of tasks){const response='Visual edition 3 · '+task.title+'\nMy observation contributes useful detail.';const r=await student(one,'submit',{task:task.id,response,route:task.id===7?0:null,paid:99999,participant_id:participants[1].id});assert.deepEqual(r,visualWrittenOutcome(task,response,0,task.id>7?0:-1));}
 assert.equal((await student(two,'progress')).entries.length,0);
 assert.equal((await student(one,'totals')).paid,36);
 await student(one,'finish',{reflection:'I contributed careful observations and judgments. My work helped build the Oracle.'});
 const before=await student(one,'progress');assert.ok(before.completed_at);
 await student(one,'finish',{reflection:'A different reflection should not overwrite my original saved record.'});assert.deepEqual(await student(one,'progress'),before);
 const replacement=newToken();await manage('replace',{digest:replacement},participants[0].id);
 await assert.rejects(()=>student(one,'progress'),/session has ended/);assert.ok((await login(participants[0].digest,newToken())).error);
 const renewed=newToken();await login(replacement,renewed);assert.deepEqual(await student(renewed,'progress'),before);
 const records=await manage('records');assert.equal(records.records[0].tasks_completed,9);assert.equal(records.records[0].dialogue.length,1);assert.ok(!JSON.stringify(records).includes('code_digest'));
 await manage('disable',null,participants[1].id);await assert.rejects(()=>student(two,'progress'),/session has ended/);
 await student(renewed,'logout');await assert.rejects(()=>student(renewed,'progress'),/session has ended/);
 const expired=newToken();await login(participants[2].digest,expired);
 await db.exec("reset role; update oracle_private.code_sessions set expires_at=now()-interval '1 second'; set role service_role");await assert.rejects(()=>student(expired,'progress'),/session has ended/);
 for(let i=0;i<120;i++)assert.equal(await query('select public.code_login_budget() as r'),true);
 assert.equal(await query('select public.code_login_budget() as r'),false);
 await db.exec("reset role; update oracle_private.code_login_limits set window_start=now()-interval '2 minutes' where bucket='minute'; update oracle_private.code_login_limits set attempts=1000 where bucket='hour'; set role service_role");
 assert.equal(await query('select public.code_login_budget() as r'),false);
 }finally{await db.close();}
});
