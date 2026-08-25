const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');

// 1. Add Music to imports
code = code.replace("FileUp, LinkIcon, X } from 'lucide-react';", "FileUp, LinkIcon, X, Music } from 'lucide-react';");

// 2. Fix getErrorMessage
code = code.replace("getErrorMessage(err)", "err?.message || 'Erro desconhecido'");

fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code);
console.log('Fixed undefined variables!');
