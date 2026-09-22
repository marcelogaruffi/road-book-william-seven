const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const debugUI = `
        <div className="bg-red-100 text-red-900 p-4 font-mono text-xs rounded-xl mb-4 border border-red-300">
          <strong>DEBUG INFO PARA O PROGRAMADOR:</strong><br/>
          - Vendas no estado (vendas.length): {vendas.length}<br/>
          - Sessões processadas (sessoes.length): {sessoes.length}<br/>
          - Filtro atual: {vendaFiltroEvento}<br/>
          - Vendas após filtro (vendasFiltradas.length): {vendasFiltradas.length}<br/>
          - Sessões brutas carregadas do banco: {typeof window !== "undefined" ? (window as any).debugAprLength : "?"}<br/>
          - Vendas brutas carregadas do banco: {typeof window !== "undefined" ? (window as any).debugVendLength : "?"}
        </div>
        <div className="flex gap-2">
`;

// Insert the debug UI right before the Excel/PDF buttons
content = content.replace(/<div className="flex gap-2">/, debugUI);

// Save the raw lengths to the window object in fetchDados
const fetchDadosTry = `if (aprRes.data) { (window as any).debugAprLength = aprRes.data.length; } else { (window as any).debugAprLength = 'ERROR/NULL'; }
      if (vendRes.data) { (window as any).debugVendLength = vendRes.data.length; } else { (window as any).debugVendLength = 'ERROR/NULL'; }`;

content = content.replace(/if \(prodRes\.error\) toast\.error/, fetchDadosTry + '\n      if (prodRes.error) toast.error');

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Injected Debug UI");
