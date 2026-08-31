const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="(.*?)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('templates_espetaculos').select('*').limit(1);
  if (error) console.error(error);
  else console.log("templates_espetaculos:", Object.keys(data[0] || {}));

  const { data: d2 } = await supabase.from('eventos').select('*').limit(1);
  console.log("eventos:", Object.keys(d2[0] || {}));
})();
