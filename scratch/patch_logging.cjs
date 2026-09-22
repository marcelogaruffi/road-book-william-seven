const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// I will add a console.log or toast.error with the actual Supabase error so we know what's happening.
code = code.replace(
  "toast.error('Erro ao salvar clipping');",
  "toast.error('Erro ao salvar clipping: ' + error.message); console.error(error);"
);

// I will also remove the `setNewClipping` inside the saveClipping, because modifying state while saving might cause an infinite loop or re-render issues in some edge cases.
// Instead, just pass `urlToFetch` to the payload.

code = code.replace(
  "setNewClipping({...newClipping, link_materia: urlToFetch});",
  "// setNewClipping({...newClipping, link_materia: urlToFetch});"
);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log("Patched error logging");
