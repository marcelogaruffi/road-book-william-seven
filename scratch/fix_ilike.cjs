const fs = require('fs');
let content = fs.readFileSync('src/routes/turne.$slug.tsx', 'utf8');

content = content.replace(
  ".eq('nome_espetaculo', tour.espetaculo)",
  ".ilike('nome_espetaculo', tour.espetaculo)"
);

fs.writeFileSync('src/routes/turne.$slug.tsx', content, 'utf8');
