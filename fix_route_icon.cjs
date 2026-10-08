const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

if (!content.includes('Printer,')) {
    content = content.replace('import { Users,', 'import { Users, Printer,');
}

content = content.replace(
    '<SLink to="/emissao-relatorios" icon={File} label="Emissão de Relatórios" show={isProdutor} />',
    '<SLink to="/emissao-relatorios" icon={Printer} label="Emissão de Relatórios" show={isProdutor} />'
);

fs.writeFileSync('src/routes/_authenticated/route.tsx', content, 'utf8');
