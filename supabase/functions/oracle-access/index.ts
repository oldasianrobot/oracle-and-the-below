import {createClient} from 'npm:@supabase/supabase-js@2';
import {normalizeCode,newCode,newToken,hashToken,codeDigest} from './security.js';
import {generateReply,fallbackReply} from '../oracle-dialogue/dialogue.js';
const url=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean);
const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed.includes(origin))return json({error:'Origin not allowed.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return json({error:'Use POST.'},405);
 const call=async(name:string,args={})=>{const {data,error}=await admin.rpc(name,args);if(error)throw new Error(error.message);return data;};
 try{
  const raw=await req.text();if(raw.length>16000)return json({error:'Request too large.'},400);
  const body=JSON.parse(raw);const action=body.action;
  if(action==='login'){
   if(!await call('code_login_budget'))return json({error:'Too many sign-in attempts. Please try again later.'},429);
   const code=normalizeCode(body.code);
   if(!/^[a-z]+-[a-z]+-\d{4}$/.test(code)||code.length>80)return json({error:'Code not recognized or unavailable. Check with your instructor.'},401);
   const token=newToken();const result=await call('code_login',{p_digest:await codeDigest(code,serviceKey),p_session:await hashToken(token)});
   if(result.error)return json(result,401);
   return json({...result,token});
  }
  if(['records','create','replace','disable'].includes(action)){
   const bearer=req.headers.get('Authorization')||'';
   let actor:string;
   if(typeof body.instructor_id==='string'&&req.headers.get('apikey')){
    // Dashboard provisioning: validate its API credential with a service-only RPC.
    // This client uses ONLY the supplied credential, never the server's admin key.
    const provision=createClient(url,req.headers.get('apikey')!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await provision.rpc('code_instructor',{p_instructor:body.instructor_id,p_action:'records'});
    if(error)return json({error:'Instructor sign-in required.'},401);
    actor=body.instructor_id;
   }else{
    if(!bearer.startsWith('Bearer '))return json({error:'Instructor sign-in required.'},401);
    const {data:{user},error}=await admin.auth.getUser(bearer.slice(7));
    if(error||!user)return json({error:'Instructor sign-in required.'},401);
    actor=user.id;
   }
   const base={p_instructor:actor,p_action:action,p_course:body.course_id||null,p_participant:body.participant_id||null};
   if(action==='create'){
    if(!Number.isInteger(body.count)||body.count<1||body.count>100)return json({error:'Choose 1–100 codes.'},400);
    // Authorization check before generating any credentials.
    const info=await call('code_instructor',{p_instructor:actor,p_action:'records'});
    if(!info.courses.some((c:any)=>c.id===body.course_id&&c.active))return json({error:'Class unavailable.'},403);
    const codes=await Promise.all(Array.from({length:body.count},async()=>{const code=newCode();return{id:crypto.randomUUID(),code,digest:await codeDigest(code,serviceKey)};}));
    const records=await call('code_instructor',{...base,p_items:codes.map(({id,digest})=>({id,digest}))});
    return json(records.map((r:any)=>({...r,code:codes.find(c=>c.id===r.id)!.code})));
   }
   if(action==='replace'){
    const code=newCode();const r=await call('code_instructor',{...base,p_items:{digest:await codeDigest(code,serviceKey)}});return json({...r,code});
   }
   return json(await call('code_instructor',base));
  }
  const token=body.token;
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return json({error:'Sign in with your private code.'},401);
  const digest=await hashToken(token);
  if(action==='message'){
   if(body.consent!==true||typeof body.message!=='string'||body.message.trim().length<10||body.message.length>1200||!/^[-a-f0-9]{36}$/.test(body.request_id||''))return json({error:'Confirm AI sharing and write 10–1,200 characters.'},400);
   const reservation=await call('code_student',{p_session:digest,p_action:'reserve',p_payload:{message:body.message,request_id:body.request_id}});
   if(reservation.cached)return json(reservation.cached);
   if(!reservation.allowed)return json({reply:fallbackReply,source:'authored',saved:false,reason:reservation.reason});
   const result=await generateReply({key:Deno.env.get('OPENROUTER_API_KEY'),model:Deno.env.get('OPENROUTER_MODEL')||'openrouter/free',history:reservation.history,message:reservation.message});
   await call('code_finish_dialogue',{p_request:body.request_id,p_result:result});return json(result);
  }
  if(!['progress','totals','submit','finish','dialogue','logout'].includes(action))return json({error:'Unknown action.'},400);
  return json(await call('code_student',{p_session:digest,p_action:action,p_payload:body.payload||{}}));
 }catch(e){return json({error:e instanceof Error?e.message:'Request failed.'},400);}
});
