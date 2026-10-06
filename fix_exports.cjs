const fs = require('fs');
let lines = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

lines = lines.replace(/\.replace\(\/\[\^a-zA-Z0-9_ -\]\/g, '_'\)/g, '.replace(/[\\\\/\\\\?%*:|\\"<>]/g, \'-\').replace(/\\s+/g, \' \').trim()');
lines = lines.replace(/Cardapio_\$\{eventoFull\?\.espetaculo \|\| 'Evento'\}_\$\{eventoFull\?\.cidade \|\| ''\}/g, 'Cardapio - ${eventoFull?.espetaculo || \'Evento\'} - ${eventoFull?.cidade || \'\'}');
lines = lines.replace(/Restricoes_\$\{eventoFull\?\.espetaculo \|\| 'Evento'\}_\$\{eventoFull\?\.cidade \|\| ''\}/g, 'Restricoes - ${eventoFull?.espetaculo || \'Evento\'} - ${eventoFull?.cidade || \'\'}');
lines = lines.replace(/theme: 'grid'/g, 'theme: \'striped\'');

// Format table style a bit better to match
lines = lines.replace(/headStyles: \{ fillColor: \[15, 23, 42\], textColor: 255 \},/g, 'styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },\n        headStyles: { fillColor: [15, 23, 42], textColor: 255 },');
lines = lines.replace(/styles: \{ fontSize: 10, cellPadding: 4 \},/g, '');
lines = lines.replace(/styles: \{ fontSize: 9, cellPadding: 3 \},/g, '');


fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', lines);
console.log('Fixed exports');
