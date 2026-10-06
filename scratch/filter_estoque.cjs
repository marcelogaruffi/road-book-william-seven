const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Replace generic selects of templates_espetaculos that don't already have neq ESTOQUE_GLOBAL
      // We look for .select("...") or .select('*') without .neq
      content = content.replace(/supabase\.from\(["']templates_espetaculos["']\)\.select\(([^)]+)\)(?!\.neq)/g, 
        (match, p1) => `supabase.from('templates_espetaculos').select(${p1}).neq('nome_espetaculo', 'ESTOQUE_GLOBAL')`);
        
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('src/routes');
processDir('src/components');
