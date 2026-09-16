import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {readFileSync} from 'node:fs';
import * as security from '../supabase/functions/oracle-access/security.js';
const source=transformSync(readFileSync(new URL('../supabase/functions/oracle-access/index.ts',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
function makeHandler({allowBudget=true,allowMessage=false}={}){
 let handler;const calls=[];let aiCalls=0;
 const env={SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'server-secret',ALLOWED_ORIGINS:'https://mleungphd.org'};
 const createClient=(url,key)=>({auth:{getUser:async token=>({data:{user:token==='teacher-token'?{id:'teacher'}:null},error:null})},rpc:async(name,args)=>{
  calls.push({key,name,args});
  if(key!=='server-secret'&&key!=='dashboard-secret')return{data:null,error:{message:'permission denied'}};
  if(name==='code_login_budget')return{data:allowBudget,error:null};
  if(name==='code_login')return{data:{error:'Code not recognized or unavailable.'},error:null};
  if(name==='code_instructor')return args.p_instructor==='teacher'?{data:{courses:[],records:[]},error:null}:{data:null,error:{message:'Instructor access required.'}};
  if(name==='code_student')return{data:{allowed:allowMessage,history:[],message:args.p_payload.message,reason:'Limit reached.'},error:null};
  return{data:{},error:null};
 }});
 const modules={'npm:@supabase/supabase-js@2':{createClient},'./security.js':security,'../oracle-dialogue/dialogue.js':{fallbackReply:'Authored reply',generateReply:async()=>{aiCalls++;return{reply:'AI reply',source:'ai'};}}};
 vm.runInNewContext(source,{require:name=>modules[name],Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn;}},Request,Response,crypto,TextEncoder});
 const request=(body,headers={})=>handler(new Request('https://test.invalid/functions/v1/oracle-access',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
 return{request,calls,aiCalls:()=>aiCalls};
}
test('HTTP handler requires instructor identity and rejects forged actor IDs with public keys',async()=>{
 const {request,calls}=makeHandler();
 assert.equal((await request({action:'records'})).status,401);
 assert.equal((await request({action:'records',instructor_id:'teacher'},{apikey:'public-key'})).status,401);
 assert.equal(calls.at(-1).key,'public-key'); // Spoofed actor is checked without server privilege.
 assert.equal((await request({action:'records'},{Authorization:'Bearer student-token'})).status,401);
 assert.equal((await request({action:'records'},{Authorization:'Bearer teacher-token'})).status,200);
 assert.equal(calls.at(-1).args.p_instructor,'teacher');
 assert.equal((await request({action:'records',instructor_id:'teacher'},{apikey:'dashboard-secret'})).status,200);
 assert.equal((await request({action:'records',instructor_id:'stranger'},{apikey:'dashboard-secret'})).status,401);
 assert.equal((await request({action:'progress'})).status,401);
 assert.equal((await request({action:'login',code:'a-b-1234'},{Origin:'https://untrusted.invalid'})).status,403);
});
test('login throttles before lookup; AI requires consent and an authorized reservation',async()=>{
 const blocked=makeHandler({allowBudget:false});assert.equal((await blocked.request({action:'login',code:'a-b-1234'})).status,429);assert.equal(blocked.calls.length,1);
 const normal=makeHandler();const token='a'.repeat(64),request_id=crypto.randomUUID();
 assert.equal((await normal.request({action:'message',token,message:'Please help me.',request_id,consent:false})).status,400);assert.equal(normal.calls.length,0);
 const reply=await normal.request({action:'message',token,message:'Please help me.',request_id,consent:true});assert.equal((await reply.json()).saved,false);assert.equal(normal.aiCalls(),0);
 assert.equal((await normal.request({action:'reserve',token})).status,400);
 const ready=makeHandler({allowMessage:true});await ready.request({action:'message',token,message:'Please help me.',request_id,consent:true});assert.equal(ready.aiCalls(),1);assert.equal(ready.calls.at(-1).name,'code_finish_dialogue');
});
