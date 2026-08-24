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

  const addSomEquipamento = () => {
    const list = somData.equipamentos_lista || [];
    updateSomData('equipamentos_lista', [...list, { id: crypto.randomUUID(), qtd: '1', nome: '', detalhes: '' }]);
  };

  const removeSomEquipamento = (id: string) => {
    const list = (somData.equipamentos_lista || []).filter((e: any) => e.id !== id);
    updateSomData('equipamentos_lista', list);
  };

  const updateSomEquipamento = (id: string, field: string, value: string) => {
    const list = (somData.equipamentos_lista || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateSomData('equipamentos_lista', list);
  };
`;

// Replace the previous helper with the new one
code = code.replace(
  /const somData = \(\(\) => \{[\s\S]*?setCurrentShow\(\{ \.\.\.currentShow, rider_som: JSON\.stringify\(newData\) \}\);\n  \};\n/,
  somDataHelper + '\n'
);

// We need to add the Equipamentos UI to newStep6.
// Let's replace the whole step 6 again.
const oldStep6Start = '{step === 6 && (';
const oldStep6End = '          )}';
// Let's use regex to replace step 6.
const step6Regex = /\{step === 6 && \([\s\S]*?anexo_som'\)} className="absolute inset-0 opacity-0 cursor-pointer" \/>\n\s+<\/div>\n\s+\)}\n\s+<\/div>\n\s+<\/div>\n\s+<\/div>\n\s+\)}/;

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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Lista de Equipamentos (Padrão)</Label>
                    <Button type="button" onClick={addSomEquipamento} size="sm" variant="secondary"><Plus className="size-4 mr-2" /> Adicionar Linha</Button>
                  </div>
                  <div className="space-y-3">
                    {(somData.equipamentos_lista || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum equipamento listado.
                      </div>
                    ) : (
                      (somData.equipamentos_lista || []).map((eq: any) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-full sm:w-20">
                            <Input value={eq.qtd} onChange={e => updateSomEquipamento(eq.id, 'qtd', e.target.value)} placeholder="Qtd" className="bg-white dark:bg-black/50 text-center" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Input value={eq.nome} onChange={e => updateSomEquipamento(eq.id, 'nome', e.target.value)} placeholder="Nome do Equipamento (Ex: Microfone Shure SM58)" className="bg-white dark:bg-black/50" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Input value={eq.detalhes} onChange={e => updateSomEquipamento(eq.id, 'detalhes', e.target.value)} placeholder="Detalhes (Opcional)" className="bg-white dark:bg-black/50" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSomEquipamento(eq.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 self-end sm:self-auto"><Trash2 className="size-4"/></Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Input List (Canais)</Label>
                    <Textarea className="min-h-[150px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm font-mono" value={somData.input_list || ''} onChange={e => updateSomData('input_list', e.target.value)} placeholder="CH 1 - Bumbo\\nCH 2 - Caixa..." />
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
                      <span className="font-bold text-sm text-blue-500"><LinkIcon className="size-4 inline mr-1"/> Arquivo Anexado</span>
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

code = code.replace(step6Regex, newStep6);
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Done patch 2');
