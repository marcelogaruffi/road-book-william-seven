const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

content = content.replace(
    /worksheet\.mergeCells\('B1:F1'\);\n      worksheet\.getCell\('B1'\)\.value = `Rooming List/g,
    `worksheet.mergeCells('C1:F1');\n      worksheet.getCell('C1').value = \`Rooming List`
);
content = content.replace(
    /worksheet\.getCell\('B1'\)\.font = /g,
    `worksheet.getCell('C1').font = `
);
content = content.replace(
    /worksheet\.getCell\('B1'\)\.alignment = /g,
    `worksheet.getCell('C1').alignment = `
);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
