const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');
code = code.replace(/\\\`/g, '\`');
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Fixed backticks');
