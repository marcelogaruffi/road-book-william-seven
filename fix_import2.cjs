const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');

// Undo the bad regex
c = c.replace(/\(val\) => new Intl\.NumberFormat\("pt-BR", \{ style: "currency", currency: "BRL" \}\)\.format\(val\)\(/g, 'formatCurrency(');

// Add the helper function
c = c.replace('export function NotasBoletosTab', 'const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);\n\nexport function NotasBoletosTab');

fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
console.log("Fixed proper formatCurrency");
