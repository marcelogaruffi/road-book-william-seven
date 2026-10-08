const fs = require('fs');
const content = fs.readFileSync('src/components/FinanceiroTab.tsx', 'utf8');
const lines = content.split('\n');
const tipoLines = lines.filter(l => l.includes('SelectItem') && (l.includes('tipo') || l.includes('cache_equipe') || l.includes('alimentacao')));
console.log(tipoLines.join('\n'));
