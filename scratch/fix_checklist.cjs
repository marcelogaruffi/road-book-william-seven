const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/checklist.tsx', 'utf8');

// The dropdown is usually inside a div.
code = code.replace(/<div className="flex-1 space-y-2 w-full">[\s\S]*?<Label>Selecione o Evento para conferência<\/Label>[\s\S]*?<\/select>\s*<\/div>/g, '');
code = code.replace(/<div className="flex-1 space-y-2 w-full">[\s\S]*?<Label>Selecione o Evento para conferÃªncia<\/Label>[\s\S]*?<\/select>\s*<\/div>/g, '');

// Also check if there's any other "Selecione o Evento" label
code = code.replace(/<Label>Selecione o Evento<\/Label>\s*<select[\s\S]*?<\/select>/g, '');

fs.writeFileSync('src/routes/_authenticated/checklist.tsx', code, 'utf8');
