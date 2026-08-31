
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authData } = await supabase.auth.signUp({
    email: 'admin_test_query_3_' + Date.now() + '@williamseven.com',
    password: 'senha_super_secreta_123',
  });
  
  const { data: mapasData } = await supabase.from('mapas_som').select('id, espetaculo, json_data');
  const withCues = mapasData.filter(m => m.json_data?.cues_lista?.length > 0);
  console.log('Total maps with cues:', withCues.length);
  withCues.forEach((m, i) => {
    console.log('--- MAP ' + i + ' ---');
    console.log(JSON.stringify(m.json_data.cues_lista, null, 2));
  });
}
run();

