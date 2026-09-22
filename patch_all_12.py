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

# 1. Patch roadbook-types.ts to read/write the logo overrides and visibility correctly
rowToRoadbook = '''      espetaculo_logo_url: (row.automacoes as Automacoes)?.espetaculo_logo_url || "",
      exibir_logo_espetaculo: (row.automacoes as Automacoes)?.exibir_logo_espetaculo ?? true,
      exibir_logo_cia: (row.automacoes as Automacoes)?.exibir_logo_cia ?? true,
      exibir_logo_producao: (row.automacoes as Automacoes)?.exibir_logo_producao ?? true,
      logo_producao_override: (row.automacoes as Automacoes)?.logo_producao_override || null,
      logo_cia_override: (row.automacoes as Automacoes)?.logo_cia_override || null,
      logo_espetaculo_override: (row.automacoes as Automacoes)?.logo_espetaculo_override || null,
      financas_receitas: Array.isArray(row.financas_receitas) ? row.financas_receitas : [],'''
modify_file('src/lib/roadbook-types.ts', r'espetaculo_logo_url: \(row\.automacoes as Automacoes\)\?\.espetaculo_logo_url \|\| "",\s*financas_receitas: Array\.isArray\(row\.financas_receitas\) \? row\.financas_receitas : \[\],', rowToRoadbook)

roadbookToPayload = '''      automacoes: {
        ...(typeof d.automacoes === 'object' ? d.automacoes : {}),
        hotel_extras: Array.isArray(d.programacao) ? d.programacao : [],
        info_hotel: {
          observacoes: d.hotel_observacoes,
          cafe_inicio: d.hotel_cafe_inicio,
          cafe_fim: d.hotel_cafe_fim,
          wifi: d.hotel_wifi,
        },
        espetaculo_logo_url: d.espetaculo_logo_url,
        exibir_logo_espetaculo: d.exibir_logo_espetaculo,
        exibir_logo_cia: d.exibir_logo_cia,
        exibir_logo_producao: d.exibir_logo_producao,
        logo_producao_override: d.logo_producao_override,
        logo_cia_override: d.logo_cia_override,
        logo_espetaculo_override: d.logo_espetaculo_override,
      } as any,'''
modify_file('src/lib/roadbook-types.ts', r'automacoes: \{\s*\.\.\.\(typeof d\.automacoes === \'object\' \? d\.automacoes : \{\}\),\s*hotel_extras: Array\.isArray\(d\.programacao\) \? d\.programacao : \[\],\s*info_hotel: \{\s*observacoes: d\.hotel_observacoes,\s*cafe_inicio: d\.hotel_cafe_inicio,\s*cafe_fim: d\.hotel_cafe_fim,\s*wifi: d\.hotel_wifi,\s*\},\s*espetaculo_logo_url: d\.espetaculo_logo_url,\s*\} as any,', roadbookToPayload)

# 2. Patch RoadbookForm.tsx
roadbook_form_upload = '''    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploading(true);
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `logos/${Date.now()}-${cleanName}`;
        const { error } = await supabase.storage.from("midias_eventos").upload(path, file);
        if (error) throw error;
        const { data: publicData } = supabase.storage.from("midias_eventos").getPublicUrl(path);
        up(field, publicData.publicUrl);
        toast.success("Logo enviada com sucesso!");
      } catch (err: any) {
        toast.error("Erro no upload: " + err.message);
      } finally {
        setUploading(false);
      }
    }'''
modify_file('src/components/RoadbookForm.tsx', r'const handleImageUpload = async \(e: React\.ChangeEvent<HTMLInputElement>, field: any\) => \{.*?const ext = file\.name\.split\(\'\.\'\)\.pop\(\);.*?setUploading\(false\);\s*\}\s*\}', roadbook_form_upload)

roadbook_form_old_upload = '''    const handleEspetaculoLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        setUploading(true);
        toast.loading("Enviando logo...");
        
        const path = `logos/${initial.id || 'new'}-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("midias_eventos").upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        
        const { data: publicData } = supabase.storage.from("midias_eventos").getPublicUrl(path);
        
        up("espetaculo_logo_url", publicData.publicUrl);
        toast.success("Logo enviado com sucesso!");
      } catch (err: any) {
        toast.error(err.message ?? "Erro no upload do logo");
      } finally {
        setUploading(false);
        toast.dismiss();
      }
    }'''
modify_file('src/components/RoadbookForm.tsx', r'const handleEspetaculoLogoUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\n.*?setUploading\(false\);\s*\}\s*\}', roadbook_form_old_upload)


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
                        {(d.logo_espetaculo_override || d.espetaculo_logo_url) ? (
                          <>
                            <img src={d.logo_espetaculo_override || d.espetaculo_logo_url} className="max-h-full max-w-full object-contain" />
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
                        {d.logo_cia_override ? (
                          <>
                            <img src={d.logo_cia_override} className="max-h-full max-w-full object-contain" />
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
                        {d.logo_producao_override ? (
                          <>
                            <img src={d.logo_producao_override} className="max-h-full max-w-full object-contain" />
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

modify_file('src/components/RoadbookForm.tsx', r'<div className="flex flex-col gap-2">\s*<Label>Logo do Espetǭculo</Label>\s*<div className="flex items-center gap-4 border rounded-md p-2">.*?<div className="flex-1 min-w-0">', new_logo_section + '\n<div className="flex-1 min-w-0">')

# Strip out the bottom card Logos e Visibilidade I created previously
modify_file('src/components/RoadbookForm.tsx', r'<Card>\s*<CardHeader>\s*<CardTitle>Logos e Visibilidade</CardTitle>\s*<p className="text-sm text-slate-500">Configure as logos que aparecerǜo na versǜo impressa e pblica\.</p>\s*</CardHeader>\s*<CardContent>.*?</CardContent>\s*</Card>', '')

# Strip out "Cor Principal" field
modify_file('src/components/RoadbookForm.tsx', r'<Field label="Cor Principal">\s*<div className="flex gap-2">\s*<Input type="color".*?\/>\s*<Input className="flex-1".*?\/>\s*<\/div>\s*<\/Field>', '')
