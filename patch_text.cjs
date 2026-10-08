const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', 'utf8');

c = c.replace(/Imprimir Roteiro \(\{selectedDates\.length\}\)/g, 'Exportar Roteiro em PDF ({selectedDates.length})');

fs.writeFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', c, 'utf8');
console.log("Done");
