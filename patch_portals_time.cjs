const fs = require('fs');
const files = [
  'src/routes/_authenticated/som.index.tsx',
  'src/routes/_authenticated/som-operacao.index.tsx',
  'src/routes/_authenticated/iluminacao.index.tsx',
  'src/routes/_authenticated/video.index.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf-8');
  c = c.replace(
    /\{evento\.data \? new Date\(evento\.data \+ 'T12:00:00'\)\.toLocaleDateString\('pt-BR'\) : 'Data Indefinida'\}/g,
    "{evento.data ? new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data Indefinida'} {evento.horario ? `às ${evento.horario}` : ''}"
  );
  fs.writeFileSync(f, c);
  console.log('Patched ' + f);
});
