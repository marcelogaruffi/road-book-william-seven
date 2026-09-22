import fs from 'fs';

let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf-8');

// 1. Add getErrorMessage to imports
content = content.replace(
  'import { formatPhone } from "@/lib/utils";',
  'import { formatPhone, getErrorMessage } from "@/lib/utils";'
);

// 2. Remove the OLD `Logo do Espetáculo` block up to `handleEspetaculoLogoUpload` usage.
// Wait, actually I can just use a regex in JS. JS regex handles unicode better.
const oldBlockRegex = /<div className="flex flex-col gap-2">\s*<Label>Logo do Espet.*?<\/div>\s*<\/div>\s*<\/div>/s;

const newLogoSection = `                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">Logos do Cabeçalho</Label>
                    <span className="text-xs text-slate-500">Estas logos aparecerão no guia público.</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
                    
                    {/* Espetaculo */}
                    <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-sm">Espetáculo</Label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={d.exibir_logo_espetaculo ?? true} onChange={e => up('exibir_logo_espetaculo', e.target.checked)} className="rounded" /> Exibir
                        </label>
                      </div>
                      <div className="relative group h-16 bg-slate-100 dark:bg-slate-900 rounded-md border flex items-center justify-center overflow-hidden">
                        {(d.logo_espetaculo_override || d.espetaculo_logo_url || defaultLogos.espetaculo) ? (
                          <>
                            <img src={d.logo_espetaculo_override || d.espetaculo_logo_url || defaultLogos.espetaculo} className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => { up("logo_espetaculo_override", ""); up("espetaculo_logo_url", ""); }}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Trocar / Upload</span>
                        )}
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_espetaculo_override')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>

                    {/* Cia */}
                    <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-sm">Cia (Rodapé)</Label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={d.exibir_logo_cia ?? true} onChange={e => up('exibir_logo_cia', e.target.checked)} className="rounded" /> Exibir
                        </label>
                      </div>
                      <div className="relative group h-16 bg-slate-100 dark:bg-slate-900 rounded-md border flex items-center justify-center overflow-hidden">
                        {(d.logo_cia_override || defaultLogos.cia) ? (
                          <>
                            <img src={d.logo_cia_override || defaultLogos.cia} className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => up("logo_cia_override", "")}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Trocar / Upload</span>
                        )}
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_cia_override')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>

                    {/* Producao */}
                    <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-sm">Produtora</Label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={d.exibir_logo_producao ?? true} onChange={e => up('exibir_logo_producao', e.target.checked)} className="rounded" /> Exibir
                        </label>
                      </div>
                      <div className="relative group h-16 bg-slate-100 dark:bg-slate-900 rounded-md border flex items-center justify-center overflow-hidden">
                        {(d.logo_producao_override || defaultLogos.producao) ? (
                          <>
                            <img src={d.logo_producao_override || defaultLogos.producao} className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => up("logo_producao_override", "")}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Trocar / Upload</span>
                        )}
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_producao_override')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>

                  </div>
                </div>`;

content = content.replace(oldBlockRegex, newLogoSection);

// 3. Remove Logos e Visibilidade card
const cardRegex = /<Card>\s*<CardHeader>\s*<CardTitle>Logos e Visibilidade<\/CardTitle>.*?<\/CardContent>\s*<\/Card>/s;
content = content.replace(cardRegex, '');

// 4. Remove Cor Principal field
const corRegex = /<Field label="Cor Principal">.*?<\/Field>/s;
content = content.replace(corRegex, '');

// 5. Remove handleEspetaculoLogoUpload
const handleEspetaculoRegex = /const handleEspetaculoLogoUpload = async.*?toast\.dismiss\(\);\s*\}\s*\}/s;
content = content.replace(handleEspetaculoRegex, '');

fs.writeFileSync('src/components/RoadbookForm.tsx', content);

let editContent = fs.readFileSync('src/routes/_authenticated/roadbook.$id.tsx', 'utf-8');
editContent = editContent.replace(
  'import { toast } from "sonner";',
  'import { toast } from "sonner";\nimport { getErrorMessage } from "@/lib/utils";'
);
fs.writeFileSync('src/routes/_authenticated/roadbook.$id.tsx', editContent);

console.log("Done.");
