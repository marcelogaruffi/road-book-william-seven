import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('mapas_luz').select('*').limit(1);
  if (error) {
    console.log("ERROR:", error.message);
  } else {
    console.log("TABLE EXISTS. Row count:", data.length);
  }
}
check();
