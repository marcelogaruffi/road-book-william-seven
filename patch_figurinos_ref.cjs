const fs = require('fs');
let c = fs.readFileSync('src/components/FigurinosPadraoTab.tsx', 'utf8');

c = c.replace(
    '<form onSubmit={handleAddArquivo}',
    '<form onSubmit={handleAddFigurino}'
);

fs.writeFileSync('src/components/FigurinosPadraoTab.tsx', c, 'utf8');
console.log("Fixed ReferenceError");
