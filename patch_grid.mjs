import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

evt = evt.replace(
  /<div className="(grid )?gap-4">\s*\{proximos\.map\(renderEventoCard\)\}\s*<\/div>/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">\n              {proximos.map(renderEventoCard)}\n            </div>'
);

evt = evt.replace(
  /<div className="(grid )?gap-4">\s*\{realizados\.map\(renderEventoCard\)\}\s*<\/div>/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">\n              {realizados.map(renderEventoCard)}\n            </div>'
);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
