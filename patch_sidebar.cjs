const fs = require('fs');
let content = fs.readFileSync('src/components/AppSidebar.tsx', 'utf8');
content = content.replace(/Roadbook/g, 'Áxis');
fs.writeFileSync('src/components/AppSidebar.tsx', content, 'utf8');

