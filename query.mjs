import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, l) => {
  const [k, ...v] = l.split('=');
  if(k) acc[k.trim()] = v.join('=').trim().replace(/["']/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY);
supabase.from('tours').select('id,nome,slug,roadbooks(cidade)').ilike('slug', '%pantanal%').then(r => console.log(JSON.stringify(r.data, null, 2)));
