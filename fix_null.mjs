import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

code = code.replace(/apresentacao_id: \(apresentacoes\.find\(a => a\.evento_id === selectedEventoId\)\?\.id \|\| selectedEventoId\)/g, 'apresentacao_id: (apresentacoes.find(a => a.evento_id === selectedEventoId)?.id || null)');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Fixed to use null instead of selectedEventoId');

