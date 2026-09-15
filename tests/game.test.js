import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks,outcome,summarize,stageIndex,toCsv} from '../src/game.js';
test('every route finishes nine contributions without grading by earnings',()=>{const paid=[];for(let reform=0;reform<3;reform++){const entries=tasks.map((t,i)=>outcome(t,i===6?reform:i===1?1:0,reform));const s=summarize(entries);assert.equal(s.count,9);assert.equal(s.revenue,330);assert.ok(s.paid<=s.approved);paid.push(s.paid);}assert.deepEqual(paid,[37,25,35]);});
test('published quality rule and hidden rule are distinguishable',()=>{assert.equal(outcome(tasks[1],0).paid,0);assert.equal(outcome(tasks[1],1).paid,6);for(let i=0;i<3;i++)assert.equal(outcome(tasks[3],i).paid,0);});
test('stages, invalid responses and CSV formula handling',()=>{assert.deepEqual([0,3,6,9].map(stageIndex),[0,1,2,3]);assert.throws(()=>outcome(tasks[0],4));assert.throws(()=>outcome(tasks[0],NaN));assert.ok(toCsv([[' =SUM(1,2)','line\n"quote"']]).includes("' =SUM"));});
