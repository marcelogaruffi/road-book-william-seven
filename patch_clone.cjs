const fs = require('fs');

const files = [
  { path: 'src/routes/_authenticated/som.index.tsx', table: 'mapas_som' },
  { path: 'src/routes/_authenticated/iluminacao.index.tsx', table: 'mapas_luz' },
  { path: 'src/routes/_authenticated/video.index.tsx', table: 'mapas_video' }
];

files.forEach(({ path, table }) => {
  if (!fs.existsSync(path)) return;
  let c = fs.readFileSync(path, 'utf-8');

  // Replace query to use apresentacao_id for clone
  c = c.replace(
    new RegExp(`\\.from\\('${table}'\\)\\s*\\.select\\('json_data'\\)\\s*\\.eq\\('evento_id', selectedCloneId\\)`, 'g'),
    `.from('${table}').select('json_data').eq('apresentacao_id', selectedCloneId)`
  );

  fs.writeFileSync(path, c);
  console.log('Patched ' + path);
});
