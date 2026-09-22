const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/tour.$id.tsx', 'utf-8');
t = t.replace(/<div><Label>Produ..o<\/Label><Input value=\{tour\.producao \?\? ""\} onChange=\{\(e\) => setTour\(\{ \.\.\.tour, producao: e\.target\.value \}\)\} \/><\/div>/g, '');
fs.writeFileSync('src/routes/_authenticated/tour.$id.tsx', t);

let idx = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf-8');
idx = idx.replace(/<Users className="size-3\.5" \/> \{tour\.producao \|\| "Produ..o n..o informada"\}/g, '');
fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', idx);
console.log('Removed from all');
