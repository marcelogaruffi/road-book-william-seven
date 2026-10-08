const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
code = code.replace(/label="Divulgações"/g, 'label="Divulgações Redes Sociais"');
code = code.replace(/label="Divulgações"/g, 'label="Divulgações Redes Sociais"');
fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');

let div = fs.readFileSync('src/routes/_authenticated/divulgacoes.tsx', 'utf8');
div = div.replace(/Divulgações Sociais/g, 'Divulgações Redes Sociais');
div = div.replace(/const cleanLink = link\.split/g, 'if (!link) return null;\n        const cleanLink = link.split');
fs.writeFileSync('src/routes/_authenticated/divulgacoes.tsx', div, 'utf8');
console.log('done renaming');
