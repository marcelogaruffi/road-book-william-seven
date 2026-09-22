const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: tours } = await supabase.from('tours').select('id, nome, espetaculo');
  console.log("TOURS:");
  console.table(tours);
  
  const { data: templates } = await supabase.from('templates_espetaculos').select('id, nome_espetaculo');
  console.log("TEMPLATES:");
  console.table(templates);
}
check();
