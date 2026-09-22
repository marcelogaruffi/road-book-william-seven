import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const [
    { data: t },
    { data: e },
    { data: r },
    { data: tp }
  ] = await Promise.all([
    supabase.from('tours').select('logo_producao'),
    supabase.from('eventos').select('produtora_logo_url'),
    supabase.from('roadbooks').select('logo_espetaculo_override, logo_cia_override, logo_producao_override'),
    supabase.from('templates_espetaculos').select('logo_espetaculo_url, logo_cia_url')
  ]);

  const logos = new Set();
  
  t?.forEach(i => i.logo_producao && logos.add(i.logo_producao));
  e?.forEach(i => i.produtora_logo_url && logos.add(i.produtora_logo_url));
  r?.forEach(i => {
    i.logo_espetaculo_override && logos.add(i.logo_espetaculo_override);
    i.logo_cia_override && logos.add(i.logo_cia_override);
    i.logo_producao_override && logos.add(i.logo_producao_override);
  });
  tp?.forEach(i => {
    i.logo_espetaculo_url && logos.add(i.logo_espetaculo_url);
    i.logo_cia_url && logos.add(i.logo_cia_url);
  });

  console.log('Total unique logos:', logos.size);
  console.log(Array.from(logos).slice(0, 10));
}
run();
