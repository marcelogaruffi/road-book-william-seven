const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
content = content.replace(/Emissão/g, 'Emissão');
content = content.replace(/Relatórios/g, 'Relatórios');
fs.writeFileSync('src/routes/_authenticated/route.tsx', content, 'utf8');
