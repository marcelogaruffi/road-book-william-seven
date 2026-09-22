const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPortoAlegre() {
  const { data } = await supabase.from('roadbooks').select('id, programacao');
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try { prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao; } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
        const text = JSON.stringify(prog).toLowerCase();
        if (text.includes('porto alegre') || text.includes('poa')) {
             console.log("--- ROADBOOK PORTO ALEGRE ---");
             prog.forEach(item => {
                const act = (item.tipo || item.titulo || '').toLowerCase();
                console.log(`Data: ${item.data}, Início: ${item.hora_inicio}, Tipo: ${item.tipo}, Título: ${item.titulo}, Local: ${item.local}`);
             });
        }
    }
  }
}
checkPortoAlegre();
