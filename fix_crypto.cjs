const fs = require('fs');
let code1 = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');
code1 = code1.replace(/crypto\.randomUUID\(\)/g, 'Math.random().toString(36).substring(2, 9)');
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code1);

let code2 = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');
code2 = code2.replace(/crypto\.randomUUID\(\)/g, 'Math.random().toString(36).substring(2, 9)');
fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code2);
console.log('Fixed crypto UUID');
