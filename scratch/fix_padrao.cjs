const fs = require('fs');
const files = ['som.index.tsx', 'video.index.tsx', 'iluminacao.index.tsx'];
for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  code = code.replace(/\.eq\('nome_espetaculo', selectedPadrao\)\s*\.single\(\)/g, ".eq('nome_espetaculo', selectedPadrao).limit(1).maybeSingle()");
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
  console.log('Fixed padrao single in ' + f);
}
