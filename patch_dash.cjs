const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

const oldDash = `              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <Users className="size-5 text-primary" /> Ficha Técnica
              </h3>
              {currentShow.ficha_tecnica && currentShow.ficha_tecnica.length > 0 ? (
                <ul className="space-y-2">
                  {currentShow.ficha_tecnica.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                      <span className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wide">{item.funcao}</span>
                      <span className="font-bold text-slate-500">{item.nome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 font-semibold text-sm">Nenhuma ficha técnica cadastrada.</p>
              )}
            </section>`;

const newDash = `              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <Users className="size-5 text-primary" /> Ficha Técnica
              </h3>
              {currentShow.ficha_tecnica && currentShow.ficha_tecnica.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    currentShow.ficha_tecnica.reduce((acc, item) => {
                      if (!acc[item.funcao]) acc[item.funcao] = [];
                      acc[item.funcao].push(item.nome);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([funcao, nomes]) => (
                    <div key={funcao} className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-white/5 overflow-hidden">
                      <div className="bg-slate-100/50 dark:bg-slate-900 px-3 py-2 border-b border-slate-100 dark:border-white/5 font-black text-primary text-[10px] uppercase tracking-wider">
                        {funcao}
                      </div>
                      <div className="px-3 py-2 font-bold text-slate-600 dark:text-slate-300 text-sm flex flex-col gap-1">
                        {nomes.map((n, i) => <span key={i}>{n}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 font-semibold text-sm">Nenhuma ficha técnica cadastrada.</p>
              )}
            </section>`;

code = code.replace(oldDash, newDash);
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Fixed dashboard Ficha Técnica');
