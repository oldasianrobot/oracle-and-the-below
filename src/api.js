import { createClient } from '@supabase/supabase-js';
const config=window.ORACLE_CONFIG || {};
export const configured=Boolean(config.supabaseUrl && config.supabaseKey);
export const db=configured?createClient(config.supabaseUrl,config.supabaseKey):null;
export async function rpc(name,args={}){const {data,error}=await db.rpc(name,args);if(error)throw new Error(error.message);return data;}
export const signIn=email=>db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
