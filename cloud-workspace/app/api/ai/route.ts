import {database,jobs,publicJob,sameOrigin,runOneJob,workspace,makeReview,insertReview} from '@/lib/ai-service';
import {validRequestId} from '@/lib/ai-core';
export async function GET(){try{return Response.json({jobs:(await jobs()).map(publicJob)},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'读取 AI 历史失败，请重试。'},{status:503})}}
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'origin_rejected'},{status:403});try{
 const text=await request.text();if(text.length>16000)return Response.json({error:'输入过长。'},{status:413});const data=JSON.parse(text);const db=database();
 if(data.action==='run'){await runOneJob();return Response.json({jobs:(await jobs()).map(publicJob)})}
 if(data.action==='chat'){
  if(!validRequestId(data.id)||typeof data.message!=='string'||!data.message.trim()||data.message.length>6000)return Response.json({error:'请输入 1–6000 字的内容。'},{status:400});
  const queue=await db.prepare("SELECT COUNT(*) AS n FROM ai_jobs WHERE kind='chat' AND status IN ('pending','running')").first<{n:number}>();if((queue?.n??0)>=5)return Response.json({error:'已有对话正在处理中，请等待完成。'},{status:429});
  await db.prepare("INSERT OR IGNORE INTO ai_jobs(id,kind,snapshot,user_text,created_at,updated_at) VALUES(?,'chat','',?,?,?)").bind(data.id,data.message.trim(),Date.now(),Date.now()).run();
 }else if(data.action==='retry'){
  if(typeof data.id!=='string')return Response.json({error:'invalid_job'},{status:400});await db.prepare("UPDATE ai_jobs SET status='pending',error='',updated_at=? WHERE id=? AND status='failed'").bind(Date.now(),data.id).run();
 }else if(data.action==='review'){
  const w=await workspace();const record=w.records.find(r=>r.id===data.recordId);if(!record)return Response.json({error:'记录不存在。'},{status:404});await insertReview(await makeReview(record,w.revision)).run();
 }else{return Response.json({error:'invalid_action'},{status:400})}
 return Response.json({jobs:(await jobs()).map(publicJob)});
 }catch{return Response.json({error:'请求未完成，请稍后重试。'},{status:500})}}
