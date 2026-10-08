const fs = require('fs');
const content = fs.readFileSync('src/components/FinanceiroTab.tsx', 'utf8');
const matches = [...content.matchAll(/tipo:\s*"([^"]+)"/g)].map(m => m[1]);
console.log(matches);
