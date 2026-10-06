const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');
code = code.replace('if (fullEvent) {', 'if (fullEvent && fullEvent.equipe && fullEvent.equipe.length > 0) {');
fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', code);
console.log('Fixed');

