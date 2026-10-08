import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  try {
    const { data } = await supabase.from('templates_espetaculos').select('*').eq('nome_espetaculo', undefined).maybeSingle();
    console.log("No crash", data);
  } catch (e) {
    console.log("CRASHED", e.message);
  }
}
run();
