const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

const dialogMarkup = `
        <Dialog open={!!viewRiderModal} onOpenChange={val => { if (!val) setViewRiderModal(null) }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings className="size-6 text-primary" /> 
                {viewRiderModal === 'rider_som' ? 'Rider de Som' :
                 viewRiderModal === 'rider_luz' ? 'Rider de Luz' :
                 viewRiderModal === 'rider_video' ? 'Rider de Vídeo' :
                 viewRiderModal === 'mapa_palco_url' ? 'Mapa de Palco' :
                 viewRiderModal === 'figurinos_url' ? 'Figurinos' : 'Visualizador'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {viewRiderModal && typeof currentShow[viewRiderModal as keyof Espetaculo] === 'string' && (
                <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                  {(() => {
                    const content = currentShow[viewRiderModal as keyof Espetaculo] as string;
                    try {
                      const data = JSON.parse(content);
                      return (
                        <div className="space-y-4">
                          {data.notas_gerais && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Notas Gerais</h4>
                              <p className="text-sm">{data.notas_gerais}</p>
                            </div>
                          )}
                          {data.monitoracao && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Monitoração</h4>
                              <p className="text-sm">{data.monitoracao}</p>
                            </div>
                          )}
                          {data.equipamentos_lista && data.equipamentos_lista.length > 0 && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Equipamentos</h4>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {data.equipamentos_lista.map((eq: any, idx: number) => (
                                  <li key={idx}>{eq.qtd}x {eq.nome} {eq.detalhes ? \`(\${eq.detalhes})\` : ''}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {data.input_list_tabela && data.input_list_tabela.length > 0 && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Input List</h4>
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-200 dark:bg-slate-800">
                                  <tr><th className="p-2">CH</th><th className="p-2">Input</th><th className="p-2">Obs</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                  {data.input_list_tabela.map((eq: any, idx: number) => (
                                    <tr key={idx}><td className="p-2 font-bold">{eq.canal}</td><td className="p-2">{eq.equipamento}</td><td className="p-2 text-xs">{eq.obs}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return content;
                    }
                  })()}
                </div>
              )}

              {viewRiderModal && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Anexos</h4>
                  {(() => {
                    let attachKey = '';
                    if (viewRiderModal === 'rider_som') attachKey = 'anexos_som';
                    else if (viewRiderModal === 'rider_luz') attachKey = 'anexos_luz';
                    else if (viewRiderModal === 'rider_video') attachKey = 'anexos_video';
                    else if (viewRiderModal === 'mapa_palco_url') attachKey = 'anexos_palco';
                    else if (viewRiderModal === 'figurinos_url') attachKey = 'anexos_figurino';

                    const anexosList = currentShow.assets_midia?.[attachKey] || [];
                    if (anexosList.length === 0) return <p className="text-sm text-slate-500">Nenhum anexo encontrado.</p>;

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {anexosList.map((anexo: any, index: number) => {
                          const url = typeof anexo === 'string' ? anexo : anexo.url;
                          const nome = typeof anexo === 'string' ? \`Arquivo \${index + 1}\` : anexo.nome;
                          return (
                            <a key={index} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm truncate">
                              <LinkIcon className="size-4 shrink-0" />
                              {nome}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
`;

let normCode = code.replace(/\r\n/g, '\n');

// 1. Remove it from where it is now (dashboard)
const startIdx = normCode.indexOf('<Dialog open={!!viewRiderModal} onOpenChange={val => { if (!val) setViewRiderModal(null) }}>');
if (startIdx !== -1) {
  const endIdx = normCode.indexOf('</Dialog>', startIdx) + 9;
  normCode = normCode.substring(0, startIdx) + normCode.substring(endIdx);
}

// 2. Add it to wizard view. 
// Wizard view returns at the end:
//       </div>
//     );
//   }
//   return null;
// }

const searchStr = '      </div>\n    );\n  }\n\n  return null;\n}';

if (normCode.includes(searchStr)) {
  const replaceStr = dialogMarkup + '\n      </div>\n    );\n  }\n\n  return null;\n}';
  code = normCode.replace(searchStr, replaceStr);
  fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
  console.log('Dialog moved to wizard view!');
} else {
  console.log('Could not find search string in wizard');
  const tail = normCode.substring(normCode.length - 200);
  console.log('Tail:\n', tail);
}
