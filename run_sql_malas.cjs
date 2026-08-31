const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = "https://vaavzyudbxqcmtlbposs.supabase.co";
const service = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYXZ6eXVkYnhxY210bGJwb3NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NzA3OCwiZXhwIjoyMDk3NjQzMDc4fQ.crft7vw8Fp_oxWZmN-p5VAkkONdJCitGd5RGlcekMBA";

const supabase = createClient(url, service);

async function run() {
  const sql = `
  ALTER TABLE templates_espetaculos ADD COLUMN IF NOT EXISTS rider_malas JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE eventos ADD COLUMN IF NOT EXISTS check_malas JSONB DEFAULT '[]'::jsonb;
  `;
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error("RPC exec_sql failed:", error.message);
  } else {
    console.log("exec_sql Success:", data);
  }
}

run();
