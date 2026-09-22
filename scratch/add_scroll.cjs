const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');
code = code.replace(/<DialogContent className="sm:max-w-\[500px\]">/g, '<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">');
fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Added scroll to modals');
