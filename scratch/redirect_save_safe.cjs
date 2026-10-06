const fs = require('fs');

const files = [
  { file: 'som.$evento_id.tsx', route: '/som' },
  { file: 'video.$evento_id.tsx', route: '/video' },
  { file: 'iluminacao.$evento_id.tsx', route: '/iluminacao' },
  { file: 'som-operacao.$evento_id.tsx', route: '/som-operacao' }
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f.file, 'utf8');
  
  // Specific regex to ONLY match inside handleSave!
  // Look for:
  // if (error) { toast.error('Erro ao salvar mapa'); } else { toast.success('Mapa de som salvo com sucesso!'); }
  // We want to append navigate({ to: '/som' }); after the toast.success.
  
  if (f.file !== 'som-operacao.$evento_id.tsx') {
    code = code.replace(/toast\.success\('Mapa .*? salvo com sucesso!'\);\r?\n\s*\}/, match => {
      return match.replace(/}$/, `  navigate({ to: '${f.route}' });\n      }`);
    });
  } else {
    // som-operacao uses saveCues and then toast.success('Deixas salvas com sucesso!');
    // Let's replace:
    // toast.success('Deixas salvas com sucesso!');
    // } catch (error) {
    code = code.replace(/toast\.success\('Deixas salvas com sucesso!'\);/, `toast.success('Deixas salvas com sucesso!');\n        navigate({ to: '${f.route}' });`);
  }

  fs.writeFileSync('src/routes/_authenticated/' + f.file, code, 'utf8');
  console.log(`Updated redirect in ${f.file}`);
}
