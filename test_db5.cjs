const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1].trim();

(async () => {
  const res = await fetch(supabaseUrl + '/rest/v1/', {
    headers: { apikey: supabaseKey }
  });
  const data = await res.json();
  const rb = data.definitions.roadbooks.properties;
  console.log(Object.keys(rb));
})();
