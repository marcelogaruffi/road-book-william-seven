const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let envContent = '';
if (fs.existsSync('.env.local')) envContent += fs.readFileSync('.env.local', 'utf-8') + '\n';
else if (fs.existsSync('.env')) envContent += fs.readFileSync('.env', 'utf-8');

const urlMatch = envContent.match(/VITE_SUPABASE_URL=[\"']?(.*?)[\"']?(?:\r|\n|$)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=[\"']?(.*?)[\"']?(?:\r|\n|$)/);

if (!urlMatch || !keyMatch) {
  console.log("Could not find supabase credentials");
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data: rbs, error: rbError } = await supabase.from('roadbooks').select('evento_id, programacao');
  const { data: evs } = await supabase.from('eventos').select('id, data, horario, local');
  const { data: aps } = await supabase.from('evento_apresentacoes').select('evento_id, data, horario');

  let count = 0;

  for (const rb of rbs || []) {
    if (!rb.evento_id || !rb.programacao) continue;
    
    let prog = [];
    try {
      prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao;
    } catch(e) {}
    
    const presentations = prog.filter(p => p.titulo === 'Apresentação' || p.tipo === 'Apresentação');
    
    for (const p of presentations) {
      const exists = aps?.some(a => a.evento_id === rb.evento_id && a.data === p.data && (a.horario === p.hora_inicio || !p.hora_inicio));
      if (!exists && p.data) {
        const payload = {
          evento_id: rb.evento_id,
          data: p.data,
          horario: p.hora_inicio || '20:00',
          local: p.local || ''
        };
        await supabase.from('evento_apresentacoes').insert(payload);
        count++;
        console.log(`Inserted presentation for event ${rb.evento_id}: ${p.data} ${p.hora_inicio}`);
      }
    }
  }

  for (const ev of (evs || [])) {
     const hasAny = aps?.some(a => a.evento_id === ev.id) || count > 0;
     if (!hasAny) {
        const payload = {
          evento_id: ev.id,
          data: ev.data || '2099-01-01',
          horario: ev.horario || '20:00',
          local: ev.local || ''
        };
        await supabase.from('evento_apresentacoes').insert(payload);
        count++;
        console.log(`Inserted default presentation for event ${ev.id}`);
     }
  }

  console.log(`Done. Inserted ${count} missing presentations.`);
}

run();
