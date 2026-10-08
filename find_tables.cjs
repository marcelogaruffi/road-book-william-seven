const fs = require('fs');
const path = require('path');
const tables = new Set();
function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
        else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/from\(\s*['"]([a-zA-Z0-9_]+_padrao)['"]/g);
            for (const m of matches) tables.add(m[1]);
        }
    });
}
walk('src');
console.log(Array.from(tables).join('\n'));
