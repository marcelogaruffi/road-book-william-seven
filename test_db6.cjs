const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: rb, error: fetchErr } = await supabase.from('roadbooks').select('id, programacao').limit(1).single();
  
  const testPayload = { automacoes: { hotel_extras: [{ titulo: 'GENERATED_TEST' }] } };
  
  const { error: updateErr } = await supabase.from('roadbooks').update(testPayload).eq('id', rb.id);
  if (updateErr) { console.error('UPDATE ERR', updateErr); return; }
  
  const { data: rb2, error: fetchErr2 } = await supabase.from('roadbooks').select('id, programacao, automacoes').eq('id', rb.id).single();
  console.log('Programacao length:', Array.isArray(rb2.programacao) ? rb2.programacao.length : 'not array', rb2.programacao);
  
  // Revert
  await supabase.from('roadbooks').update({ automacoes: {} }).eq('id', rb.id);
})();
