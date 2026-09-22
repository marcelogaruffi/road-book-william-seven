const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');
t = t.replace("const { data: upsertedAps } = await supabase.from('evento_apresentacoes').upsert(toUpsert, { onConflict: 'id' }).select();", "const { data: upsertedAps, error: upsertErr } = await supabase.from('evento_apresentacoes').upsert(toUpsert.map(u => { const ret = {...u}; if(!ret.id) delete ret.id; return ret; })).select();\n             if (upsertErr) { toast.error('Erro no BD (Apresentacoes): ' + upsertErr.message); console.error(upsertErr); return; }");
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', t);
console.log('Fixed');
