const fs = require('fs');
const files = [
  'som.$evento_id.tsx',
  'video.$evento_id.tsx',
  'iluminacao.$evento_id.tsx',
  'som-operacao.$evento_id.tsx',
  'malas.$evento_id.tsx'
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  // We want to add <> after return ( and </> before ); }
  
  if (!code.includes('return (\n    <>')) {
    // We can find `return (\n      \n      <div className="w-full`
    // and wrap it.
    code = code.replace(/return \(\s*<div className="w-full/, 'return (\n    <>\n      <div className="w-full');
    code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
    fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
    console.log('Fixed wrapper in ' + f);
  }
}
