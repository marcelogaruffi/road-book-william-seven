
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: templateData } = await supabase.from('templates_espetaculos').select('*');
  console.log('Total templates:', templateData?.length);
  for (const t of templateData || []) {
    let r = t.rider_som;
    if (typeof r === 'string') {
      try { r = JSON.parse(r); } catch (e) {}
    }
    if (r?.cues_lista && r.cues_lista.length > 0) {
      console.log('Found in template:', t.nome_espetaculo, 'Cues:', r.cues_lista.length);
    }
  }
}
run();

