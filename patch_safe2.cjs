const fs = require('fs');
const filesToPatch = [
    { 
        file: 'src/routes/_authenticated/contatos.tsx', 
        replace: [['Contatos de Turnê (Roadbooks)', 'Contatos de Turnê (Guias de Viagem)']]
    },
    { 
        file: 'src/routes/_authenticated/financeiro.tsx', 
        replace: [['Erro ao carregar roadbooks', 'Erro ao carregar guias de viagem']]
    },
    {
        file: 'src/routes/_authenticated/publico.tsx',
        replace: [['// Fetch Roadbooks for the dropdown', '// Fetch Guias de Viagem for the dropdown']]
    }
];

filesToPatch.forEach(({ file, replace }) => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        let original = content;
        replace.forEach(([from, to]) => {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        });
        if (content !== original) {
            fs.writeFileSync(file, content);
            console.log('Patched', file);
        }
    }
});
