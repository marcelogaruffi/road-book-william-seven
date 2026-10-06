const fs = require('fs');
const files = [
  'som.index.tsx', 'som.$evento_id.tsx',
  'video.index.tsx', 'video.$evento_id.tsx',
  'iluminacao.index.tsx', 'iluminacao.$evento_id.tsx',
  'som-operacao.index.tsx', 'som-operacao.$evento_id.tsx'
];
for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  
  code = code.replace(/\.eq\('apresentacao_id', id\)/g, ".eq('evento_id', id)");
  code = code.replace(/\.eq\('apresentacao_id', evento_id\)/g, ".eq('evento_id', evento_id)");
  code = code.replace(/\.eq\('apresentacao_id', selectedCloneId\)/g, ".eq('evento_id', selectedCloneId)");
  
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
  console.log('Fixed eq in ' + f);
}
