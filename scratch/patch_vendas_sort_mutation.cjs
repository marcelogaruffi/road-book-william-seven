const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const regex = /const vendasFiltradas = \(vendaFiltroEvento === "todos" \? vendas : vendas\.filter\(v => v\.evento_id === vendaFiltroEvento\)\)\.sort/g;
const replacement = 'const vendasFiltradas = [...(vendaFiltroEvento === "todos" ? vendas : vendas.filter(v => v.evento_id === vendaFiltroEvento))].sort';

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
  console.log("Fixed sort mutation!");
} else {
  console.log("Could not find regex!");
}
