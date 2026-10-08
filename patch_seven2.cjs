const fs = require('fs');

function replaceFile(path, search, replace) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    c = c.replace(search, replace);
    fs.writeFileSync(path, c, 'utf8');
}

replaceFile('src/lib/roadbook-types.ts', 'producao_nome: "Seven Produções Artísticas"', 'producao_nome: ""');
replaceFile('src/lib/roadbook-types.ts', 'producao_nome: "Seven Produções"', 'producao_nome: ""');
