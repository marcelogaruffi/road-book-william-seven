const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

c = c.replace(
    '<SLink to="/espetaculos" icon={Music} label="Cadastro de Espetáculo" />',
    '<SLink to="/espetaculos" icon={Music} label="Cadastro de Espetáculo" />\n                    <SLink to="/padroes" icon={Settings} label="Padrões de Espetáculo" />'
);

fs.writeFileSync('src/routes/_authenticated/route.tsx', c, 'utf8');
console.log("Patched sidebar");
