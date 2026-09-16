import {words} from './words.js';
export function normalizeCode(value){return typeof value==='string'?value.trim().toLowerCase().replace(/[\s–—]+/g,'-'):'';}
export function randomInt(max){const a=new Uint32Array(1),limit=Math.floor(2**32/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
export function newCode(){return `${words[randomInt(words.length)]}-${words[randomInt(words.length)]}-${String(randomInt(10000)).padStart(4,'0')}`;}
export function newToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function hashToken(token){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));}
export async function codeDigest(code,secret){
 if(!secret)throw new Error('Server configuration missing.');
 // Domain-separated keyed digest. Database-only leaks cannot test code guesses.
 // Service key rotation requires code reissue; it does not erase student work.
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('oracle-private-code:v1:'+normalizeCode(code))));
}
