const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/partituras.index.tsx', 'utf8');

code = code.replace(/apresentacao_id: selectedEventoId,/g, '');

code = code.replace(
  /toast\.error\("Erro ao importar arquivos padrÃ£o"\);/g,
  'toast.error("Erro BD: " + (error.message || error.code || "desconhecido"));'
);

// We also need to fix handleAddArquivo if it uses apresentacao_id
code = code.replace(/apresentacao_id: selectedEventoId,/g, '');

// We also need to fetch by evento_id instead of apresentacao_id!
code = code.replace(
  /\.eq\("apresentacao_id", eventoId\)/g,
  '.eq("evento_id", eventoId)'
);

fs.writeFileSync('src/routes/_authenticated/partituras.index.tsx', code, 'utf8');
console.log('Fixed DB payload');
