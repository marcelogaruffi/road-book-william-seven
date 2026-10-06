const fs = require('fs');

const files = [
  'som.$evento_id.tsx',
  'video.$evento_id.tsx',
  'iluminacao.$evento_id.tsx',
  'som-operacao.$evento_id.tsx'
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  if (!code.includes('return (\n    <>')) {
    code = code.replace(/return \(\s*<div className="w-full/, 'return (\n    <>\n      <div className="w-full');
    code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
    fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
    console.log('Wrapped ' + f);
  }
}
