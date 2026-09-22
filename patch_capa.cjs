const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

// 1. Update the Banner in DASHBOARD view
const oldBanner = `        {/* Banner */}
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end px-4 sm:px-12 py-8 border-b-4 border-primary">
          {currentShow.logo_espetaculo_url && (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />`;

const newBanner = `        {/* Banner */}
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end px-4 sm:px-12 py-8 border-b-4 border-primary">
          {currentShow.assets_midia?.capa_url ? (
            <img src={currentShow.assets_midia.capa_url} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
          ) : currentShow.logo_espetaculo_url ? (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />`;

content = content.replace(oldBanner, newBanner);

// 2. Add the checkbox to the Step 4 form
const oldButtonsDiv = `                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                          const novas = [...(currentShow.assets_midia?.fotos_divulgacao || [])];
                          novas.splice(index, 1);
                          setCurrentShow({...currentShow, assets_midia: {...currentShow.assets_midia, fotos_divulgacao: novas}});
                        }}>
                          <Trash2 className="size-4 mr-2" /> Remover Foto
                        </Button>
                      </div>`;

const newButtonsDiv = `                      <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={currentShow.assets_midia?.capa_url === foto.url}
                            onChange={(e) => {
                              setCurrentShow({...currentShow, assets_midia: {...currentShow.assets_midia, capa_url: e.target.checked ? foto.url : null}});
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary" 
                          />
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Capa da sessão espetáculos</span>
                        </label>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                          const novas = [...(currentShow.assets_midia?.fotos_divulgacao || [])];
                          novas.splice(index, 1);
                          let novaCapa = currentShow.assets_midia?.capa_url;
                          if (novaCapa === foto.url) novaCapa = null; // remove capa se for a foto deletada
                          setCurrentShow({...currentShow, assets_midia: {...currentShow.assets_midia, fotos_divulgacao: novas, capa_url: novaCapa}});
                        }}>
                          <Trash2 className="size-4 mr-2" /> Remover
                        </Button>
                      </div>`;

content = content.replace(oldButtonsDiv, newButtonsDiv);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
