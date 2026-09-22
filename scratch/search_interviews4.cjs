const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function search() {
  const { data: evts } = await supabase.from('eventos').select('id, cidade, data');
  const evtsMap = {};
  if (evts) evts.forEach(e => evtsMap[e.id] = e);

  const { data, error } = await supabase.from('roadbooks').select('id, programacao, evento_id');
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const results = [];
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try {
      prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao;
    } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
      prog.forEach(item => {
        const act = (item.tipo || item.titulo || '').toLowerCase();
        if (act.includes('entrevista') || act.includes('tv ') || act.includes('radio') || act.includes('rádio') || act.includes('podcast')) {
           const cidade = evtsMap[rb.evento_id]?.cidade || 'Desconhecida';
           results.push({
             cidade: cidade,
             data: item.data,
             hora_inicio: item.hora_inicio,
             hora_fim: item.hora_fim,
             titulo: item.titulo,
             local: item.local
           });
        }
      });
    }
  }
  console.log("JSON_OUTPUT:", JSON.stringify(results, null, 2));
}
search();
