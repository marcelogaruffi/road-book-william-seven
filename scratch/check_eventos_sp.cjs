const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  const { data: evts, error } = await supabase.from('eventos').select('cidade, data').or('cidade.ilike.%são paulo%,cidade.ilike.%poconé%');
  console.log("Eventos with São Paulo / Poconé:", JSON.stringify(evts, null, 2));
  console.log("Error:", error);
}
checkTables();
