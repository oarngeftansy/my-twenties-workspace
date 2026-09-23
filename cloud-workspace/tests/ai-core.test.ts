import test from 'node:test';
import assert from 'node:assert/strict';
import {recordHash,changedContent,validateRecords,validRequestId,type ProjectRecord} from '../lib/ai-core.ts';
const item:ProjectRecord={id:'TASK-test',kind:'task',title:'规则测试',body:'待确定每日行动次数',category:'核心循环',source:'用户输入',evidence:'待确认',status:'待办',priority:'P1',owner:'',due:'',updatedAt:'2026-09-23'};
test('progress-only edits preserve review identity',async()=>{const next={...item,status:'进行中',owner:'主策',updatedAt:'2026-09-24'};assert.equal(changedContent(item,next),false);assert.equal(await recordHash(item),await recordHash(next))});
test('substantive changes get a new review identity',async()=>{for(const field of ['title','body','category','evidence','source'] as const){const next={...item,[field]:item[field]+'修改'};assert.equal(changedContent(item,next),true);assert.notEqual(await recordHash(item),await recordHash(next))}});
test('backup validation rejects duplicates, unknown kinds and empty body',()=>{assert(validateRecords([item]));assert(!validateRecords([item,item]));assert(!validateRecords([{...item,kind:'assistant'}]));assert(!validateRecords([{...item,body:' '}]))});
test('completed task requires completion evidence',()=>{assert(!validateRecords([{...item,status:'已完成'}]));assert(validateRecords([{...item,status:'已完成',body:'完成依据：验收通过'}]))});
test('chat idempotency keys are bounded and safe',()=>{assert(validRequestId('chat-12345678'));assert(!validRequestId('short'));assert(!validRequestId('x'.repeat(101)));assert(!validRequestId('<script>alert</script>'))});
