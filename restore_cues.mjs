
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authData } = await supabase.auth.signUp({
    email: 'admin_test_query_5_' + Date.now() + '@williamseven.com',
    password: 'senha_super_secreta_123',
  });
  
  const { data: mapasData } = await supabase.from('mapas_som').select('id, espetaculo, json_data');
  const withCues = mapasData.filter(m => m.json_data?.cues_lista?.length > 0);
  
  if (withCues.length > 0) {
    const cues = withCues[0].json_data.cues_lista;
    console.log('Found Cues to restore:', cues);
    
    // Now let's fetch the templates_espetaculos row
    const { data: templateData } = await supabase.from('templates_espetaculos').select('*');
    const macan = templateData.find(t => t.nome_espetaculo.includes('Ma'));
    
    if (macan) {
      let rider = macan.rider_som;
      if (typeof rider === 'string') {
         rider = JSON.parse(rider);
      }
      rider.cues_lista = cues;
      
      const { error } = await supabase.from('templates_espetaculos').update({ rider_som: rider }).eq('nome_espetaculo', macan.nome_espetaculo);
      if (error) console.error('Error updating template:', error);
      else console.log('Successfully restored cues to template!');
    }
  } else {
    console.log('No cues found in mapas_som');
  }
}
run();

