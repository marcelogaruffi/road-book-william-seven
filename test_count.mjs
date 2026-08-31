
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const supabaseKey = env.match(/SUPABASE_ANON_KEY="([^"]+)"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authData } = await supabase.auth.signUp({
    email: 'admin_test_query_8_' + Date.now() + '@williamseven.com',
    password: 'senha_super_secreta_123',
  });
  
  const { count, error } = await supabase.from('mapas_som').select('*', { count: 'exact', head: true });
  console.log('Total mapas_som:', count);
}
run();

