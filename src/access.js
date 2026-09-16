const key='oracle-private-session-v1';
let current=null;
try{current=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
export const studentSession=()=>current;
export function saveStudent(value){current=value;try{value?sessionStorage.setItem(key,JSON.stringify(value)):sessionStorage.removeItem(key);}catch{}}
export async function access(action,values={},instructorToken){
 const config=window.ORACLE_CONFIG||{};
 if(!config.supabaseUrl||!config.supabaseKey)throw new Error('Class connection is not configured.');
 const response=await fetch(config.supabaseUrl+'/functions/v1/oracle-access',{method:'POST',headers:{'Content-Type':'application/json',apikey:config.supabaseKey,...(instructorToken?{Authorization:'Bearer '+instructorToken}:{})},body:JSON.stringify({...values,action,...(instructorToken?{}:{token:current?.token})})});
 let data;try{data=await response.json();}catch{throw new Error('The class connection is unavailable. Try again shortly.');}
 if(!response.ok||data?.error)throw new Error(data?.error||'Could not save. Please try again.');
 return data;
}
export async function codeSignIn(code){const data=await access('login',{code});saveStudent(data);return data;}
export async function codeSignOut(){try{await access('logout');}finally{saveStudent(null);}}
