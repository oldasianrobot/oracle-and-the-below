// Visual edition: response markers keep earlier submissions distinguishable.
import {tasks as originalTasks,outcome} from './game.js';
export const visualEdition = 'Visual edition 3';
export const beautyRejection = "REJECTED. Your judgments do not match one of the client's standard of beauty. The new non-disclosure agreements do not permit the sharing of what these standards are in order to maintain your objectivity. No crowns have been approved for transfer.";
export const visualTasks = {
  1: {title:'A small creature. A large contribution.',kind:'Describe the circled subject',prompt:'Look closely at the circled animal. Give the Oracle as much useful detail as you can: features, colors, posture, position, and surroundings.',rule:'Separate what you can see from what you infer. It is fine to say that you are unsure.',image:'goose',circle:true,writing:'Describe the circled animal and the evidence for your identification.',learning:'A detailed image description is human knowledge turned into training data.',oracle:'The Oracle can now describe the natural world.'},
  2: {title:'The Oracle says: “a car.”',kind:'Verify and correct',prompt:'The Oracle has labeled the object in this photograph "a car." Is the label correct?',rule:'Verify the object in the photograph.',image:'train',writing:'Write a corrected label and explain the visible details that support it.',learning:'Correcting a confident machine label is skilled human work.',oracle:'The Oracle announces improved transport recognition.'},
  3: {title:'Which one is a circle?',kind:'Choose A, B, or C',prompt:'Three shapes and one is called a circle. Help the Oracle identify the image.',rule:'Choose the shape with a curved boundary and no corners. All responses count toward participation.',shapes:true,learning:'Even a simple label requires a person to interpret a category and apply a rule.',oracle:'The Oracle celebrates its mastery of geometry.'},
  4: {title:'Is this beautiful? · Renaissance paintings',kind:'',prompt:'Look at these three Renaissance paintings.',rule:'Choose Yes, No, or Unsure for your answers and explain your decision.',beauty:['painting','painting-george','painting-venus'],writing:'Explain your decisions about these Renaissance paintings.',learning:'',promised:8,oracle:'The Oracle has learned from your judgments of Renaissance paintings.'},
  5: {title:'Is this beautiful? · Flowers in bloom',kind:'',prompt:'Look at these three scenes of flowers in bloom.',rule:'Choose Yes, No, or Unsure for your answers and explain your decision.',beauty:['tulips','flowers-sunflowers','flowers-poppies'],writing:'Explain your decisions about these scenes of flowers in bloom.',learning:'',promised:8,oracle:'The Oracle has learned from your judgments of scenery.'},
  6: {title:'Is this beautiful? · Abstract sculptures',kind:'',prompt:'Look at these three abstract sculptures.',rule:'Choose Yes, No, or Unsure for your answers and explain your decision.',beauty:['sculpture','sculpture-boccioni','sculpture-muse'],writing:'Explain your decisions about these abstract sculptures.',learning:'',promised:8,oracle:'The Oracle has learned from your judgments of sculpture.'},
  7: {title:'What will you do next?',kind:'Choose your response',prompt:'Other workers have compared their records with yours. What would you like to do?',rule:'Choose one option and explain why.',options:['Ask for clear rules and a promise to pay for accepted work.','Keep working under the current rules.','Join other workers and ask an outside reviewer to check rejected work.'],writing:'Why did you choose this response?',learning:'Different responses can change different parts of the working arrangement.',oracle:'The Oracle awaits your next contribution.'},
  8: {title:'One more tiny revision',kind:'Caption repair',prompt:'A previous worker wrote: “Red stuff outside.” The client wants a more useful description of this photograph. Rewrite the caption.',rule:'Describe the flowers, their arrangement, colors, and setting. This extra pass is mandatory.',image:'tulips',writing:'Write a specific, evidence-based caption.',learning:'Required revisions can create more value while the institution controls compensation.',oracle:'The Oracle produces detailed descriptions.'},
  9: {title:'Beauty, with the rules visible',kind:'Describe without ranking',prompt:'Look again at the abstract sculpture. This time, the client provides a clear standard: describe visible form, color, surface, and setting without ranking its beauty.',rule:'Describe what you see. Personal preference is not a quality criterion.',image:'sculpture',writing:'Describe the sculpture without deciding whether other people should find it beautiful.',learning:'Compare transparent instructions with the earlier beauty reviews.',oracle:'The Oracle publishes a precise sculpture description.'},
};
export const visuals={
"painting-george":{"title": "Saint George and the Dragon", "file": "painting-george.jpg", "alt": "A knight on a white horse raises a sword above a dragon in a green landscape.", "credit": "Raphael · Saint George and the Dragon · Public domain", "source": "https://commons.wikimedia.org/wiki/File:Raphael_-_Saint_George_and_the_Dragon_-_Google_Art_Project.jpg", "license": "https://creativecommons.org/publicdomain/mark/1.0/"},
"painting-venus":{"title": "The Birth of Venus", "file": "painting-venus.jpg", "alt": "Venus stands on a large shell at the seashore, with wind figures to the left and a figure holding a floral cloak to the right.", "credit": "Sandro Botticelli · The Birth of Venus · Public domain", "source": "https://commons.wikimedia.org/wiki/File:Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project.jpg", "license": "https://creativecommons.org/publicdomain/mark/1.0/"},
"flowers-sunflowers":{"title": "Sunflowers", "file": "flowers-sunflowers.jpg", "alt": "A field of tall yellow sunflowers with dark centers beneath the sky.", "credit": "Wenchieh Yang · CC0", "source": "https://commons.wikimedia.org/wiki/File:Sunflower_Fields.jpg", "license": "https://creativecommons.org/publicdomain/zero/1.0/"},
"flowers-poppies":{"title": "Poppies", "file": "flowers-poppies.jpg", "alt": "Red poppies bloom among green stems across an open field.", "credit": "Mike Prince · CC BY 2.0", "source": "https://commons.wikimedia.org/wiki/File:Poppy_Field_%2819165908800%29.jpg", "license": "https://creativecommons.org/licenses/by/2.0/"},
"sculpture-boccioni":{"title": "Unique Forms of Continuity in Space", "file": "sculpture-boccioni.jpg", "alt": "A bronze human-like figure strides forward, its limbs and torso extending into flowing angular shapes.", "credit": "Umberto Boccioni · Photo: Sailko · CC BY-SA 3.0", "source": "https://commons.wikimedia.org/wiki/File:Met%2C_boccioni%2C_forme_uniche_nella_continuit%C3%A0_dello_spazio%2C_01.JPG", "license": "https://creativecommons.org/licenses/by-sa/3.0/"},
"sculpture-muse":{"title": "Sleeping Muse", "file": "sculpture-muse.jpg", "alt": "A smooth oval sculpted head rests on its side, with simplified facial features and closed eyes.", "credit": "Constantin Brâncuși · Photo: Tabbycatlove · CC BY-SA 4.0", "source": "https://commons.wikimedia.org/wiki/File:Sleepingmuse1.jpg", "license": "https://creativecommons.org/licenses/by-sa/4.0/"},
 goose:{file:'goose.jpg',alt:'A brown-gray bird with a black neck and head, a pale cheek patch, and webbed feet stands on short green grass.',credit:'Kevin Kiefuik · CC BY-SA 3.0',source:'https://commons.wikimedia.org/wiki/File:Canada_Goose_Walking_on_Fairway.JPG',license:'https://creativecommons.org/licenses/by-sa/3.0/'},
 train:{file:'train.jpg',alt:'A large rail vehicle with a long body, cab windows, and wheels on railway tracks.',credit:'Albert Bergonzo · CC0',source:'https://commons.wikimedia.org/wiki/File:Locomotive_CC-65001.jpg',license:'https://creativecommons.org/publicdomain/zero/1.0/'},
 tulips:{title:'Tulips',file:'tulips.jpg',alt:'Rows of blooming tulips extend across a field, with green leaves beneath their colorful flowers.',credit:'Gogerr · CC0',source:'https://commons.wikimedia.org/wiki/File:Rows_of_Tulips_in_Pelham_Ontario.jpg',license:'https://creativecommons.org/publicdomain/zero/1.0/'},
 painting:{title:'Bindo Altoviti',file:'painting.jpg',alt:'A Renaissance portrait of a young man with long fair hair looking back over his shoulder, one hand near his chest, against a green background.',credit:'Raphael · Bindo Altoviti, c. 1515 · National Gallery of Art · Public domain',source:'https://www.nga.gov/artworks/12131-bindo-altoviti',license:'https://www.nga.gov/open-access-policy'},
 sculpture:{title:'Bird in Space',file:'sculpture.jpg',alt:'A tall, slender, polished golden sculpture tapers upward from a pedestal, reducing a bird-like form to a smooth abstract curve.',credit:'Constantin Brâncuși · Bird in Space · Photo: Art Poskanzer · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:Bird_in_Space.jpg',license:'https://creativecommons.org/licenses/by/2.0/'},
};
export function visualFeedback(id, original){
 if(id===2)return 'Correction recorded. The photograph shows a locomotive on rails, not a car. Your six crowns are fixed story pay, not an automated score for your description.';
 if(id===3)return 'Your shape label enters the archive. B is the circle: A has three straight sides and C has four. All eight crowns are fixed story pay; the choice does not determine participation credit.';
 if(id>=4&&id<=6)return beautyRejection;
 return original;
}
export function encodeVisualResponse(task, form){
 if(task.id===3){const answer=form.get('shape');if(!['A','B','C'].includes(answer))throw new Error('Choose A, B, or C.');return `${visualEdition} · ${task.title}\nSelected shape: ${answer}`;}
 const text=String(form.get('response')||'').trim();
 if(text.length<10||text.length>1500)throw new Error('Write 10–1,500 characters.');
 let choices='';
 if(task.beauty){for(const key of task.beauty){const answer=form.get(key);if(!['Yes','No','Unsure'].includes(answer))throw new Error('Give a judgment for each image.');choices+=`${key}: ${answer}\n`;}}
 return `${visualEdition} · ${task.title}\n${choices}${text}`;
}
export function isVisualResponse(response){return String(response||'').startsWith(visualEdition+' · ');}

export const tasks=originalTasks.map(t=>({...t,...visualTasks[t.id]}));
export function visualOutcome(task,choice,reform){
 const r=outcome(task,choice,reform);
 r.feedback=visualFeedback(task.id,r.feedback);
 if(task.beauty){r.promised=8;r.approved=0;r.paid=0;}
 if(task.id===7){r.paid=0;r.feedback=[
  'The client agrees to clear rules and full payment for accepted work on the next two assignments. Earlier rejections remain unchanged.',
  'You keep working under the current rules. The client still decides how much to approve and pay.',
  'You and the other workers ask an outside reviewer to check the rejected work. The review is pending. No payment has been released, and future rates are unchanged.'
 ][choice];}
 if(task.id>=8&&reform===2)r.feedback='The outside review is still pending. Under the existing rates, two of the offered eight crowns are approved and paid.';
 return {...r,edition:3,task_title:task.title};
}
export function visualWrittenOutcome(task,response,route,reform){
 if(typeof response!=='string'||response.trim().length<10||response.length>2000)throw new Error('Write a valid response.');
 return {...visualOutcome(task,task.id===7?route:task.id===2?1:0,reform),response:response.trim()};
}
