import {env} from 'cloudflare:workers';
import seed from '@/data/seed.json';
import {validateRecords,changedContent,type ProjectRecord} from '@/lib/ai-core';
import {makeReview,insertReview,runOneJob} from '@/lib/ai-service';
import {getRequestExecutionContext} from 'vinext/shims/request-context';
const key='my-twenties';
function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function GET(){try{const row=await db().prepare('SELECT payload, revision FROM workspaces WHERE id = ?').bind(key).first<{payload:string,revision:number}>();return Response.json({records:row?JSON.parse(row.payload):seed,revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'storage_unavailable'},{status:503});}}
export async function PUT(request:Request){
const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==new URL(request.url).host)return Response.json({error:'origin_rejected'},{status:403});
try{
const raw=await request.text();if(raw.length>2000000)return Response.json({error:'too_large'},{status:413});
const {records,revision}=JSON.parse(raw);if(!Array.isArray(records)||records.length>1500||!Number.isInteger(revision)||revision<0)return Response.json({error:'invalid_input'},{status:400});
if(!validateRecords(records))return Response.json({error:'记录字段或完成依据无效。'},{status:400});
const database=db();await database.prepare('INSERT OR IGNORE INTO workspaces (id,payload,revision) VALUES (?,?,0)').bind(key,JSON.stringify(seed)).run();
const previous=await database.prepare('SELECT payload,revision FROM workspaces WHERE id=?').bind(key).first<{payload:string;revision:number}>();
if(!previous||previous.revision!==revision)return Response.json({error:'revision_conflict'},{status:409});
const old=new Map((JSON.parse(previous.payload) as ProjectRecord[]).map(r=>[r.id,r]));
const changes=records.filter(r=>!old.has(r.id)||changedContent(old.get(r.id)!,r));
const reviewJobs=await Promise.all(changes.map(r=>makeReview(r,revision+1)));const token=crypto.randomUUID();
const result=await database.batch([database.prepare('UPDATE workspaces SET payload = ?, revision = revision + 1,write_token=? WHERE id = ? AND revision = ?').bind(JSON.stringify(records),token,key,revision),...reviewJobs.map(j=>insertReview(j,token))]);
if(!result[0].meta.changes)return Response.json({error:'revision_conflict'},{status:409});
if(reviewJobs.length)getRequestExecutionContext()?.waitUntil(runOneJob().catch(()=>{}));
return Response.json({revision:revision+1,queuedReviews:reviewJobs.length});
}catch{return Response.json({error:'save_failed'},{status:500});}}
