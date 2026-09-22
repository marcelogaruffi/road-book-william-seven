const fs = require('fs');
const file = 'src/routes/_authenticated/checklist.tsx';
let c = fs.readFileSync(file, 'utf-8');
c = c.replace('.eq("evento_id", eventoId)', '.eq("apresentacao_id", eventoId)');
c = c.replace(/evento_id: selectedEventoId/g, 'evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId');
c = c.replace(/evento_id: evId/g, 'evento_id: (apresentacoes.find(a => a.id === evId)?.evento_id || evId), apresentacao_id: evId');
fs.writeFileSync(file, c);
