const fs = require('fs');

const files = [
  { path: 'src/routes/_authenticated/som.index.tsx', table: 'mapas_som', pathPrefix: 'som' },
  { path: 'src/routes/_authenticated/som-operacao.index.tsx', table: 'mapas_som', pathPrefix: 'som-operacao' },
  { path: 'src/routes/_authenticated/iluminacao.index.tsx', table: 'mapas_luz', pathPrefix: 'iluminacao' },
  { path: 'src/routes/_authenticated/video.index.tsx', table: 'mapas_video', pathPrefix: 'video' }
];

files.forEach(({ path, table, pathPrefix }) => {
  let c = fs.readFileSync(path, 'utf-8');

  // Change the fetch
  c = c.replace(
    /supabase\.from\(['"]eventos['"]\)\.select\(['"]\*['"]\)\.order\(['"]data['"],\s*\{\s*ascending:\s*true\s*\}\)/g,
    `supabase.from('evento_apresentacoes').select('id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)').order('data', { ascending: true })`
  );
  
  c = c.replace(
    new RegExp(`supabase\\.from\\(['"]${table}['"]\\)\\.select\\(['"]id, evento_id['"]\\)`),
    `supabase.from('${table}').select('id, evento_id, apresentacao_id')`
  );

  // Change mapping
  c = c.replace(
    /let finalEv = evRes\.data as Evento\[\];/g,
    `let finalEv = (evRes.data as any[]).map(a => ({
        id: a.id,
        evento_id: a.evento_id,
        data: a.data,
        horario: a.horario,
        cidade: a.eventos?.cidade,
        espetaculo: a.eventos?.espetaculo,
        equipe: a.eventos?.equipe || []
      })) as any[];`
  );

  // Change insert maps logic (apresentacao_id)
  c = c.replace(
    /evento_id:\s*evento\.id,/g,
    `evento_id: evento.evento_id || evento.id,\n      apresentacao_id: evento.id,`
  );

  // Change the hasMapa logic
  c = c.replace(
    /const hasMapa = mapas\.some\(m => m\.evento_id === evento\.id\);/g,
    `const hasMapa = mapas.some(m => m.apresentacao_id === evento.id);`
  );

  fs.writeFileSync(path, c);
  console.log('Patched ' + path);
});
