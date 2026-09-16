import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeVisualResponse,tasks,isVisualResponse,beautyRejection,visualWrittenOutcome,visuals} from '../src/visual.js';
import {existsSync} from 'node:fs';
const form=values=>new Map(Object.entries(values));
test('three separate beauty assignments save three judgments and a category explanation with zero pay',()=>{
 const keys=[];
 for(const task of tasks.filter(t=>t.beauty)){
  keys.push(...task.beauty);
  const values=Object.fromEntries(task.beauty.map((k,i)=>[k,['Yes','No','Unsure'][i]]));
  const response=encodeVisualResponse(task,form({...values,response:'x'.repeat(1500)}));
  assert.ok(response.length<=2000);assert.ok(isVisualResponse(response));
  for(const [key,value] of Object.entries(values))assert.ok(response.includes(`${key}: ${value}`));
  assert.throws(()=>encodeVisualResponse(task,form({response:'Enough words to submit.'})));
  const result=visualWrittenOutcome(task,response,null);assert.equal(result.paid,0);assert.equal(result.approved,0);assert.equal(result.promised,8);assert.equal(result.feedback,beautyRejection);assert.equal(task.learning,'');
 }
 assert.equal(new Set(keys).size,9);assert.equal(isVisualResponse('My old written response'),false);
 assert.match(beautyRejection,/do not permit/);
});
test('shape choices persist, category images are packaged, and all branch balances match the revised story',()=>{
 for(const choice of ['A','B','C']){const response=encodeVisualResponse(tasks[2],form({shape:choice}));assert.ok(response.endsWith(choice));assert.equal(visualWrittenOutcome(tasks[2],response,null).paid,8);}
 assert.throws(()=>encodeVisualResponse(tasks[2],form({shape:'D'})));
 for(const v of Object.values(visuals))assert.ok(existsSync(new URL('../public/assignments/'+v.file,import.meta.url)));
 for(const route of [0,1,2]){
  const entries=tasks.map(t=>visualWrittenOutcome(t,'A sufficiently detailed response.',route,route));
  assert.equal(entries.reduce((s,e)=>s+e.paid,0),route===0?36:24);
  assert.equal(entries.reduce((s,e)=>s+e.promised,0),60);
  assert.equal(entries[6].paid,0);
 }
});
