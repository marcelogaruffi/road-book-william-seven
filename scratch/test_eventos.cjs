const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?(\n|$)/)?.[1]?.replace(/\"/g, "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEventos() {
  const { data, error } = await supabase.from('eventos').select('id, cidade, data, apresentacoes').order('data', { ascending: false });
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Total events fetched:", data.length);
  const allSess = [];
  try {
    data.forEach(evt => {
      let aps = evt.apresentacoes;
      if (typeof aps === 'string') {
        try { aps = JSON.parse(aps); } catch(e) { aps = []; }
      }
      if (Array.isArray(aps) && aps.length > 0) {
        aps.forEach((ap) => {
          const dt = ap.data || evt.data;
          let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
          allSess.push({ cidade: evt.cidade, dt });
        });
      } else {
        let dObj2 = new Date((evt.data || '').substring(0, 10) + 'T12:00:00Z');
        allSess.push({ cidade: evt.cidade, dt: evt.data });
      }
    });
    console.log("Processed sessions:", allSess.map(s => s.cidade).join(', '));
  } catch (e) {
    console.error("CRASH DURING PROCESSING:", e);
  }
}
testEventos();
