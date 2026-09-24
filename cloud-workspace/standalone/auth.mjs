const encoder=new TextEncoder();
const cookieName='__Host-twenties_session';
const maxAge=30*24*60*60;

function hex(bytes){return Array.from(new Uint8Array(bytes),value=>value.toString(16).padStart(2,'0')).join('')}
function constantTimeEqual(a,b){if(a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0}
async function hmacKey(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])}
async function signature(secret,payload){return hex(await crypto.subtle.sign('HMAC',await hmacKey(secret),encoder.encode(payload)))}

export async function passwordMatches(input,expectedHash){if(typeof input!=='string'||input.length>512||!expectedHash)return false;const actual=hex(await crypto.subtle.digest('SHA-256',encoder.encode(input)));return constantTimeEqual(actual,expectedHash.toLowerCase())}
export async function sessionCookie(secret,now=Date.now()){const expiry=Math.floor(now/1000)+maxAge;const payload=`v1.${expiry}`;return `${cookieName}=${payload}.${await signature(secret,payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export async function hasSession(request,secret,now=Date.now()){if(!secret)return false;const match=request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));if(!match)return false;const token=match[1];const parts=token.split('.');if(parts.length!==3||parts[0]!=='v1'||!/^\d{10}$/.test(parts[1])||!(/^[a-f0-9]{64}$/.test(parts[2])))return false;const expiry=Number(parts[1]);if(expiry<Math.floor(now/1000)||expiry>Math.floor(now/1000)+maxAge)return false;const expected=await signature(secret,`${parts[0]}.${parts[1]}`);return constantTimeEqual(expected,parts[2])}
export function clearedSessionCookie(){return `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
