import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const [ { data: t }, { data: e }, { data: tp }, { data: r } ] = await Promise.all([
    supabase.from('tours').select('id, logo_producao'),
    supabase.from('eventos').select('id, produtora_logo_url'),
    supabase.from('templates_espetaculos').select('id, logo_espetaculo_url, logo_cia_url'),
    supabase.from('roadbooks').select('id, logo_espetaculo_override, logo_cia_override, logo_producao_override')
  ]);

  const urls = new Set();
  t?.forEach(i => i.logo_producao && urls.add(i.logo_producao));
  e?.forEach(i => i.produtora_logo_url && urls.add(i.produtora_logo_url));
  tp?.forEach(i => {
    if (i.logo_espetaculo_url) urls.add(i.logo_espetaculo_url);
    if (i.logo_cia_url) urls.add(i.logo_cia_url);
  });
  r?.forEach(i => {
    if (i.logo_espetaculo_override) urls.add(i.logo_espetaculo_override);
    if (i.logo_cia_override) urls.add(i.logo_cia_override);
    if (i.logo_producao_override) urls.add(i.logo_producao_override);
  });

  console.log("ALL URLS:");
  Array.from(urls).forEach(u => console.log(u));
}

check();
