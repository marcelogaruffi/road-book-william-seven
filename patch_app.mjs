import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('app.html', 'utf8');
c = c.replace('Áxis - Gestão para Teatros e Shows', 'Áxis - Gestão para Teatros e Shows');
writeFileSync('app.html', c, 'utf8');

