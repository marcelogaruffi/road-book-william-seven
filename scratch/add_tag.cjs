const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');
code = code.replace(
  '["Divulgação de Oficina", "Divulgação de Espetáculo"]',
  '["Divulgação de Oficina", "Divulgação de Espetáculo", "Divulgação de Outra Atividade"]'
);
fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Added new tag');
