const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

const oldMap = `{REPORT_GROUPS.map(group => (
                  <div key={group.name} className="mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{group.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors bg-white">
                          <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                          <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}`;

const newMap = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                  {REPORT_GROUPS.map(group => (
                    <div key={group.name} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200/60 pb-2">{group.name}</h3>
                      <div className="flex flex-col gap-3">
                        {group.options.map(opt => (
                          <label key={opt.id} className="flex items-center gap-3 p-3 border border-slate-150 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-white transition-all bg-white shadow-sm">
                            <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                            <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>`;

content = content.replace(oldMap, newMap);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
