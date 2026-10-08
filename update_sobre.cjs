const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/sobre.tsx', 'utf8');

content = content.replace(
  'Este sistema foi idealizado e desenvolvido por <strong>Marcelo Garuffi</strong> para revolucionar',
  'Este sistema foi idealizado e desenvolvido por <strong>Marcelo Garuffi</strong>, com autoria da <strong>Contemporânea Produções</strong>, para revolucionar'
);

content = content.replace(
  '<h4 className="font-bold text-slate-800">Desenvolvimento e Arquitetura</h4>\n                  <p className="text-sm text-slate-500">Marcelo Garuffi</p>',
  '<h4 className="font-bold text-slate-800">Autoria e Desenvolvimento</h4>\n                  <p className="text-sm text-slate-700 font-medium">Marcelo Garuffi</p>\n                  <p className="text-sm text-slate-500">Contemporânea Produções</p>'
);

fs.writeFileSync('src/routes/_authenticated/sobre.tsx', content, 'utf8');
