const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/fotos.tsx', 'utf8');
code = code.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
code = code.replace(/\\.(jpeg|jpg|gif|png)/g, '\\.(jpeg|jpg|gif|png)');
fs.writeFileSync('src/routes/_authenticated/fotos.tsx', code, 'utf8');
console.log('fixed fotos');
