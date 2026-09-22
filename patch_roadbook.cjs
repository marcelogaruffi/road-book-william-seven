const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const replacements = [
    { from: />([^<]*?)\bRoad\s?Books\b([^<]*?)</gi, to: '>$1Guias de Viagem$2<' },
    { from: />([^<]*?)\bRoad\s?Book\b([^<]*?)</gi, to: '>$1Guia de Viagem$2<' },
    { from: /"Road\s?Books"/gi, to: '"Guias de Viagem"' },
    { from: /"Road\s?Book"/gi, to: '"Guia de Viagem"' },
    { from: /'Road\s?Books'/gi, to: "'Guias de Viagem'" },
    { from: /'Road\s?Book'/gi, to: "'Guia de Viagem'" },
    { from: /Road Book Geral/gi, to: 'Guia de Viagem Geral' },
    { from: /Road Book Hub/gi, to: 'Guia de Viagem Hub' },
    { from: /Os Road Books/gi, to: 'Os Guias de Viagem' },
];

const files = walk('src');
let changedFiles = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf-8');
    let original = content;
    
    // Multiple passes to catch multiple on same line
    for (let i = 0; i < 3; i++) {
        replacements.forEach(r => {
            content = content.replace(r.from, r.to);
        });
    }

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated', f);
        changedFiles++;
    }
});

console.log('Total files changed:', changedFiles);
