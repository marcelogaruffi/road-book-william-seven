const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findInterview() {
  const { data } = await supabase.from('roadbooks').select('id, programacao');
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try { prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao; } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
      prog.forEach(item => {
        const text = JSON.stringify(item).toLowerCase();
        if (text.includes('poa') || text.includes('alegre') || text.includes('gravata')) {
           if (text.includes('entrevista') || text.includes('radio') || text.includes('tv') || text.includes('jornal') || text.includes('imprensa') || text.includes('programa')) {
               console.log("MATCH:", item);
           }
        }
      });
    }
  }
}
findInterview();
