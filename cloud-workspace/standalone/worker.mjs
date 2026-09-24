import app from '../dist/server/index.js';
import {passwordMatches,sessionCookie,hasSession,clearedSessionCookie} from './auth.mjs';

const loginPage=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>进入《我的20代生活》</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f5fb;color:#302b3b;font:16px/1.6 system-ui,sans-serif}main{width:min(420px,calc(100vw - 32px));padding:32px;background:white;border:1px solid #e5dfee;border-radius:16px;box-shadow:0 16px 50px #302b3b0c}h1{font-size:25px;margin:0 0 8px}p{color:#736a7e;margin:0 0 24px}label{display:block;font-weight:600}input{box-sizing:border-box;width:100%;padding:12px;margin:8px 0 16px;border:1px solid #cfc5dc;border-radius:8px;font:inherit}button{width:100%;border:0;border-radius:8px;padding:12px;background:#6952b8;color:white;font:inherit;cursor:pointer}.error{color:#a24848;margin-top:12px}</style></head><body><main><h1>我的20代生活</h1><p>用工作台口令进入。它与 ChatGPT 账号无关，同一口令可在你的其他设备使用。</p><form method="post" action="/login"><label for="password">工作台口令</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">进入工作台</button></form><!--ERROR--></main></body></html>`;
function html(error=false){return new Response(loginPage.replace('<!--ERROR-->',error?'<p class="error" role="alert">口令不正确，请重试。</p>':''),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}})}
function redirect(path,cookie){return new Response(null,{status:303,headers:{Location:path,'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}})}

export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(!env.WORKSPACE_PASSWORD_HASH||!env.SESSION_SECRET)return new Response('Workspace login is not configured.',{status:503});
 if(url.pathname==='/login'&&request.method==='POST'){
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  const [perIp,global]=await Promise.all([env.LOGIN_LIMIT_PER_IP.limit({key:ip}),env.LOGIN_LIMIT_GLOBAL.limit({key:'workspace-login'})]);
  if(!perIp.success||!global.success)return new Response('登录尝试过多，请一分钟后重试。',{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
  const length=Number(request.headers.get('content-length')||0);if(length>1024)return new Response('Request too large.',{status:413});
  let password='';try{password=String((await request.formData()).get('password')||'')}catch{return html(true)}
  return await passwordMatches(password,env.WORKSPACE_PASSWORD_HASH)?redirect('/',await sessionCookie(env.SESSION_SECRET)):html(true);
 }
 if(url.pathname==='/logout'&&request.method==='POST')return redirect('/login',clearedSessionCookie());
 if(!await hasSession(request,env.SESSION_SECRET))return url.pathname.startsWith('/api/')?Response.json({error:'login_required'},{status:401,headers:{'Cache-Control':'no-store'}}):url.pathname==='/login'?html():redirect('/login');
 if(url.pathname==='/login')return redirect('/');
 if(url.pathname.startsWith('/_next/')||url.pathname.startsWith('/sources/')||url.pathname==='/favicon.svg')return env.ASSETS.fetch(request);
 return app.fetch(request,env,ctx);
}};
