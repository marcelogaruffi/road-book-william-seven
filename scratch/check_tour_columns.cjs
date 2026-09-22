const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('tours').select('*').limit(1);
  console.log("Tour columns:", Object.keys(data[0]));
}

check();
