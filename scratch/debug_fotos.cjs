const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/fotos.tsx', 'utf8');

// Debug espetaculos
code = code.replace(
  /const names = Array\.from\(new Set\(espRes\.data\.map\(e => e\.nome_espetaculo\)\)\)\.filter\(Boolean\) as string\[\];/,
  `const names = Array.from(new Set(espRes.data.map(e => e.nome_espetaculo))).filter(Boolean) as string[];
      console.log('Fetched espetaculos:', espRes.data, names);`
);

// We need to change the multiple file upload state and logic.
// It's easier to just rewrite fotos.tsx entirely.
fs.writeFileSync('src/routes/_authenticated/fotos.tsx', code, 'utf8');
