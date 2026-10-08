const fs = require('fs');

function replaceFile(path, search, replace) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    c = c.replace(search, replace);
    fs.writeFileSync(path, c, 'utf8');
}

// 1. roadbook.new.tsx
replaceFile('src/routes/_authenticated/roadbook.new.tsx', 'producao_nome: "Seven Produções Artísticas"', 'producao_nome: ""');
replaceFile('src/routes/_authenticated/roadbook.new.tsx', 'producao_nome: "Seven Produções"', 'producao_nome: ""');

// 2. DuplicateRoadbookDialog.tsx
replaceFile('src/components/DuplicateRoadbookDialog.tsx', 'producao_nome: "Seven Produções Artísticas"', 'producao_nome: ""');
replaceFile('src/components/DuplicateRoadbookDialog.tsx', 'producao_nome: "Seven Produções"', 'producao_nome: ""');

// 4. tour.new.tsx
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_nome: "Seven Produções Artísticas"', 'teatro_nome: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_endereco: "Seven Produções Artísticas"', 'teatro_endereco: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_telefone: "Seven Produções Artísticas"', 'teatro_telefone: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_site: "Seven Produções Artísticas"', 'teatro_site: ""');

replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_nome: "Seven Produções"', 'teatro_nome: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_endereco: "Seven Produções"', 'teatro_endereco: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_telefone: "Seven Produções"', 'teatro_telefone: ""');
replaceFile('src/routes/_authenticated/tour.new.tsx', 'teatro_site: "Seven Produções"', 'teatro_site: ""');

console.log("Done");
