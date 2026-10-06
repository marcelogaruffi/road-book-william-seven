const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/divulgacoes.tsx', 'utf8');

// The regex that is currently: .replace(/\\/$/, '')
// We want it to be: .replace(/\/$/, '')
code = code.replace(/replace\(\/\\\\\/\\\$\/, ''\)/g, "replace(/\\/$/, '')");
// Actually it's probably literally: .replace(/\\/$/, '')
code = code.replace("replace(/\\\\/$/, '')", "replace(/\\/$/, '')");

code = code.replace(/\\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/routes/_authenticated/divulgacoes.tsx', code, 'utf8');
console.log('fixed divulgações');
