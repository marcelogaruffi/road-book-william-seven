const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

// Replace the previous somDataHelper with the new one
const oldSomDataHelperRegex = /const somData = \(\(\) => \{[\s\S]*?setCurrentShow\(\{ \.\.\.currentShow, rider_som: JSON\.stringify\(newData\) \}\);\n  \};\n\n  const addSomEquipamento = \(\) => \{[\s\S]*?updateSomData\('equipamentos_lista', list\);\n  \};\n/;

const newSomDataHelper = `const somData = (() => {
    try {
      return currentShow.rider_som ? JSON.parse(currentShow.rider_som) : {};
    } catch {
      return { notas_gerais: currentShow.rider_som || '' };
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

  const addSomInputList = () => {
    const list = somData.input_list_tabela || [];
    const proximoCanal = (list.length + 1).toString();
    updateSomData('input_list_tabela', [...list, { id: crypto.randomUUID(), canal: proximoCanal, equipamento: '', obs: '' }]);
  };

  const removeSomInputList = (id: string) => {
    const list = (somData.input_list_tabela || []).filter((e: any) => e.id !== id);
    updateSomData('input_list_tabela', list);
  };

  const updateSomInputList = (id: string, field: string, value: string) => {
    const list = (somData.input_list_tabela || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateSomData('input_list_tabela', list);
  };
`;

code = code.replace(oldSomDataHelperRegex, newSomDataHelper);

// Let's replace the whole step 6 again.
const step6Regex = /\{step === 6 && \([\s\S]*?anexo_som'\)} className="absolute inset-0 opacity-0 cursor-pointer" \/>\n\s+<\/div>\n\s+\)}\n\s+<\/div>\n\s+<\/div>\n\s+<\/div>\n\s+\)}/;

const newStep6 = `{step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                <Mic2 className="size-5 text-emerald-500" /> Rider de Áudio / Som Cadastrado
              </h3>
              
              <div className="space-y-6">

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Lista de Equipamentos (Padrão)</Label>
                    <Button type="button" onClick={addSomEquipamento} size="sm" variant="secondary"><Plus className="size-4 mr-2" /> Adicionar Equipamento</Button>
                  </div>
                  <div className="space-y-3">
                    {(somData.equipamentos_lista || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum equipamento listado.
                      </div>
                    ) : (
                      (somData.equipamentos_lista || []).map((eq: any, index: number) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-8 shrink-0 flex items-center justify-center font-bold text-slate-400">
                            #{index + 1}
                          </div>
                          <div className="w-full sm:w-20">
                            <Input value={eq.qtd} onChange={e => updateSomEquipamento(eq.id, 'qtd', e.target.value)} placeholder="Qtd" className="bg-white dark:bg-black/50 text-center font-bold" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Input value={eq.nome} onChange={e => updateSomEquipamento(eq.id, 'nome', e.target.value)} placeholder="Nome do Equipamento (Ex: Shure SM58)" className="bg-white dark:bg-black/50" />
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

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Input List (Tabela)</Label>
                    <Button type="button" onClick={addSomInputList} size="sm" variant="secondary"><Plus className="size-4 mr-2" /> Adicionar Canal</Button>
                  </div>
                  <div className="space-y-3">
                    {(somData.input_list_tabela || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum canal na Input List.
                      </div>
                    ) : (
                      (somData.input_list_tabela || []).map((eq: any) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-full sm:w-24">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Canal</Label>
                            <Input value={eq.canal} onChange={e => updateSomInputList(eq.id, 'canal', e.target.value)} placeholder="Ex: 01" className="bg-white dark:bg-black/50 font-bold font-mono" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Equipamento/Fonte</Label>
                            <Input value={eq.equipamento} onChange={e => updateSomInputList(eq.id, 'equipamento', e.target.value)} placeholder="Ex: Bumbo (Shure Beta 52)" className="bg-white dark:bg-black/50" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Observações</Label>
                            <Input value={eq.obs} onChange={e => updateSomInputList(eq.id, 'obs', e.target.value)} placeholder="Ex: Direct Box / Phantom Power" className="bg-white dark:bg-black/50" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSomInputList(eq.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 self-end sm:self-auto"><Trash2 className="size-4"/></Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Descritivo / Notas Gerais</Label>
                    <Textarea className="min-h-[120px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.notas_gerais || ''} onChange={e => updateSomData('notas_gerais', e.target.value)} placeholder="Informações adicionais do Rider..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Monitoração / Vias</Label>
                    <Textarea className="min-h-[120px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.monitoracao || ''} onChange={e => updateSomData('monitoracao', e.target.value)} placeholder="Ex: 4 vias In-Ear..." />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <Label className="font-semibold text-sm">Arquivos do Rider (PDFs ou Imagens)</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(currentShow.assets_midia?.anexos_som || []).map((url: string, index: number) => (
                      <div key={index} className="border rounded-xl p-3 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
                        <a href={url} target="_blank" rel="noreferrer" className="font-bold text-sm text-blue-500 hover:underline flex items-center gap-2 truncate max-w-[80%]">
                          <LinkIcon className="size-4 shrink-0"/> Ver Arquivo {index + 1}
                        </a>
                        <Button variant="ghost" size="icon" className="text-red-500 shrink-0 size-8" onClick={() => {
                          const m = {...(currentShow.assets_midia||{})};
                          m.anexos_som = m.anexos_som.filter((_, i) => i !== index);
                          setCurrentShow({...currentShow, assets_midia: m});
                        }}><X className="size-4"/></Button>
                      </div>
                    ))}
                    
                    <div className="border-2 border-dashed rounded-xl h-[52px] flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer">
                      <span className="text-sm font-semibold flex items-center"><Plus className="size-4 mr-1"/> Anexar Arquivo</span>
                      <input type="file" onChange={async (e) => {
                        // Custom handler inside to append to array
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // We will borrow uploadAnexo logic but adapt it for arrays
                        toast.info('Fazendo upload...');
                        const fileExt = file.name.split('.').pop();
                        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
                        const { data: user } = await supabase.auth.getUser();
                        const uid = user?.user?.id || 'public';
                        const filePath = \`\${uid}/midias_eventos/\${Date.now()}-\${cleanName}\`;
                        
                        const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
                        
                        if (uploadError) {
                          toast.error('Erro no upload: ' + uploadError.message);
                        } else {
                          const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
                          
                          const m = {...(currentShow.assets_midia||{})};
                          m.anexos_som = [...(m.anexos_som || []), publicUrl];
                          setCurrentShow(s => ({ ...s, assets_midia: m }));
                          
                          toast.success('Arquivo anexado com sucesso!');
                        }
                      }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}`;

code = code.replace(step6Regex, newStep6);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Espetaculos updated successfully.');
