const fs = require('fs');
let code = fs.readFileSync('src/components/GridEventos.tsx', 'utf8');

code = code.replace(
  'supabase.from("eventos").select("id, data, cidade, estado, local, espetaculo")',
  'supabase.from("eventos").select("id, data, cidade, local, espetaculo")'
);

fs.writeFileSync('src/components/GridEventos.tsx', code, 'utf8');
