const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const { data: aps, error } = await supabase.from("evento_apresentacoes").select("*");
  console.log("evento_apresentacoes:", aps?.length || error);
  if (aps && aps.length > 0) {
      console.log(aps);
  }
}
testQuery();
