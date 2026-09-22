import fs from 'fs';

let esp = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

const oldRegex = /<Card key=\{show\.nome_espetaculo\} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-white\/10".*?<\/Card>/s;

const newEspCard = `<Card key={show.nome_espetaculo} className="flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border-slate-200 dark:border-slate-800/60 rounded-3xl bg-white dark:bg-slate-900/40" onClick={() => { setCurrentShow(show); setView("dashboard"); }}>
                  <div className="aspect-video w-full bg-slate-50 dark:bg-slate-900/60 p-6 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/60">
                    {show.logo_espetaculo_url ? (
                      <img src={show.logo_espetaculo_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Music className="size-12 text-slate-200 dark:text-slate-800" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">{show.nome_espetaculo}</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate mt-1">{show.grupo_cia || "Sem companhia"}</p>
                  </div>
                </Card>`;

esp = esp.replace(oldRegex, newEspCard);
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', esp);
console.log("Done");
