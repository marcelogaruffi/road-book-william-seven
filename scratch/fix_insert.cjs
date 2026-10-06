const fs = require('fs');

const files = [
  { file: 'som.index.tsx', table: 'mapas_som' },
  { file: 'video.index.tsx', table: 'mapas_video' },
  { file: 'iluminacao.index.tsx', table: 'mapas_luz' }
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f.file, 'utf8');
  
  // The target insert block looks something like:
  // const { data, error } = await supabase.from('mapas_som').insert({
  //   evento_id: (evento as any).evento_id || evento.id,
  //   apresentacao_id: evento.id,
  //   user_id: userData.user?.id,
  //   cidade: evento.cidade,
  //   data_apresentacao: evento.data,
  //   espetaculo: evento.espetaculo,
  //   json_data: initialJsonData
  // }).select().single();

  const targetRegex = new RegExp(`const \\{ data, error \\} = await supabase\\.from\\('${f.table}'\\)\\.insert\\(\\{[\\s\\S]*?\\}\\)\\.select\\(\\)\\.single\\(\\);`);
  
  if (!targetRegex.test(code)) {
    console.log(`Could not find insert block in ${f.file}`);
    continue;
  }
  
  const replacement = `let apId = evento.id;
    const { data: apData } = await supabase.from('evento_apresentacoes').select('id').eq('evento_id', evento.id).limit(1).maybeSingle();
    if (apData) {
      apId = apData.id;
    } else {
      const { data: newAp } = await supabase.from('evento_apresentacoes').insert({
        evento_id: evento.id,
        data: evento.data || new Date().toISOString().split('T')[0],
        horario: evento.horario || '12:00',
        cidade: evento.cidade || 'Indefinida',
        local: evento.local || 'Indefinido'
      }).select('id').single();
      if (newAp) apId = newAp.id;
    }

    const { data, error } = await supabase.from('${f.table}').insert({
      evento_id: evento.id,
      apresentacao_id: apId,
      user_id: userData.user?.id,
      cidade: evento.cidade,
      data_apresentacao: evento.data,
      espetaculo: evento.espetaculo,
      json_data: initialJsonData
    }).select().single();`;
    
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('src/routes/_authenticated/' + f.file, code, 'utf8');
  console.log(`Replaced in ${f.file}`);
}
