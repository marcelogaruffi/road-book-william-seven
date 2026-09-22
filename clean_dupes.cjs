const fs = require('fs');

let t = fs.readFileSync('src/routes/_authenticated/roadbook.$id.tsx', 'utf-8');
t = t.replace(/function getErrorMessage[\s\S]*?\}\n/m, '');
fs.writeFileSync('src/routes/_authenticated/roadbook.$id.tsx', t);

let t2 = fs.readFileSync('src/routes/_authenticated/malas.index.tsx', 'utf-8');
let firstIdx = t2.indexOf('function EstoqueGlobalTab');
let secondIdx = t2.indexOf('function EstoqueGlobalTab', firstIdx + 10);
if(secondIdx !== -1) {
  let endIdx = t2.indexOf('function', secondIdx);
  if(endIdx === -1) endIdx = t2.length;
  t2 = t2.substring(0, secondIdx) + t2.substring(endIdx);
  fs.writeFileSync('src/routes/_authenticated/malas.index.tsx', t2);
}

console.log('Cleaned files');
