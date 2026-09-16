import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeVisualResponse,visualTasks,isVisualResponse,visualFeedback,visuals} from '../src/visual.js';
import {tasks} from '../src/game.js';
import {writtenOutcome} from '../src/writing.js';
import {existsSync} from 'node:fs';
const form=values=>new Map(Object.entries(values));
test('visual submissions retain all three subjective judgments and stay within database limits',()=>{
 const task={...tasks[3],...visualTasks[4]};
 const response=encodeVisualResponse(task,form({painting:'Yes',tulips:'Yes',sculpture:'Unsure',response:'x'.repeat(1500)}));
 assert.ok(response.length<=2000);assert.ok(response.includes('painting: Yes\ntulips: Yes\nsculpture: Unsure'));assert.ok(isVisualResponse(response));
 assert.throws(()=>encodeVisualResponse(task,form({painting:'Yes',response:'Enough words to submit.'})));
 assert.equal(writtenOutcome(task,response,null).paid,0);
 assert.match(visualFeedback(4,''),/regardless of your answers/);
 assert.equal(isVisualResponse('My old written response'),false);
});
test('all shape choices persist without changing story pay and every image is packaged',()=>{
 const task={...tasks[2],...visualTasks[3]};
 for(const choice of ['A','B','C']){const response=encodeVisualResponse(task,form({shape:choice}));assert.ok(response.endsWith(choice));assert.equal(writtenOutcome(task,response,null).paid,8);}
 assert.throws(()=>encodeVisualResponse(task,form({shape:'D'})));
 for(const v of Object.values(visuals))assert.ok(existsSync(new URL('../public/assignments/'+v.file,import.meta.url)));
});
