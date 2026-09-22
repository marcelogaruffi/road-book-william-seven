const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const [vendRes] = await Promise.all([
    supabase.from("vendas_registros").select("*, produto:vendas_produtos(nome), evento:eventos(cidade, local, data)").order("data_venda", { ascending: false }),
  ]);
  
  if (vendRes.error) {
    console.error("Query Error:", vendRes.error);
  } else {
    console.log("Vendas fetched:", vendRes.data.length);
  }
}
testQuery();
