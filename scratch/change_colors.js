const fs = require('fs');

const files = [
  'src/routes/_authenticated/iluminacao.tsx',
  'src/routes/_authenticated/iluminacao.$evento_id.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/yellow-/g, 'amber-');
  fs.writeFileSync(file, content);
});

console.log("Colors updated.");
