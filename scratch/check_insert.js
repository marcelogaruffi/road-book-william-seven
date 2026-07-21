import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('mapas_luz').insert({
    evento_id: '00000000-0000-0000-0000-000000000000', // invalid uuid will probably trigger foreign key constraint error, which is fine to see the error
    cidade: 'Teste',
    data_apresentacao: '2025-01-01',
    espetaculo: 'Teste',
    json_data: {}
  }).select();
  console.log("INSERT RESULT:", { data, error });
}
check();
