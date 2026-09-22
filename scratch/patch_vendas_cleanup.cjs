const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Remover a função restaurarHistoricoPerdido
const funcRegex = /async function restaurarHistoricoPerdido\(\) \{[\s\S]*?\}\s*async function fetchDados/m;
content = content.replace(funcRegex, 'async function fetchDados');

// Remover o botão injetado (que se chama Injetar Aracaju (Faltante) agora)
const buttonRegex = /<Button variant="default" onClick=\{restaurarHistoricoPerdido\}[\s\S]*?<\/Button>\s*/;
content = content.replace(buttonRegex, '');

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Cleaned up vendas.tsx");
