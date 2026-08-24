const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/cadastros.tsx', 'utf8');

// Add to ROLE_COLORS
content = content.replace(
  "midias_sociais: { label: 'Mídias Sociais', classes: 'bg-blue-200 text-blue-800 hover:bg-blue-200' },",
  "midias_sociais: { label: 'Mídias Sociais', classes: 'bg-blue-200 text-blue-800 hover:bg-blue-200' },\n  rigger: { label: 'Rigger', classes: 'bg-stone-200 text-stone-800 hover:bg-stone-200' },"
);

// Add options
content = content.replaceAll(
  '<option value="tecnico_video">Técnico de Vídeo</option>',
  '<option value="tecnico_video">Técnico de Vídeo</option>\n                  <option value="rigger">Rigger</option>'
);

fs.writeFileSync('src/routes/_authenticated/cadastros.tsx', content);
console.log('updated cadastros.tsx');
