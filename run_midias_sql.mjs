import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = "https://vaavzyudbxqcmtlbposs.supabase.co";
const service = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYXZ6eXVkYnhxY210bGJwb3NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NzA3OCwiZXhwIjoyMDk3NjQzMDc4fQ.crft7vw8Fp_oxWZmN-p5VAkkONdJCitGd5RGlcekMBA";

const supabase = createClient(url, service);

async function run() {
  const sql = fs.readFileSync('c:\\Road Book\\William Seven\\create_midias_tables.sql', 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error("RPC exec_sql failed:", error.message);
    const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { sql: sql });
    if (e2) {
      console.error("RPC execute_sql failed:", e2.message);
    } else {
      console.log("execute_sql Success:", d2);
    }
  } else {
    console.log("exec_sql Success:", data);
  }
}

run();
