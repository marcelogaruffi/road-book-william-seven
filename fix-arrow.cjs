const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');
code = code.replace('? Voltar para Grade de Eventos', '&larr; Voltar para Grade de Eventos');
fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
let code2 = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');
code2 = code2.replace('â†  Voltar', '&larr; Voltar');
code2 = code2.replace('? Voltar', '&larr; Voltar');
fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', code2);
console.log('Fixed arrow');

