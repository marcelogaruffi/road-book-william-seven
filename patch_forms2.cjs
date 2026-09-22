const fs = require('fs');

const files = [
  { path: 'src/routes/_authenticated/som.$evento_id.tsx', table: 'mapas_som' },
  { path: 'src/routes/_authenticated/iluminacao.$evento_id.tsx', table: 'mapas_luz' },
  { path: 'src/routes/_authenticated/video.$evento_id.tsx', table: 'mapas_video' }
];

files.forEach(({ path, table }) => {
  if (!fs.existsSync(path)) return;
  let c = fs.readFileSync(path, 'utf-8');

  // Replace query to use apresentacao_id
  c = c.replace(
    new RegExp(`supabase\\.from\\('${table}'\\)\\.select\\('\\*'\\)\\.eq\\('evento_id', evento_id\\)`, 'g'),
    `supabase.from('${table}').select('*').eq('apresentacao_id', evento_id)`
  );
  
  c = c.replace(
    /supabase\.from\('eventos'\)\.select\('\*'\)\.eq\('id', evento_id\)\.single\(\)/g,
    `supabase.from('evento_apresentacoes').select('id, data, horario, eventos(cidade, espetaculo)').eq('id', evento_id).single()`
  );
  
  c = c.replace(
    /mapaRes\.data\.cidade = evRes\.data\.cidade;/g,
    `mapaRes.data.cidade = evRes.data.eventos?.cidade;`
  );
  
  c = c.replace(
    /mapaRes\.data\.espetaculo = evRes\.data\.espetaculo;/g,
    `mapaRes.data.espetaculo = evRes.data.eventos?.espetaculo;`
  );

  fs.writeFileSync(path, c);
  console.log('Patched ' + path);
});
