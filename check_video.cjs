const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
// read url and key from .env
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('mapas_video').select('*').limit(1);
  console.log("DATA:", data);
  console.log("ERROR:", error);
}
check();
