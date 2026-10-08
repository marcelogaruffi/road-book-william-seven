const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace('className="px-6 pt-6 overflow-x-auto pb-2"', 'className="px-6 pt-6 pb-2"');
c = c.replace('className="inline-flex min-w-max h-12"', 'className="flex flex-wrap h-auto gap-1"');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed scrollbar");
