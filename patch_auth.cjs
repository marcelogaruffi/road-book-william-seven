const fs = require('fs');
let content = fs.readFileSync('src/routes/auth.tsx', 'utf8');

// Replace logo-contemporanea.png with logo-axis.png
content = content.replace(/<img src="\/logo-contemporanea\.png"/g, '<img src="/logo-axis.png"');

fs.writeFileSync('src/routes/auth.tsx', content, 'utf8');
