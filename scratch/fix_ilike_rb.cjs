const fs = require('fs');
let content = fs.readFileSync('src/routes/rb.$slug.tsx', 'utf8');

content = content.replace(
  '.eq("nome_espetaculo", rb.espetaculo)',
  '.ilike("nome_espetaculo", rb.espetaculo)'
);

fs.writeFileSync('src/routes/rb.$slug.tsx', content, 'utf8');
