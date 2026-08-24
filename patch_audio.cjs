const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

const somDataHelper = `
  const somData = (() => {
    try {
      return currentShow.rider_som ? JSON.parse(currentShow.rider_som) : {};
    } catch {
      return { input_list: currentShow.rider_som || '' };
    }
  })();

  const updateSomData = (key: string, value: any) => {
    const newData = { ...somData, [key]: value };
    setCurrentShow({ ...currentShow, rider_som: JSON.stringify(newData) });
  };
`;

code = code.replace(
  'const totalSteps = 10;',
  somDataHelper + '\n  const totalSteps = 10;'
);

const oldStep6 = '{step === 6 && renderTechStep("Rider de Áudio / Som", "Padrão de microfones, mesas e canais", Mic2, "rider_som", "anexo_som", "Detalhes de inputs, consoles exigidos, side fills...")}';

const newStep6 = `{step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                <Mic2 className="size-5 text-emerald-500" /> Rider de Áudio / Som Padrão
              </h3>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Input List (Canais)</Label>
                    <Textarea className="min-h-[150px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm font-mono" value={somData.input_list || ''} onChange={e => updateSomData('input_list', e.target.value)} placeholder="CH 1 - Bumbo\nCH 2 - Caixa..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Monitoração / Vias</Label>
                    <Textarea className="min-h-[150px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.monitoracao || ''} onChange={e => updateSomData('monitoracao', e.target.value)} placeholder="Ex: 4 vias In-Ear..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Arquivo do Rider (PDF / Imagem)</Label>
                  {currentShow.assets_midia?.anexo_som ? (
                    <div className="border rounded-xl p-4 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
                      <span className="font-bold text-sm text-blue-500"><FileUp className="size-4 inline mr-1"/> Arquivo Anexado</span>
                      <Button variant="outline" size="sm" className="text-red-500" onClick={() => {
                        const m = {...(currentShow.assets_midia||{})};
                        delete m['anexo_som'];
                        setCurrentShow({...currentShow, assets_midia: m});
                      }}>Remover</Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-xl h-16 flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-sm font-semibold"><FileUp className="size-4 inline mr-2"/> Clicar para anexar Rider em PDF/Imagem</span>
                      <input type="file" onChange={e => uploadAnexo(e, 'anexo_som')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}`;

code = code.replace(oldStep6, newStep6);
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Espetaculos updated');
