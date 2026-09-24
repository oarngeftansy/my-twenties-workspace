import assert from 'node:assert/strict';
import test from 'node:test';
import {passwordMatches,sessionCookie,hasSession,clearedSessionCookie} from './auth.mjs';

test('the standalone workspace password and signed session are independent of ChatGPT accounts',async()=>{
 const password='example-long-random-workspace-password';
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password))),x=>x.toString(16).padStart(2,'0')).join('');
 assert.equal(await passwordMatches(password,hash),true);
 assert.equal(await passwordMatches('wrong',hash),false);
 const now=Date.now();const cookie=await sessionCookie('example-session-secret',now);
 const request=new Request('https://example.workers.dev/',{headers:{cookie:cookie.split(';')[0]}});
 assert.equal(await hasSession(request,'example-session-secret',now),true);
 assert.equal(await hasSession(request,'other-secret',now),false);
 assert.equal(await hasSession(request,'example-session-secret',now+31*24*60*60*1000),false);
 assert.match(clearedSessionCookie(),/Max-Age=0/);
});
