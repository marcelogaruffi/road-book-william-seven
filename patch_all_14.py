import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"No changes (pattern not found) in {filepath}")


new_logo_section = '''                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">Logos do Cabeçalho</Label>
                    <span className="text-xs text-slate-500">Estas logos aparecerão no guia público. Se quiser trocar alguma só para esta viagem, anexe abaixo.</span>
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
                </div>'''

# Replace old Logo do Espetaculo block
modify_file('src/components/RoadbookForm.tsx', r'<div className="flex flex-col gap-2">\s*<Label>Logo do Espetǭculo</Label>\s*<div className="flex items-center gap-4 border rounded-md p-2">.*?<div className="flex-1 min-w-0">', new_logo_section + '\n<div className="flex-1 min-w-0">')

# Strip out the bottom card Logos e Visibilidade I created previously
modify_file('src/components/RoadbookForm.tsx', r'<Card>\s*<CardHeader>\s*<CardTitle>Logos e Visibilidade</CardTitle>\s*<p className="text-sm text-slate-500">Configure as logos que aparecerǜo na versǜo impressa e pblica\.</p>\s*</CardHeader>\s*<CardContent>.*?</CardContent>\s*</Card>', '')

# Strip out "Cor Principal" field
modify_file('src/components/RoadbookForm.tsx', r'<Field label="Cor Principal">\s*<div className="flex gap-2">\s*<Input type="color".*?\/>\s*<Input className="flex-1".*?\/>\s*<\/div>\s*<\/Field>', '')
