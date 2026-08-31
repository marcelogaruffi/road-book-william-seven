
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: templateData } = await supabase.from('templates_espetaculos').select('rider_som').like('nome_espetaculo', '%Ma%');
  if (templateData && templateData.length > 0) {
    const str = templateData[0].rider_som;
    fs.writeFileSync('rider_som_test.txt', typeof str === 'string' ? str : JSON.stringify(str, null, 2));
    console.log('Saved to rider_som_test.txt');
  }
}
run();

