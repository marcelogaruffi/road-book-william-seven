import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Conectando ao Supabase:", supabaseUrl);
  
  // Login first to bypass any RLS if necessary, but actually we can just select profiles?
  // Profiles might have RLS that blocks reading if not logged in.
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'marcelo.garuffi@gmail.com',
    password: '818345self',
  });

  if (authError) {
    console.error("Erro de login:", authError.message);
    process.exit(1);
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('email', 'marcelo.garuffi@gmail.com');
  
  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("Perfil:", JSON.stringify(data, null, 2));
  }
}

main();
