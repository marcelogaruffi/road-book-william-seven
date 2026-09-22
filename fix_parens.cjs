const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');
t = t.replace('{!viewMode && <button onClick={() => toggleEquipe(esc.usuario_id, esc.funcao)}\n                             className="size-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-colors"\n                          >\n                             <X className="size-4" />\n                            </button>}', '{!viewMode && (<button onClick={() => toggleEquipe(esc.usuario_id, esc.funcao)}\n                             className="size-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-colors"\n                          >\n                             <X className="size-4" />\n                            </button>)}');
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', t);
console.log('Fixed parens');
