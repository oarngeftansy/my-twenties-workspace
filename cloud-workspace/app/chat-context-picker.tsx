'use client';
import {useState,type DragEvent} from 'react';
import {Search,Plus,X,GripVertical} from 'lucide-react';
import type {ProjectRecord} from '@/lib/ai-core';

export const CHAT_RECORD_MIME='application/x-twenties-record';
const kinds=[['all','全部'],['task','任务'],['idea','灵感'],['mechanic','机制'],['doc','GDD']] as const;

export function ChatContextPicker({records,selected,onChange}:{records:ProjectRecord[];selected:string[];onChange:(ids:string[])=>void}){
 const [kind,setKind]=useState('all'),[query,setQuery]=useState(''),[dragOver,setDragOver]=useState(false),[error,setError]=useState('');
 const selectedRecords=selected.map(id=>records.find(r=>r.id===id)).filter((r):r is ProjectRecord=>!!r);
 const visible=records.filter(r=>(kind==='all'||r.kind===kind)&&[r.title,r.category,r.id,r.body].some(t=>t.toLowerCase().includes(query.toLowerCase()))).slice(0,80);
 function add(id:string){if(!records.some(r=>r.id===id))return;if(selected.includes(id)){setError('这条记录已经选中。');return}if(selected.length>=8){setError('一轮最多选择 8 条记录。');return}onChange([...selected,id]);setError('')}
 function drop(e:DragEvent){e.preventDefault();setDragOver(false);const id=e.dataTransfer.getData(CHAT_RECORD_MIME);if(id)add(id)}
 return <section className="chat-context-picker" aria-label="选择本轮讨论资料"><div className="context-heading"><div><strong>这轮想聊什么？</strong><p>从任务、灵感、机制、GDD 中选择，或拖进下方讨论区。</p></div><span>{selected.length} / 8 已选</span></div><div className="context-filter"><label><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索要聊的记录" aria-label="搜索讨论资料"/></label><div className="context-kind-tabs" role="group" aria-label="资料类型">{kinds.map(([id,title])=><button type="button" key={id} className={kind===id?'active':''} aria-pressed={kind===id} onClick={()=>setKind(id)}>{title}</button>)}</div></div><div className="context-source-list">{visible.map(r=><button type="button" key={r.id} className={'context-source '+(selected.includes(r.id)?'selected':'')} draggable onDragStart={e=>{e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData(CHAT_RECORD_MIME,r.id)}} onClick={()=>add(r.id)} aria-label={'添加'+r.title+'到对话'}><GripVertical size={15}/><span className="context-source-text"><strong>{r.title}</strong><small>{kinds.find(k=>k[0]===r.kind)?.[1]} · {r.id} · {r.category}</small></span><Plus size={16}/></button>)}{!visible.length&&<p className="context-none">没有找到记录</p>}</div><div className={'context-drop '+(dragOver?'drag-over':'')} onDragOver={e=>{if(e.dataTransfer.types.includes(CHAT_RECORD_MIME)){e.preventDefault();e.dataTransfer.dropEffect='copy';setDragOver(true)}}} onDragLeave={()=>setDragOver(false)} onDrop={drop}><strong>本轮讨论资料</strong><small>点击上方记录，或将卡片拖到这里</small><div className="context-chips">{selectedRecords.map(r=><span className="context-chip" key={r.id}><span>{r.title}</span><button type="button" aria-label={'移除'+r.title} onClick={()=>onChange(selected.filter(id=>id!==r.id))}><X size={13}/></button></span>)}{!selectedRecords.length&&<span className="context-hint">可以不选，直接自由对话</span>}</div></div>{error&&<p className="context-error" role="alert">{error}</p>}</section>;
}
