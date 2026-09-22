const fs = require('fs');
let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

const targetOld = `                return (
                  <button
                    key={url}
                    onClick={() => {
                      onSelect(url);
                      onOpenChange(false);
                    }}
                    className="group flex flex-col items-center gap-2 pb-2 focus:outline-none"
                  >
                    <div className="relative aspect-square w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50 group-focus:ring-2 group-focus:ring-primary group-focus:ring-offset-2">
                      <img src={url} alt="Logo" className="w-full h-full object-contain p-3" />
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const vName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
                          hideLogo(vName);
                        }}
                        className="absolute top-1 right-1 bg-white hover:bg-red-500 hover:text-white text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
                        title="Ocultar logo da lista"
                      >
                        <X className="size-3" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="text-white text-sm font-bold bg-primary px-3 py-1.5 rounded-full">Selecionar</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-full line-clamp-2 break-all text-center px-1" title={filename}>
                      {filename.split('-').slice(1).join('-') || filename}
                    </span>
                  </button>
                );`;

const targetNew = `                return (
                  <div
                    key={url}
                    className="group flex flex-col items-center gap-2 pb-2 relative"
                  >
                    <div 
                      onClick={() => {
                        onSelect(url);
                        onOpenChange(false);
                      }}
                      role="button"
                      className="relative cursor-pointer aspect-square w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary group-focus-within:ring-offset-2"
                    >
                      <img src={url} alt="Logo" className="w-full h-full object-contain p-3" />
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const vName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
                          hideLogo(vName);
                        }}
                        className="absolute top-1 right-1 bg-white hover:bg-red-500 hover:text-white text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm cursor-pointer"
                        title="Ocultar logo da lista"
                      >
                        <X className="size-3" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="text-white text-sm font-bold bg-primary px-3 py-1.5 rounded-full">Selecionar</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-full line-clamp-2 break-all text-center px-1" title={filename}>
                      {filename.split('-').slice(1).join('-') || filename}
                    </span>
                  </div>
                );`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
