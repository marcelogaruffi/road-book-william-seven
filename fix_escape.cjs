const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');
c = c.replace(/\\\/g, '\');
c = c.replace(/\\\$/g, '$');
c = c.replace(/\\\\/g, '\\');
fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c);
