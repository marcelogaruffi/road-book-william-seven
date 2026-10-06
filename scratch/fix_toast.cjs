const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/partituras.index.tsx', 'utf8');

code = code.replace(
  'toast.error("Erro ao importar arquivos padrÃ£o");',
  'toast.error("Erro BD: " + (error.message || "desconhecido"));'
);

fs.writeFileSync('src/routes/_authenticated/partituras.index.tsx', code, 'utf8');
console.log('Fixed error toast');
