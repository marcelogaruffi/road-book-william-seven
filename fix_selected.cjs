const fs = require('fs');
const files = [
  'src/routes/_authenticated/som.index.tsx',
  'src/routes/_authenticated/som-operacao.index.tsx',
  'src/routes/_authenticated/iluminacao.index.tsx',
  'src/routes/_authenticated/camarins.index.tsx',
  'src/routes/_authenticated/figurinos.index.tsx',
  'src/routes/_authenticated/partituras.index.tsx',
  'src/routes/_authenticated/video.index.tsx',
  'src/routes/_authenticated/checklist.tsx',
  'src/routes/_authenticated/palco.index.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  if (!c.includes('const [selectedEventoId, setSelectedEventoId]')) {
    // Remove the injected lines
    c = c.replace('const currentApr = apresentacoes.find(a => a.id === selectedEventoId);\n    const realEventoId = currentApr ? currentApr.evento_id : selectedEventoId;', '');
    console.log(`Cleaned injected lines from ${file}`);
  }
  fs.writeFileSync(file, c);
});
