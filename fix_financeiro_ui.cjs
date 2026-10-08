const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

// Revert outer TabsList
c = c.replace('<TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1 h-14">', '<TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1 h-14">');

// Fix inner TabsList
c = c.replace('<TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1">', '<TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1">');

fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', c, 'utf8');
console.log("Fixed UI");
