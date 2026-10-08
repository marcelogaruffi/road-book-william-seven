const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');

c = c.replace(
    'valor: parseFloat(novoValor.replace(/\\./g, "").replace(",", ".")) || 0,',
    'valor: parseInt(novoValor.replace(/\\D/g, "") || "0", 10) / 100,'
);

fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
console.log("Fixed parse");
