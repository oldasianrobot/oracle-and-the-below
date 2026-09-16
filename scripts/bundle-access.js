import {readFileSync,writeFileSync} from 'node:fs';
const root='supabase/functions/';
let source=readFileSync(root+'oracle-access/index.ts','utf8');
source=source.replace("import {normalizeCode,newCode,newToken,hashToken,codeDigest} from './security.js';",readFileSync(root+'oracle-access/security.js','utf8').replace("import {words} from './words.js';",readFileSync(root+'oracle-access/words.js','utf8')));
source=source.replace("import {generateReply,fallbackReply} from '../oracle-dialogue/dialogue.js';",readFileSync(root+'oracle-dialogue/dialogue.js','utf8'));
writeFileSync('/tmp/oracle-access-deploy.ts',source);
console.log('Dashboard deployment source prepared. No secrets included.');
