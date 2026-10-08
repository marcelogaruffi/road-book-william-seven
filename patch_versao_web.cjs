const fs = require('fs');

let c = fs.readFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', 'utf8');

const regex = /<div className="flex justify-between items-center gap-6 mb-8 pb-8 border-b border-slate-200\/60 dark:border-slate-800\/60">[\s\S]*?<div className="w-\[100px\]"><\/div>\s*\)\}\s*<\/div>/;

const repl = `<div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
              {(rb as any)._resolved_logos?.logoProducao && (
                <img src={(rb as any)._resolved_logos.logoProducao} alt="Produtora" className="h-14 w-auto object-contain dark:brightness-200" />
              )}
              {(rb as any)._resolved_logos?.logoProducao && (rb as any)._resolved_logos?.logoEspetaculo && (
                <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
              )}
              {(rb as any)._resolved_logos?.logoEspetaculo && (
                <img src={(rb as any)._resolved_logos.logoEspetaculo} alt={\`\${rb.espetaculo} Logo\`} className="h-14 w-auto object-contain dark:brightness-200" />
              )}
            </div>`;

c = c.replace(regex, repl);

fs.writeFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', c, 'utf8');
console.log("Done");
