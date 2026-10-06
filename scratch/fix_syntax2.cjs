const fs = require('fs');

const files = [
  'som.$evento_id.tsx',
  'video.$evento_id.tsx',
  'iluminacao.$evento_id.tsx',
  'som-operacao.$evento_id.tsx'
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  code = code.replace(/return \([\s\S]*?<div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">/, 'return (\n    <>\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">');

  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
}
