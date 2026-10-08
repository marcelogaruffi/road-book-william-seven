const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

const startStr = '<div className="mb-8">';
const endStr = '</div>';

const startIdx = content.indexOf(startStr);
const subStr = content.substring(startIdx);
const endIdx = startIdx + subStr.indexOf(endStr) + endStr.length;

const toReplace = content.substring(startIdx, endIdx);

const newMap = `<div className="space-y-8 mb-8">
                {REPORT_GROUPS.map(group => (
                  <div key={group.name} className="bg-transparent">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">{group.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors bg-white shadow-sm">
                          <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                          <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>`;

content = content.replace(toReplace, newMap);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
