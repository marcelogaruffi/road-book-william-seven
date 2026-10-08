const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    '<p className="text-slate-500 mb-4">O espelho de Partituras e Músicas está sendo integrado a esta central e estará disponível em breve.</p>',
    '<p className="text-slate-500 font-medium">Módulo de Músicas e Partituras em processo de unificação.</p>'
);

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
