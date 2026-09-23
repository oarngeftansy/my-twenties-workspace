import {database,sameOrigin,workspace} from '@/lib/ai-service';

const id='my-twenties-chat-draft';
type Draft={text:string;recordIds:string[];revision:number};
async function read():Promise<Draft>{const row=await database().prepare('SELECT payload,revision FROM workspaces WHERE id=?').bind(id).first<{payload:string;revision:number}>();return row?{...JSON.parse(row.payload),revision:row.revision}:{text:'',recordIds:[],revision:0};}
export async function GET(){try{return Response.json(await read(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'草稿读取失败。'},{status:503})}}
export async function PUT(request:Request){if(!sameOrigin(request))return Response.json({error:'origin_rejected'},{status:403});try{
 const raw=await request.text();if(raw.length>10000)return Response.json({error:'草稿过长。'},{status:413});
 const input=JSON.parse(raw) as Draft;
 if(typeof input.text!=='string'||input.text.length>6000||!Array.isArray(input.recordIds)||input.recordIds.length>8||input.recordIds.some(x=>typeof x!=='string')||new Set(input.recordIds).size!==input.recordIds.length||!Number.isSafeInteger(input.revision)||input.revision<0)return Response.json({error:'草稿格式无效。'},{status:400});
 const records=(await workspace()).records;if(input.recordIds.some(x=>!records.some(r=>r.id===x)))return Response.json({error:'所选记录已删除，请重新选择。'},{status:409});
 const db=database();await db.prepare('INSERT OR IGNORE INTO workspaces(id,payload,revision) VALUES(?,?,0)').bind(id,JSON.stringify({text:'',recordIds:[]})).run();
 const result=await db.prepare('UPDATE workspaces SET payload=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify({text:input.text,recordIds:input.recordIds}),id,input.revision).run();
 if(!result.meta.changes)return Response.json({error:'草稿已在另一设备更新。',draft:await read()},{status:409});
 return Response.json({...input,revision:input.revision+1},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'草稿保存失败，请稍后重试。'},{status:500})}}
