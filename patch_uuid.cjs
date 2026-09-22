const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');
t = t.replace(
  "upsert(toUpsert.map(u => { const ret = {...u}; if(!ret.id) delete ret.id; return ret; }))",
  "upsert(toUpsert.map(u => ({...u, id: u.id || crypto.randomUUID()})))"
);
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', t);
console.log('Fixed');
