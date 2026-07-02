const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="(.*?)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('roadbooks').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0]));
})();
