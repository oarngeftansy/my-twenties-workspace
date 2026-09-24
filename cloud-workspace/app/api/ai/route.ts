import {database,jobs,publicJob,sameOrigin,runOneJob,workspace,makeReview,insertReview} from '@/lib/ai-service';
import {validRequestId} from '@/lib/ai-core';
export async function GET(){try{return Response.json({jobs:(await jobs()).map(publicJob)},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'读取 AI 历史失败，请重试。'},{status:503})}}
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'origin_rejected'},{status:403});try{
 const text=await request.text();if(text.length>16000)return Response.json({error:'输入过长。'},{status:413});const data=JSON.parse(text);const db=database();
 if(data.action==='run'){await runOneJob();return Response.json({jobs:(await jobs()).map(publicJob)})}
 if(data.action==='chat'){
  if(!validRequestId(data.id)||typeof data.message!=='string'||!data.message.trim()||data.message.length>6000)return Response.json({error:'请输入 1–6000 字的内容。'},{status:400});
  const queue=await db.prepare("SELECT COUNT(*) AS n FROM ai_jobs WHERE kind='chat' AND status IN ('pending','running')").first<{n:number}>();if((queue?.n??0)>=5)return Response.json({error:'已有对话正在处理中，请等待完成。'},{status:429});
  const ids=data.recordIds??[];if(!Array.isArray(ids)||ids.length>8||ids.some((id:unknown)=>typeof id!=='string')||new Set(ids).size!==ids.length)return Response.json({error:'最多可选择 8 条不重复的记录。'},{status:400});
  const current=await workspace();const selected=ids.map((id:string)=>current.records.find(r=>r.id===id));if(selected.some(r=>!r))return Response.json({error:'所选记录已变化，请刷新后重新选择。'},{status:409});
  const snapshot=selected.length?JSON.stringify(selected.map(r=>({id:r!.id,kind:r!.kind,title:r!.title,body:r!.body,category:r!.category,source:r!.source,evidence:r!.evidence,status:r!.status}))):'';if(snapshot.length>40000)return Response.json({error:'选中资料太长，请减少记录数量后发送。'},{status:413});
  await db.prepare("INSERT OR IGNORE INTO ai_jobs(id,kind,snapshot,user_text,created_at,updated_at) VALUES(?,'chat',?,?,?,?)").bind(data.id,snapshot,data.message.trim(),Date.now(),Date.now()).run();
 }else if(data.action==='decision'){
  if(!validRequestId(data.id)||!validRequestId(data.chatId))return Response.json({error:'invalid_job'},{status:400});
  const chat=await db.prepare("SELECT id,kind,status,snapshot,user_text,output FROM ai_jobs WHERE id=?").bind(data.chatId).first<{id:string;kind:string;status:string;snapshot:string;user_text:string;output:string}>();
  if(!chat||chat.kind!=='chat'||chat.status!=='done')return Response.json({error:'请等这轮对话完成后再整理结论。'},{status:409});
  const existing=await db.prepare('SELECT id FROM ai_jobs WHERE id=?').bind(data.id).first();
  if(!existing){const queue=await db.prepare("SELECT COUNT(*) AS n FROM ai_jobs WHERE status IN ('pending','running')").first<{n:number}>();if((queue?.n??0)>=5)return Response.json({error:'已有内容正在处理中，请稍后再试。'},{status:429});}
  await db.prepare("INSERT OR IGNORE INTO ai_jobs(id,kind,record_id,snapshot,user_text,created_at,updated_at) VALUES(?,'decision',?,?,?, ?,?)").bind(data.id,chat.id,JSON.stringify({question:chat.user_text,answer:chat.output,selected:chat.snapshot?JSON.parse(chat.snapshot):[]}),chat.user_text,Date.now(),Date.now()).run();
 }else if(data.action==='retry'){
  if(typeof data.id!=='string')return Response.json({error:'invalid_job'},{status:400});await db.prepare("UPDATE ai_jobs SET status='pending',error='',updated_at=? WHERE id=? AND status='failed'").bind(Date.now(),data.id).run();
 }else if(data.action==='review'){
  const w=await workspace();const record=w.records.find(r=>r.id===data.recordId);if(!record)return Response.json({error:'记录不存在。'},{status:404});await insertReview(await makeReview(record,w.revision)).run();
 }else{return Response.json({error:'invalid_action'},{status:400})}
 return Response.json({jobs:(await jobs()).map(publicJob)});
 }catch{return Response.json({error:'请求未完成，请稍后重试。'},{status:500})}}
