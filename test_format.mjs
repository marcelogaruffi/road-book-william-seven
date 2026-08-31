
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('templates_espetaculos').select('rider_som').like('nome_espetaculo', '%Ma%');
  console.log('Type:', typeof data[0].rider_som);
  if (typeof data[0].rider_som === 'string') {
    console.log('Value substring:', data[0].rider_som.substring(0, 50));
  } else {
    console.log('Value keys:', Object.keys(data[0].rider_som || {}));
  }
}
run();

