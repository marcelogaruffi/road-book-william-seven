const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');
c = c.replace(/fmtCurrency/g, 'formatCurrency');
fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
console.log("Fixed fmtCurrency");
