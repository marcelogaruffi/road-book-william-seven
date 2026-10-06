const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
c = c.replace(/FileText/g, 'File');
fs.writeFileSync('src/routes/_authenticated/route.tsx', c);

let c2 = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');
c2 = c2.replace(/FileText/g, 'File');
fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c2);
