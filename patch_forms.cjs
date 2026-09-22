const fs = require('fs');

const files = [
  { path: 'src/routes/_authenticated/som.$evento_id.tsx', table: 'mapas_som' },
  { path: 'src/routes/_authenticated/iluminacao.$evento_id.tsx', table: 'mapas_luz' },
  { path: 'src/routes/_authenticated/video.$evento_id.tsx', table: 'mapas_video' },
  { path: 'src/routes/_authenticated/som-operacao.$evento_id.tsx', table: 'mapas_som' }
];

files.forEach(({ path, table }) => {
  if (!fs.existsSync(path)) return;
  let c = fs.readFileSync(path, 'utf-8');

  // Replace query to use apresentacao_id
  c = c.replace(
    new RegExp(`supabase\\.from\\('${table}'\\)\\.select\\('\\*'\\)\\.eq\\('evento_id', evento_id\\)`, 'g'),
    `supabase.from('${table}').select('*').eq('apresentacao_id', evento_id)`
  );

  fs.writeFileSync(path, c);
  console.log('Patched ' + path);
});
