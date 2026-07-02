const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="(.*?)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('roadbooks').select('id, slug, espetaculo, programacao, automacoes');
  if (error) console.error(error);
  else {
    data.forEach(r => {
      const progLen = Array.isArray(r.programacao) ? r.programacao.length : 0;
      const hotelExtrasProg = Array.isArray(r.automacoes?.hotel_extras) ? r.automacoes.hotel_extras.length : 0;
      console.log(`Roadbook ${r.espetaculo} (${r.slug}): prog=${progLen}, automacoes.hotel_extras=${hotelExtrasProg}`);
    });
  }
})();
