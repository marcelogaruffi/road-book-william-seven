const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

// Replace + Add to Adicionar
code = code.replace(/<Plus className="size-4 mr-1"\/> Add/g, '<Plus className="size-4 mr-1"/> Adicionar');

// Handle [object Object] text replacement
code = code.replace(
  'const textValue = (currentShow[textKey] as string) || "";',
  'let textValue = (currentShow[textKey] as string) || "";\n    if (textValue === "[object Object]") textValue = "";'
);

// Group Ficha Técnica list
const oldFichaList = `              <div className="grid md:grid-cols-2 gap-2 mt-4">
                {currentShow.ficha_tecnica?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-black text-primary text-[10px] uppercase tracking-wider">{item.funcao}</div>
                      <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.nome}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFicha(idx)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 size-8"><Trash2 className="size-4"/></Button>
                  </div>
                ))}
                {(!currentShow.ficha_tecnica || currentShow.ficha_tecnica.length === 0) && (
                  <div className="col-span-2 text-center py-8 text-slate-400 font-semibold border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm">
                    Nenhum profissional na ficha técnica.
                  </div>
                )}
              </div>`;

const newFichaList = `              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {Object.entries(
                  (currentShow.ficha_tecnica || []).reduce((acc, item, idx) => {
                    if (!acc[item.funcao]) acc[item.funcao] = [];
                    acc[item.funcao].push({ ...item, originalIndex: idx });
                    return acc;
                  }, {} as Record<string, {funcao: string, nome: string, originalIndex: number}[]>)
                ).map(([funcao, items]) => (
                  <div key={funcao} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 border-b border-slate-100 dark:border-white/5 font-black text-primary text-[10px] uppercase tracking-wider">
                      {funcao}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {items.map(item => (
                        <div key={item.originalIndex} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.nome}</span>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const ns = [...(currentShow.ficha_tecnica||[])];
                            ns.splice(item.originalIndex, 1);
                            setCurrentShow({...currentShow, ficha_tecnica: ns});
                          }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 size-7"><X className="size-4"/></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!currentShow.ficha_tecnica || currentShow.ficha_tecnica.length === 0) && (
                  <div className="col-span-2 text-center py-8 text-slate-400 font-semibold border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm">
                    Nenhum profissional na ficha técnica.
                  </div>
                )}
              </div>`;

code = code.replace(oldFichaList, newFichaList);

// Note: removeFicha is not defined in our component anyway! Wait. I used removeFicha in the old block but never defined it in the code! I was deleting it but there was no removeFicha function! The user would have gotten a reference error if they clicked it! It's good I'm fixing it now by doing the splice directly inside the new click handler.

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Fixed');
