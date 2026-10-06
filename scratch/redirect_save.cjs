const fs = require('fs');

const files = [
  { file: 'som.$evento_id.tsx', route: '/som' },
  { file: 'video.$evento_id.tsx', route: '/video' },
  { file: 'iluminacao.$evento_id.tsx', route: '/iluminacao' },
  { file: 'som-operacao.$evento_id.tsx', route: '/som-operacao' }
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f.file, 'utf8');
  
  // For som, video, iluminacao
  const regex1 = /toast\.success\((.*?)\);\r?\n\s*\}/;
  if (regex1.test(code)) {
    code = code.replace(regex1, (match, msg) => {
      return `toast.success(${msg});\n        navigate({ to: '${f.route}' });\n      }`;
    });
  }

  // For som-operacao, it might be different. Let's check if it has a handleSave or saveMap
  if (f.file === 'som-operacao.$evento_id.tsx') {
    // We will do a generic replacement for toast.success('Salvo com sucesso!') or similar.
    const regexOp = /toast\.success\(['"](.*?salvo.*?)['"]\);/i;
    if (regexOp.test(code)) {
        code = code.replace(regexOp, (match) => {
            return `${match}\n        navigate({ to: '${f.route}' });`;
        });
    }
  }

  fs.writeFileSync('src/routes/_authenticated/' + f.file, code, 'utf8');
  console.log(`Updated ${f.file}`);
}
