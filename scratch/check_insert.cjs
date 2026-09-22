const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const payload = {
    veiculo: 'Teste',
    titulo_materia: 'Teste',
    link_materia: 'https://teste.com',
    data_publicacao: '2025-01-01',
    sentimento: 'neutro',
    espetaculo: ''
  };
  const { data, error } = await supabase.from('imprensa_clipping').insert([payload]).select().single();
  console.log("Empty espetaculo insert error:", error ? error.message : "Success");
  
  if (data) {
     await supabase.from('imprensa_clipping').delete().eq('id', data.id);
  }
}
check();
