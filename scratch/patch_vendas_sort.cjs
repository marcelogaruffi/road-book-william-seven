const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const regex = /const vendasFiltradas = vendaFiltroEvento === "todos" \? vendas : vendas\.filter\(v => v\.evento_id === vendaFiltroEvento\);/g;

const replacement = `const vendasFiltradas = (vendaFiltroEvento === "todos" ? vendas : vendas.filter(v => v.evento_id === vendaFiltroEvento)).sort((a, b) => {
    const dataA = new Date(a.data_venda || a.evento?.data || a.created_at || 0).getTime();
    const dataB = new Date(b.data_venda || b.evento?.data || b.created_at || 0).getTime();
    return dataB - dataA; // do maior pro menor
  });`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
