export type RecordItem={id:string;kind:string;title:string;category:string;body:string;evidence:string;source:string;priority:string;status:string;owner:string;due:string;updatedAt:string};
export type Snapshot={version:1;revision:number;records:RecordItem[]};
const fields=['id','kind','title','category','body','evidence','source','priority','status','owner','due','updatedAt'] as const;
export function validateRecords(input:unknown):RecordItem[]{
 if(!Array.isArray(input)||input.length>1500)throw new Error('备份记录数量无效（最多 1500 条）。');
 const ids=new Set<string>();
 return input.map(raw=>{
  if(!raw||typeof raw!=='object'||fields.some(k=>typeof raw[k]!=='string'))throw new Error('备份字段不完整，请使用工作台导出的 JSON 文件。');
  const r=Object.fromEntries(fields.map(k=>[k,raw[k]])) as RecordItem;
  if(!r.id||ids.has(r.id)||!['task','idea','mechanic','doc'].includes(r.kind)||!r.title.trim()||r.title.length>200||!r.body.trim()||r.body.length>100000||!['P0','P1','P2'].includes(r.priority))throw new Error('备份包含重复编号或无效记录。');
  if(r.kind==='task'&&(!['待办','进行中','待验收','已完成'].includes(r.status)||(r.status==='已完成'&&!/完成依据：\s*\S/.test(r.body))))throw new Error('任务状态无效，或已完成任务缺少完成依据。');
  ids.add(r.id);return r;
 });
}
export function parseBackup(text:string):RecordItem[]{
 if(text.length>2000000)throw new Error('备份文件超过 2 MB。');
 let data;try{data=JSON.parse(text)}catch{throw new Error('文件不是有效的 JSON 备份。')}
 if(data?.version!==1)throw new Error('不支持的备份版本。');return validateRecords(data.records);
}
export function readSnapshot(storage:Pick<Storage,'getItem'>,key:string,seed:RecordItem[]):Snapshot{
 const raw=storage.getItem(key);if(raw===null)return{version:1,revision:0,records:validateRecords(seed)};
 let data;try{data=JSON.parse(raw)}catch{throw new Error('本机保存内容损坏。请先导出或保留浏览器数据，再恢复备份。')}
 if(data.version!==1||!Number.isSafeInteger(data.revision)||data.revision<0)throw new Error('本机保存版本无效。');return{version:1,revision:data.revision,records:validateRecords(data.records)};
}
export function writeSnapshot(storage:Pick<Storage,'getItem'|'setItem'>,key:string,seed:RecordItem[],next:RecordItem[],expected:number):Snapshot{
 const current=readSnapshot(storage,key,seed);if(current.revision!==expected)throw new Error('其他窗口已修改内容。请先重新读取，再保存当前输入。');
 const records=validateRecords(next);const snapshot:Snapshot={version:1,revision:expected+1,records};
 storage.setItem(key,JSON.stringify(snapshot));return snapshot;
}
