import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vaavzyudbxqcmtlbposs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYXZ6eXVkYnhxY210bGJwb3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjcwNzgsImV4cCI6MjA5NzY0MzA3OH0._lAuJAUAkHRDQMCYs0l5QQo41V5EifA_zsXumqda7fM');
async function check() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log(data, error);
}
check();
