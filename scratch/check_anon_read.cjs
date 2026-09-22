const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/estoque_global`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY }});
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
