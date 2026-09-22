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
  
  for (const rb of data) {
    if (!rb.programacao) continue;
    let prog;
    try {
      prog = typeof rb.programacao === 'string' ? JSON.parse(rb.programacao) : rb.programacao;
    } catch(e) { continue; }
    
    if (Array.isArray(prog)) {
        // Just print the first item of one of them to see the schema
        const hasEntrevista = JSON.stringify(prog).toLowerCase().includes('entrevista');
        if (hasEntrevista) {
             console.log("Cidade:", rb.evento?.cidade);
             console.log("Prog:", JSON.stringify(prog, null, 2));
        }
    }
  }
}
search();
