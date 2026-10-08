const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');
c = c.replace(/formatCurrency/g, 'fmtCurrency');
c = c.replace('const fmtCurrency = (val: number) =>', 'const formatCurrency = (val: number) =>');
// Let me just replace the global formatCurrency calls
fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
