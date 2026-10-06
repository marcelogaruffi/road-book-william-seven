const fs = require('fs');
let code = fs.readFileSync('src/components/GridEventos.tsx', 'utf8');

code = code.replace(/const \[y, mStr, dStr\] = ev\.data\.split\('-'\);/, 'const [y, mStr, dStr] = (ev.data || "2000-01-01").split("-");');

fs.writeFileSync('src/components/GridEventos.tsx', code, 'utf8');
console.log('Fixed GridEventos null crash');
