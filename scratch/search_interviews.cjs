const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function search() {
  const { data, error } = await supabase.from('roadbooks').select('id, programacao, evento:eventos(cidade, data)');
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Total roadbooks fetched:", data.length);
  
  const results = [];
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try {
      prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao;
    } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
      prog.forEach(item => {
        const act = (item.atividade || item.descricao || item.title || item.nome || '').toLowerCase();
        if (act.includes('entrevista') || act.includes('tv') || act.includes('radio') || act.includes('rádio') || act.includes('podcast')) {
           results.push({
             cidade: rb.evento?.cidade || 'Desconhecida',
             dataEvento: rb.evento?.data,
             dataAtividade: item.data || item.date || item.dia,
             horario: item.horario || item.hora || item.time,
             descricao: item.atividade || item.descricao || item.title || item.nome
           });
        }
      });
    }
  }
  console.log("JSON_OUTPUT:", JSON.stringify(results, null, 2));
}
search();
