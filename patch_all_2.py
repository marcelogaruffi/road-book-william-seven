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
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-bold text-slate-700">Logos e Visibilidade</h3>
              <p className="text-sm text-slate-500">
                Por padrão as logos são puxadas do espetáculo, cia e produtora. Aqui você pode ocultá-las e subir logos específicas para este Roadbook se precisar.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold">Logo do Espetáculo</Label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={data.exibir_logo_espetaculo ?? true} onChange={e => up('exibir_logo_espetaculo', e.target.checked)} className="rounded" />
                      Exibir
                    </label>
                  </div>
                  {data.logo_espetaculo_override ? (
                    <div className="relative">
                      <img src={data.logo_espetaculo_override} alt="Logo" className="h-16 object-contain" />
                      <Button variant="ghost" size="sm" onClick={() => up('logo_espetaculo_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                    </div>
                  ) : (
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_espetaculo_override')} />
                  )}
                </div>

                <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold">Logo da Cia</Label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={data.exibir_logo_cia ?? true} onChange={e => up('exibir_logo_cia', e.target.checked)} className="rounded" />
                      Exibir
                    </label>
                  </div>
                  {data.logo_cia_override ? (
                    <div className="relative">
                      <img src={data.logo_cia_override} alt="Logo" className="h-16 object-contain" />
                      <Button variant="ghost" size="sm" onClick={() => up('logo_cia_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                    </div>
                  ) : (
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_cia_override')} />
                  )}
                </div>

                <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold">Logo da Produção</Label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={data.exibir_logo_producao ?? true} onChange={e => up('exibir_logo_producao', e.target.checked)} className="rounded" />
                      Exibir
                    </label>
                  </div>
                  {data.logo_producao_override ? (
                    <div className="relative">
                      <img src={data.logo_producao_override} alt="Logo" className="h-16 object-contain" />
                      <Button variant="ghost" size="sm" onClick={() => up('logo_producao_override', null)} className="text-red-500 mt-2 h-6 px-2 text-xs">Remover</Button>
                    </div>
                  ) : (
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo_producao_override')} />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">'''

modify_file('src/components/RoadbookForm.tsx', r'<div className="space-y-2 md:col-span-2">\s*<Label className="font-bold text-slate-700 dark:text-slate-300">Resumo da Viagem</Label>', logos_section + '\n              <Label className="font-bold text-slate-700 dark:text-slate-300">Resumo da Viagem</Label>')
