const fs = require('fs');
let content = fs.readFileSync('src/components/ui/sonner.tsx', 'utf8');

content = content.replace(
  '<Sonner', 
  '<Sonner\n      position="top-center"\n      richColors\n      expand={true}\n      duration={4000}'
);

content = content.replace(
  'toast:\n            "group toast',
  'toast:\n            "group toast !text-base !font-bold !p-4'
);

fs.writeFileSync('src/components/ui/sonner.tsx', content);
console.log('sonner updated');
