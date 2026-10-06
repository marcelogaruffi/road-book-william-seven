const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
c = c.replace('import { ClipboardList', 'import { ChevronLeft, ClipboardList');
fs.writeFileSync('src/routes/_authenticated/route.tsx', c);
