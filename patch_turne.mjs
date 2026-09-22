import fs from 'fs';

let content = fs.readFileSync('src/routes/turne.$slug.tsx', 'utf-8');

// The lines to remove:
/*
              {tour.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{tour.espetaculo}</p>}
              {!tour.logo_producao && tour.producao && (tour.exibir_logo_producao ?? true) && (
                  <p className="text-sm font-semibold text-slate-400 mt-2">Produção: {tour.producao}</p>
              )}
*/

const p1 = /\{tour\.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400">\{tour\.espetaculo\}<\/p>\}/g;
const p2 = /\{!tour\.logo_producao && tour\.producao && \(tour\.exibir_logo_producao \?\? true\) && \(\s*<p className="text-sm font-semibold text-slate-400 mt-2">Produ[^<]*: \{tour\.producao\}<\/p>\s*\)\}/gs;

content = content.replace(p1, '');
content = content.replace(p2, '');

fs.writeFileSync('src/routes/turne.$slug.tsx', content);
console.log("Done");
