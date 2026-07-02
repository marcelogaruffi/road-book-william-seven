const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: rb, error: fetchErr } = await supabase.from('roadbooks').select('id, programacao, espetaculo').limit(1).single();
  if (fetchErr) { console.error('FETCH ERR', fetchErr); return; }
  
  console.log('Original programacao length:', Array.isArray(rb.programacao) ? rb.programacao.length : 'not array');
  
  const testPayload = [...(rb.programacao || []), { titulo: 'TEST_API_UPDATE' }];
  
  const { error: updateErr } = await supabase.from('roadbooks').update({ programacao: testPayload }).eq('id', rb.id);
  if (updateErr) { console.error('UPDATE ERR', updateErr); return; }
  
  const { data: rb2, error: fetchErr2 } = await supabase.from('roadbooks').select('id, programacao').eq('id', rb.id).single();
  const lastItem = rb2.programacao[rb2.programacao.length - 1];
  console.log('Updated programacao length:', Array.isArray(rb2.programacao) ? rb2.programacao.length : 'not array');
  console.log('Last item:', lastItem);
  
  // Revert
  await supabase.from('roadbooks').update({ programacao: rb.programacao }).eq('id', rb.id);
  console.log('Reverted.');
})();
