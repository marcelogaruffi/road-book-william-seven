const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function search() {
  const { data } = await supabase.from('roadbooks').select('id, programacao');
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try { prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao; } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
        const hasEntrevista = JSON.stringify(prog).toLowerCase().includes('entrevista');
        if (hasEntrevista) {
             console.log("--- ROADBOOK ---");
             // find all places or travel strings to deduce city
             const places = prog.map(p => p.local || p.titulo).filter(Boolean).join(" | ");
             console.log("Locals/Titles:", places);
             
             prog.forEach(item => {
                const act = (item.tipo || item.titulo || '').toLowerCase();
                if (act.includes('entrevista')) {
                    console.log(`ENTREVISTA -> Data: ${item.data}, Início: ${item.hora_inicio}, Fim: ${item.hora_fim}, Local: ${item.local}, Título: ${item.titulo}`);
                }
             });
        }
    }
  }
}
search();
