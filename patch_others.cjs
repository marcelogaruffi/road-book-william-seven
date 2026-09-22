const fs = require('fs');
const files = [
  'src/routes/_authenticated/partituras.index.tsx',
  'src/routes/_authenticated/figurinos.index.tsx',
  'src/routes/_authenticated/camarins.index.tsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf-8');
  c = c.replace(/\.eq\(\"evento_id\", eventoId\)/g, '.eq("apresentacao_id", eventoId)');
  c = c.replace(/evento_id: eventoId/g, 'evento_id: (apresentacoes.find(a => a.id === eventoId)?.evento_id || eventoId), apresentacao_id: eventoId');
  fs.writeFileSync(file, c);
});
