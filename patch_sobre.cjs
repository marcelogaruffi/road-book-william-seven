const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/sobre.tsx', 'utf8');
content = content.replace(/Roadbook Digital/g, 'Áxis');
content = content.replace('Gestão Artística e Logística de Turnês', 'Gestão para Teatros e Shows');
fs.writeFileSync('src/routes/_authenticated/sobre.tsx', content, 'utf8');

