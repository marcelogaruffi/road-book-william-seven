const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=\"(.*?)\"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=\"(.*?)\"/)[1];
const s = createClient(url, key);
async function run() {
  const {data} = await s.from('evento_apresentacoes').select('*');
  console.log('Apresentacoes: ' + (data ? data.length : 'null'));
  const {data: e} = await s.from('eventos').select('id, cidade');
  console.log('Eventos: ' + (e ? e.length : 'null'));
  const {data: p} = await s.from('eventos').select('programacao').ilike('cidade', '%Poconé%');
  console.log(JSON.stringify(p, null, 2));
}
run();
