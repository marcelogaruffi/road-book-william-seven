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


logos_section = '''
                  <div className="sm:col-span-2 space-y-4 pt-6 mt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Logos e Visibilidade</h3>
                    <p className="text-sm text-slate-500">
                      Por padrão as logos são puxadas do espetáculo, cia e produtora. Aqui você pode ocultá-las e subir logos específicas para este Roadbook se precisar.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-bold">Logo do Espetáculo</Label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={d.exibir_logo_espetaculo ?? true} onChange={e => up('exibir_logo_espetaculo', e.target.checked)} className="rounded" />
                            Exibir
                          </label>
                        </div>
                        {d.logo_espetaculo_override ? (
                          <div className="relative">
                            <img src={d.logo_espetaculo_override} alt="Logo" className="h-16 object-contain" />
                            <Button variant="ghost" size="sm" onClick={() => up('logo_espetaculo_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                          </div>
                        ) : (
                          <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_espetaculo_override')} />
                        )}
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-bold">Logo da Cia</Label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={d.exibir_logo_cia ?? true} onChange={e => up('exibir_logo_cia', e.target.checked)} className="rounded" />
                            Exibir
                          </label>
                        </div>
                        {d.logo_cia_override ? (
                          <div className="relative">
                            <img src={d.logo_cia_override} alt="Logo" className="h-16 object-contain" />
                            <Button variant="ghost" size="sm" onClick={() => up('logo_cia_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                          </div>
                        ) : (
                          <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_cia_override')} />
                        )}
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-bold">Logo da Produção</Label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={d.exibir_logo_producao ?? true} onChange={e => up('exibir_logo_producao', e.target.checked)} className="rounded" />
                            Exibir
                          </label>
                        </div>
                        {d.logo_producao_override ? (
                          <div className="relative">
                            <img src={d.logo_producao_override} alt="Logo" className="h-16 object-contain" />
                            <Button variant="ghost" size="sm" onClick={() => up('logo_producao_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                          </div>
                        ) : (
                          <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_producao_override')} />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>'''

modify_file('src/components/RoadbookForm.tsx', r'</CardContent>\s*</Card>\s*</div>\s*</TabsContent>\s*<TabsContent value="hotel"', logos_section + '\n              </Card>\n            </div>\n          </TabsContent>\n\n          <TabsContent value="hotel"')
