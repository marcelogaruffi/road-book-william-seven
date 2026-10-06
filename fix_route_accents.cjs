const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
content = content.replace(/EmissÃ£o/g, 'Emissão');
content = content.replace(/RelatÃ³rios/g, 'Relatórios');
fs.writeFileSync('src/routes/_authenticated/route.tsx', content, 'utf8');
