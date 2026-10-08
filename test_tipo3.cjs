const fs = require('fs');
const content = fs.readFileSync('src/components/FinanceiroTab.tsx', 'utf8');
const lines = content.split('\n').filter(l => l.includes('<SelectItem'));
console.log(lines.join('\n'));
