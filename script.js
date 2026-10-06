const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

code = code.replace(
  '<SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />',
  '<SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />\n                  <SLink to="/catering" icon={Coffee} label="Catering" />'
);

if (!code.includes('Coffee }')) {
  code = code.replace(
    'import { Users, Contact2, Luggage, Image as ImageIcon, Megaphone } from "lucide-react";',
    'import { Users, Contact2, Luggage, Image as ImageIcon, Megaphone, Coffee } from "lucide-react";'
  );
}

fs.writeFileSync('src/routes/_authenticated/route.tsx', code);
console.log('done');
