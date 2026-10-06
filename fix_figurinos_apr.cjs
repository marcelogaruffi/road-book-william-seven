const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/figurinos.index.tsx', 'utf8');
content = content.replace(/const apr = apresentacoes\.find\(e => e\.id === selectedEventoId\);/g, 'const apr = apresentacoes.find(e => e.evento_id === selectedEventoId);');
fs.writeFileSync('src/routes/_authenticated/figurinos.index.tsx', content, 'utf8');
