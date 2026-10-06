const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/checklist.tsx', 'utf8');
content = content.replace(/if \(itensDesteShow.length === 0\) return toast\.warning\(.*\);\r?\n/, 'if (itensDesteShow.length === 0) return toast.warning(`Não há itens no Checklist Padrão para o show "${nomeEspetaculo}".`);\n');
fs.writeFileSync('src/routes/_authenticated/checklist.tsx', content, 'utf8');
