import {env} from 'cloudflare:workers';
import seed from '@/data/seed.json';
const key='my-twenties';
function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function GET(){try{const row=await db().prepare('SELECT payload, revision FROM workspaces WHERE id = ?').bind(key).first<{payload:string,revision:number}>();return Response.json({records:row?JSON.parse(row.payload):seed,revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'storage_unavailable'},{status:503});}}
export async function PUT(request:Request){
const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==new URL(request.url).host)return Response.json({error:'origin_rejected'},{status:403});
try{
const raw=await request.text();if(raw.length>2000000)return Response.json({error:'too_large'},{status:413});
const {records,revision}=JSON.parse(raw);if(!Array.isArray(records)||records.length>1500||!Number.isInteger(revision)||revision<0)return Response.json({error:'invalid_input'},{status:400});
const ids=new Set();const fields=['id','kind','title','body','category','status','source','priority','evidence','owner','due','updatedAt'];
for(const r of records){if(!r||fields.some(k=>typeof r[k]!=='string')||!['task','idea','mechanic','doc'].includes(r.kind)||!r.title.trim()||r.title.length>200||!r.body.trim()||r.body.length>100000||ids.has(r.id)||!['P0','P1','P2'].includes(r.priority))return Response.json({error:'invalid_record'},{status:400});ids.add(r.id);if(r.kind==='task'&&(!['待办','进行中','待验收','已完成'].includes(r.status)||(r.status==='已完成'&&!/完成依据：\s*\S/.test(r.body))))return Response.json({error:'missing_completion_evidence'},{status:400});}
const database=db();await database.prepare('INSERT OR IGNORE INTO workspaces (id,payload,revision) VALUES (?,?,0)').bind(key,JSON.stringify(seed)).run();
const result=await database.prepare('UPDATE workspaces SET payload = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(records),key,revision).run();
if(!result.meta.changes)return Response.json({error:'revision_conflict'},{status:409});
return Response.json({revision:revision+1});
}catch{return Response.json({error:'save_failed'},{status:500});}}
