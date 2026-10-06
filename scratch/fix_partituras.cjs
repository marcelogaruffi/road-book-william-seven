const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/partituras.index.tsx', 'utf8');

code = code.replace(
  'supabase.from("evento_apresentacoes").select("id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)")', 
  'supabase.from("eventos").select("id, data, local, cidade, espetaculo")'
);

code = code.replace(/apr\.eventos\?\.espetaculo/g, 'apr.espetaculo');
code = code.replace(/apr\.eventos\?\.cidade/g, 'apr.cidade');
code = code.replace(/apr\.eventos\.espetaculo/g, 'apr.espetaculo');
code = code.replace(/apr\.eventos\.cidade/g, 'apr.cidade');
code = code.replace(/const evt = apr\?\.eventos;/g, 'const evt = apr;');
code = code.replace(/evento_id: apr\.evento_id/g, 'evento_id: apr.id');

fs.writeFileSync('src/routes/_authenticated/partituras.index.tsx', code, 'utf8');
console.log('Fixed partituras');
