const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function tryDelete() {
  const { data: tour, error: fetchErr } = await supabase.from('tours').select('*').eq('nome', 'Junho').maybeSingle();
  if (!tour) {
    console.log("Turnê Junho não encontrada");
    return;
  }
  console.log("Deleting tour ID:", tour.id);
  const { error } = await supabase.from('tours').delete().eq('id', tour.id);
  console.log("Delete error:", error);
}

tryDelete();
