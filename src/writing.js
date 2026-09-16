import {outcome} from './game.js';
export const writingPrompts = {
  1: 'Name the creature and explain which features support your judgment.',
  2: 'Write the answer you would give the traveler. Explain what on the map supports it.',
  3: 'Explain how you interpret the duke’s message and what additional context would help.',
  4: 'Give your classification and explain how you used the posted handbook.',
  5: 'Write the corrected instruction without changing its meaning.',
  6: 'Write your payment appeal. Refer to the delivered work and ask for a specific remedy.',
  7: 'Explain why you chose this route and what you hope it will change.',
  8: 'Classify the specimen using the appendix. What changed since the first review?',
  9: 'Write a more accurate caption that recognizes the people behind the answer.',
};
export function writtenOutcome(task, text, route, reform){
 const response=String(text||'').trim();
 if(response.length<10||response.length>2000)throw new Error('Write 10–2,000 characters.');
 const choice=task.id===7?route:task.id===2?1:0;
 const result=outcome(task,choice,reform);
 if(task.id===2)result.feedback='Your answer is recorded. Compare it with the map: a supported answer directs the traveler to the ferry and avoids the collapsed bridge. In this version, the six crowns are fixed story pay, not an automated judgment of your writing.';
 if(task.id===4)result.feedback='Rejected. The Inspector cites an unpublished silver-wing rule. This scripted rejection happens regardless of what you wrote: it demonstrates control over undisclosed standards, not a judgment of your answer.';
 return {...result,response};
}
