const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');

// Replace the input list textarea with the table and general notes
// First, we need to add the helper functions for the table in the component.

const tableHelpers = `
  const addSomInputList = () => {
    const list = mapa?.json_data?.input_list_tabela || [];
    const proximoCanal = (list.length + 1).toString();
    updateJson('input_list_tabela', [...list, { id: crypto.randomUUID(), canal: proximoCanal, equipamento: '', obs: '' }]);
  };

  const removeSomInputList = (id: string) => {
    const list = (mapa?.json_data?.input_list_tabela || []).filter((e: any) => e.id !== id);
    updateJson('input_list_tabela', list);
  };

  const updateSomInputList = (id: string, field: string, value: string) => {
    const list = (mapa?.json_data?.input_list_tabela || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateJson('input_list_tabela', list);
  };
`;

code = code.replace(
  '  const addEquipamento = () => {',
  tableHelpers + '\n  const addEquipamento = () => {'
);

// Now let's remove Bloco A's inputs (PA, Mesa FOH, Mesa Monitor). We will keep `rider_som_local`.
const blocoARegex = /<div className="space-y-2">\s*<Label>Sistema de P\.A\. do Local<\/Label>[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>/;
// Wait, regex might fail. Let's just find and replace the whole Bloco A inner content.
const blocoAOld = `<div className="space-y-2">
                  <Label>Sistema de P.A. do Local</Label>
                  <Input value={jd.sistema_pa || ''} onChange={e => updateJson('sistema_pa', e.target.value)} placeholder="Ex: Line Array d&b audiotechnik, 8 caixas por lado" />
                </div>
                {eventoData?.rider_som_local && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full sm:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200" asChild>
                      <a href={eventoData.rider_som_local} target="_blank" rel="noreferrer">
                        Ver Rider de Som do Local
                      </a>
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mesa de Som (FOH)</Label>
                    <Input value={jd.mesa_foh || ''} onChange={e => updateJson('mesa_foh', e.target.value)} placeholder="Ex: Yamaha CL5, DiGiCo SD9..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Mesa de Monitor (Palco)</Label>
                    <Input value={jd.mesa_monitor || ''} onChange={e => updateJson('mesa_monitor', e.target.value)} placeholder="Ex: Allen&Heath SQ6, ou 'feita do P.A.'" />
                  </div>
                </div>`;

const blocoANew = `{eventoData?.rider_som_local && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full sm:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200" asChild>
                      <a href={eventoData.rider_som_local} target="_blank" rel="noreferrer">
                        <FileUp className="size-4 mr-2"/> Ver Rider de Som do Local
                      </a>
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Descritivo / Notas Gerais (Rider)</Label>
                  <Textarea value={jd.notas_gerais || jd.input_list || ''} onChange={e => updateJson('notas_gerais', e.target.value)} placeholder="Informações adicionais e especificações..." className="min-h-[150px]" />
                </div>`;

code = code.replace(blocoAOld, blocoANew);
// Change title of Bloco A
code = code.replace('>Bloco A: P.A. e Consoles</', '>Bloco A: Rider Local e Notas Gerais</');

// Now Bloco B: Input List e Monitoração
const blocoBOld = `<div className="space-y-2">
                  <Label>Input List (Canais de Entrada)</Label>
                  <Textarea value={jd.input_list || ''} onChange={e => updateJson('input_list', e.target.value)} placeholder="Copie e cole ou liste os canais. Ex:&#10;CH 1 - Bumbo (Shure Beta 52)&#10;CH 2 - Caixa (Shure SM57)..." className="min-h-[150px] font-mono text-sm" />
                </div>`;

const blocoBNew = `<div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold text-slate-800 dark:text-white">Input List (Canais)</Label>
                    <Button type="button" onClick={addSomInputList} size="sm" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <Plus className="size-4 mr-2" /> Adicionar Canal
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(jd.input_list_tabela || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum canal listado.
                      </div>
                    ) : (
                      (jd.input_list_tabela || []).map((eq: any) => (
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
                </div>`;

code = code.replace(blocoBOld, blocoBNew);

// Remove "Necessidades Extras (RF)" from Bloco C
const blocoCOld = `<div className="space-y-2">
                  <Label>Necessidades Extras (RF, Intercom...)</Label>
                  <Textarea value={jd.rf_extras || ''} onChange={e => updateJson('rf_extras', e.target.value)} placeholder="Ex: 2 Sistemas in-ear extras, 4 rǭdios intercom..." className="min-h-[80px]" />
                </div>`;

// Wait, the file has a different encoding character for "rádios" and "Necessidades". Let's use regex to replace it safely.
const blocoCRegex = /<div className="space-y-2">\s*<Label>Necessidades Extras \(RF, Intercom...\)<\/Label>[\s\S]*?<\/div>/;
code = code.replace(blocoCRegex, '');

// Also, the user asked: "Em lista de equipamento coloca um # e o item se é 1, 2, 3 em ordem e pá."
// Let's modify the equipamentos_lista in `som.$evento_id.tsx` to include the `#1`, `#2` etc.
const oldEqMap = `(jd.equipamentos_lista || []).map((eq: any) => (
                          <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">`;
const newEqMap = `(jd.equipamentos_lista || []).map((eq: any, index: number) => (
                          <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                            <div className="w-8 shrink-0 flex items-center justify-center font-bold text-slate-400">
                              #{index + 1}
                            </div>`;
code = code.replace(oldEqMap, newEqMap);

// Remove `FileUp` if not imported? `som.$evento_id.tsx` has `FileUp`? Let's check imports.
if(!code.includes('FileUp')) {
  code = code.replace('Trash2, ListChecks } from \'lucide-react\'', 'Trash2, ListChecks, FileUp } from \'lucide-react\'');
}

fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code);
console.log('som.$evento_id.tsx patched successfully.');
