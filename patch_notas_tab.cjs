const fs = require('fs');
let c = fs.readFileSync('src/components/NotasBoletosTab.tsx', 'utf8');

// 1. Fix bucket
c = c.replace(/.from\('financeiro'\).upload/g, ".from('notas_fiscais').upload");
c = c.replace(/.from\('financeiro'\).getPublicUrl/g, ".from('notas_fiscais').getPublicUrl");

// 2. Import CurrencyInput
c = c.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\nimport { CurrencyInput } from "@/components/CurrencyInput";');

// 3. Fix the add logic to handle formatted string
// novoValor is something like "1.234,56"
c = c.replace(
    'valor: parseFloat(novoValor) || 0,',
    'valor: parseFloat(novoValor.replace(/\\./g, "").replace(",", ".")) || 0,'
);

// 4. Fix the UI input
const inputRegex = /<Input type="number" placeholder="0\.00" value=\{novoValor\} onChange=\{e => setNovoValor\(e\.target\.value\)\} \/>/;
const newUI = `<div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <CurrencyInput className="pl-9" placeholder="0,00" value={novoValor} onChange={setNovoValor} />
              </div>`;
c = c.replace(inputRegex, newUI);

fs.writeFileSync('src/components/NotasBoletosTab.tsx', c, 'utf8');
console.log("Fixed bucket and input");
