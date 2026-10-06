const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
if (!code.includes('/divulgacoes')) {
  if (!code.includes('Megaphone')) {
    code = code.replace('import {', 'import { Megaphone,');
  }
  code = code.replace(
    /<SLink to="\/midias" icon=\{Smartphone\} label="Mídias Sociais" show=\{isProdutor \|\| userRole === 'midias_sociais'\} \/>/,
    `<SLink to="/midias" icon={Smartphone} label="Mídias Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/divulgacoes" icon={Megaphone} label="Divulgações" show={isProdutor || userRole === 'midias_sociais'} />`
  );
  fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');
}
console.log('done route');
