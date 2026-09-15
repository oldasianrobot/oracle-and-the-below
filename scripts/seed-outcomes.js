import {writeFileSync} from 'node:fs';
import {tasks,outcome} from '../src/game.js';
const rows=[];
for(const t of tasks)for(let choice=0;choice<3;choice++)for(const reform of t.id>7?[0,1,2]:[-1]){
 const value=JSON.stringify(outcome(t,choice,reform)).replaceAll("'","''");
 rows.push(`(${t.id},${choice},${reform},'${value}'::jsonb)`);
}
writeFileSync(new URL('../backend/outcomes.sql',import.meta.url),'-- Generated from src/game.js. Run after schema.sql.\ninsert into oracle_private.outcomes(task_id,choice,reform,result) values\n'+rows.join(',\n')+'\non conflict(task_id,choice,reform) do update set result=excluded.result;\n');
