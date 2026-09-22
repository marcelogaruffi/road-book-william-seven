const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

code = code.replace(
  'const payload: any = { ...newClipping, link_materia: urlToFetch };',
  `const payload: any = { ...newClipping, link_materia: urlToFetch };
      if (!payload.espetaculo) {
        delete payload.espetaculo;
      }`
);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Fixed empty espetaculo constraint');
