const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

// The block to remove is:
const toRemove = `<div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Sistema de P.A. (Ideal)</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.sistema_pa || ''} onChange={e => updateSomData('sistema_pa', e.target.value)} placeholder="Ex: Line Array d&b audiotechnik..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Mesa de Som (FOH)</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.mesa_foh || ''} onChange={e => updateSomData('mesa_foh', e.target.value)} placeholder="Ex: Yamaha CL5..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Mesa de Monitor</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.mesa_monitor || ''} onChange={e => updateSomData('mesa_monitor', e.target.value)} placeholder="Ex: 'feita do P.A.' ou Allen&Heath..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Necessidades de RF (Extras)</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.rf_extras || ''} onChange={e => updateSomData('rf_extras', e.target.value)} placeholder="Ex: 2 sistemas de microfone sem fio..." />
                  </div>
                </div>`;

code = code.replace(toRemove, '');

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('espetaculos.tsx cleaned up');
