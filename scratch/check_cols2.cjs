const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { error } = await supabase.from('imprensa_clipping').select('sentimento, thumbnail_url, relevancia_geo, relevancia_publico, relevancia_autoridade, relevancia_cta, relevancia_score, relevancia_tier, tags').limit(1);
  console.log(error ? error.message : 'All columns exist');
}
check();
