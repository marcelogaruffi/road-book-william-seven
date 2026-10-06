import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

code = code.replace(/eq\("apresentacao_id", eventoId\)/g, 'eq("evento_id", eventoId)');
code = code.replace(/query\.eq\("apresentacao_id", eventoId\)/g, 'query.eq("evento_id", eventoId)');
code = code.replace(/evento_id: \(apresentacoes\.find\(a => a\.id === selectedEventoId\)\?\.evento_id \|\| selectedEventoId\), apresentacao_id: selectedEventoId/g, 'evento_id: selectedEventoId, apresentacao_id: (apresentacoes.find(a => a.evento_id === selectedEventoId)?.id || selectedEventoId)');
code = code.replace(/const apr = apresentacoes\.find\(e => e\.id === selectedEventoId\);/g, 'const apr = apresentacoes.find(e => e.evento_id === selectedEventoId);');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Fixed IDs!');

