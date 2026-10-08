const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');
c = c.replace('import { formatCurrency } from "@/lib/utils";', '');
c = c.replace(/formatCurrency\(/g, '(val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)(');
fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
console.log("Fixed import");
