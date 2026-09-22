import fs from 'fs';
import { Client } from 'pg';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, l) => {
  const [k, ...v] = l.split('=');
  if(k) acc[k.trim()] = v.join('=').trim().replace(/["']/g, '');
  return acc;
}, {});

// Get DB URL from process env, maybe SUPABASE_DB_URL or we format it.
// Actually, we can just execute SQL using Supabase REST API via rpc if we have one. But we don't.
// Wait, I can execute SQL through pg using postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
// Let's check if SUPABASE_DB_URL is in .env
console.log(Object.keys(env));
