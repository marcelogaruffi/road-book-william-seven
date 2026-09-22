const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: aps } = await supabase.from('evento_apresentacoes').select('evento_id').limit(1);
  console.log("evento_apresentacoes evento_id type:", typeof aps?.[0]?.evento_id, aps);
  
  const { data: evts } = await supabase.from('eventos').select('id').limit(1);
  console.log("eventos id type:", typeof evts?.[0]?.id, evts);
}
run();
