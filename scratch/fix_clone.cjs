const fs = require('fs');
const files = ['som.index.tsx', 'video.index.tsx', 'iluminacao.index.tsx', 'som-operacao.index.tsx'];
for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  code = code.replace(/\.select\('json_data'\)\.eq\('evento_id', selectedCloneId\)\s*\.single\(\)/g, ".select('json_data').eq('evento_id', selectedCloneId).limit(1).maybeSingle()");
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
  console.log('Fixed clone single in ' + f);
}
