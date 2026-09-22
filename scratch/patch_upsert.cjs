const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const oldSaveCall = /const \{ data, error \} = await supabase\.from\('imprensa_clipping'\)\.upsert\(payload\)\.select\(\)\.single\(\);/;

const newSaveCall = `    let data, error;
    if (payload.id) {
      const res = await supabase.from('imprensa_clipping').update(payload).eq('id', payload.id).select().single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase.from('imprensa_clipping').insert([payload]).select().single();
      data = res.data;
      error = res.error;
    }`;

code = code.replace(oldSaveCall, newSaveCall);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log("Patched upsert to insert/update");
