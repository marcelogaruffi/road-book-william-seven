const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/som-operacao.index.tsx', 'utf8');

code = code.replace(/const handleGridSelect = async[\s\S]*?setInitDialogEvento[\s\S]*?\};\s*const \[eventos/, `const handleGridSelect = (id: string) => {
    navigate({ to: '/som-operacao/' + id });
  };
  
  const [eventos`);

fs.writeFileSync('src/routes/_authenticated/som-operacao.index.tsx', code, 'utf8');
