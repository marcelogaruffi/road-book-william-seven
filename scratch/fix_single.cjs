const fs = require('fs');
const files = [ 'som.$evento_id.tsx', 'video.$evento_id.tsx', 'iluminacao.$evento_id.tsx', 'som-operacao.$evento_id.tsx' ];
for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  code = code.replace(/\.eq\('apresentacao_id', evento_id\)\.single\(\)/g, ".eq('apresentacao_id', evento_id).limit(1).maybeSingle()");
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
}
