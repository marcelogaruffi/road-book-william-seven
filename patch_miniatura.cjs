const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

const oldCardImage = `<div className="aspect-video w-full bg-slate-50 dark:bg-slate-900/60 p-6 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/60">
                    {show.logo_espetaculo_url ? (
                      <img src={show.logo_espetaculo_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Music className="size-12 text-slate-200 dark:text-slate-800" />
                    )}
                  </div>`;

const newCardImage = `<div className={\`aspect-video w-full bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/60 \${show.assets_midia?.miniatura_url ? '' : 'p-6'}\`}>
                    {show.assets_midia?.miniatura_url ? (
                      <img src={show.assets_midia.miniatura_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : show.logo_espetaculo_url ? (
                      <img src={show.logo_espetaculo_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Music className="size-12 text-slate-200 dark:text-slate-800" />
                    )}
                  </div>`;

content = content.replace(oldCardImage, newCardImage);

const oldDashboardLogo = `<div className="size-28 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-2xl border-4 border-slate-950 overflow-hidden shrink-0">
                {currentShow.logo_espetaculo_url ? (
                  <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                ) : (
                  <Music className="size-12 text-slate-300 dark:text-slate-700 m-auto mt-6" />
                )}
              </div>`;

const newDashboardLogo = `<div className={\`size-28 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border-4 border-slate-950 overflow-hidden shrink-0 \${currentShow.assets_midia?.miniatura_url ? '' : 'p-2'}\`}>
                {currentShow.assets_midia?.miniatura_url ? (
                  <img src={currentShow.assets_midia.miniatura_url} className="w-full h-full object-cover" />
                ) : currentShow.logo_espetaculo_url ? (
                  <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                ) : (
                  <Music className="size-12 text-slate-300 dark:text-slate-700 m-auto mt-6" />
                )}
              </div>`;

content = content.replace(oldDashboardLogo, newDashboardLogo);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
