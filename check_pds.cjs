const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=\"(.*?)\"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=\"(.*?)\"/)[1];
const s = createClient(url, key);
async function run() {
  const {data: p, error} = await s.from('eventos').select('id, cidade, data, horario');
  console.log(error);
  if(p) console.log(JSON.stringify(p.filter(x => x.cidade && x.cidade.includes('Poconé')), null, 2));
}
run();
