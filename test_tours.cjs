const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
let envContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') + '\n' : '';
if (fs.existsSync('.env')) envContent += fs.readFileSync('.env', 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=[\"']?(.*?)[\"']?(?:\r|\n|$)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=[\"']?(.*?)[\"']?(?:\r|\n|$)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const { data, error } = await supabase.from('tours').select('*, eventos(id, data, cidade)');
  console.log(error || data);
}
run();
