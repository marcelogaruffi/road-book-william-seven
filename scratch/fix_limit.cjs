const fs = require('fs');
const files = [ 'som.index.tsx', 'video.index.tsx', 'iluminacao.index.tsx', 'som-operacao.index.tsx' ];
for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  code = code.replace(/\.eq\('apresentacao_id', id\)\.maybeSingle\(\)/g, ".eq('apresentacao_id', id).limit(1).maybeSingle()");
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
}
