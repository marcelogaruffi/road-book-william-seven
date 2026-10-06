const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');
code = code.replace(/\.eq\('apresentacao_id',/g, ".eq('evento_id',");
code = code.replace(/\.select\('id, evento_id, json_data'\)\.eq\('evento_id', evento_id\)\.single\(\)/g, ".select('id, evento_id, json_data').eq('evento_id', evento_id).limit(1).maybeSingle()");
fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
console.log('Fixed eq and single in malas.$evento_id.tsx');
