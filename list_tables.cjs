const fs = require('fs');
const files = fs.readdirSync('src/routes/_authenticated');
const tables = new Set();
files.forEach(f => {
  if(f.endsWith('.tsx')) {
    const c = fs.readFileSync('src/routes/_authenticated/'+f, 'utf-8');
    const matches = [...c.matchAll(/from\(['"]([a-z0-9_]+)['"]\)/g)];
    matches.forEach(m => tables.add(m[1]));
  }
});
console.log(Array.from(tables).join('\n'));
