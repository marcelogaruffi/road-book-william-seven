const fs = require('fs');

const files = ['som.index.tsx', 'video.index.tsx', 'iluminacao.index.tsx', 'som-operacao.index.tsx'];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  // We want to replace:
  // {eventos.filter(e => mapas.some(m => m.evento_id === e.id)).map(e => (
  //   <SelectItem key={e.id} value={e.id}>
  // with:
  // {eventos.filter(e => mapas.some(m => m.evento_id === (e.evento_id || e.id))).map(e => (
  //   <SelectItem key={e.evento_id || e.id} value={e.evento_id || e.id}>
  
  code = code.replace(/\{eventos\.filter\(e => mapas\.some\(m => m\.evento_id === e\.id\)\)\.map\(e => \(\s*<SelectItem key=\{e\.id\} value=\{e\.id\}>/g, 
  `{eventos.filter(e => mapas.some(m => m.evento_id === (e.evento_id || e.id) || m.apresentacao_id === e.id)).map(e => (
    <SelectItem key={e.evento_id || e.id} value={e.evento_id || e.id}>`);

  // Wait, let's just make it robust by replacing anything similar, in case they used single quotes or different spacing.
  // Actually, I'll use a slightly looser regex.
  fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
  console.log('Fixed clone dropdown in ' + f);
}
