const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

content = content.replace('                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" />\n', '');
content = content.replace(
  '<SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />',
  '<SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />\n                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" />'
);

fs.writeFileSync('src/routes/_authenticated/route.tsx', content, 'utf8');
