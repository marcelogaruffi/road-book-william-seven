const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

content = content.replace(/\s*\}\n\s*\}\n\s*async function handleAddVenda/g, '\n  }\n\n  async function handleAddVenda');

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
