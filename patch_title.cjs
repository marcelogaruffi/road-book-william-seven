const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    'title: "Padrões de Espetáculo - Áxis"',
    'title: "Padrões de Espetáculo - Áxis - Gestão de Teatros e Shows"'
);

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed title");
