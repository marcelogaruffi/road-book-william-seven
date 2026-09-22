import sys

with open('src/components/RoadbookForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

injection = '''
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Camera className="size-5 text-indigo-500" />
              Logos e Visibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-sm text-slate-700">Logo do Espetáculo</h4>
                  <input type="checkbox" checked={d.exibir_logo_espetaculo ?? true} onChange={e => setD({...d, exibir_logo_espetaculo: e.target.checked})} className="size-4" />
                </div>
                <div className="flex flex-col gap-2">
                  {d.logo_espetaculo_override && <img src={d.logo_espetaculo_override} alt="Logo" className="h-12 object-contain bg-white rounded border" />}
                  <label className="text-xs font-semibold text-slate-600 bg-white border px-2 py-1 rounded cursor-pointer text-center hover:bg-slate-50">
                    Substituir Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]; if(!file) return;
                      const { data: user } = await supabase.auth.getUser();
                      const filePath = `${user?.user?.id}/roadbooks/${Date.now()}-esp`;
                      await supabase.storage.from('roadbook-docs').upload(filePath, file);
                      const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
                      setD({...d, logo_espetaculo_override: data.publicUrl});
                    }} />
                  </label>
                  {d.logo_espetaculo_override && <Button type="button" variant="ghost" size="sm" onClick={() => setD({...d, logo_espetaculo_override: null})} className="text-red-500 h-6 text-xs">Remover Substituição</Button>}
                </div>
              </div>

              <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-sm text-slate-700">Logo da Cia</h4>
                  <input type="checkbox" checked={d.exibir_logo_cia ?? true} onChange={e => setD({...d, exibir_logo_cia: e.target.checked})} className="size-4" />
                </div>
                <div className="flex flex-col gap-2">
                  {d.logo_cia_override && <img src={d.logo_cia_override} alt="Logo" className="h-12 object-contain bg-white rounded border" />}
                  <label className="text-xs font-semibold text-slate-600 bg-white border px-2 py-1 rounded cursor-pointer text-center hover:bg-slate-50">
                    Substituir Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]; if(!file) return;
                      const { data: user } = await supabase.auth.getUser();
                      const filePath = `${user?.user?.id}/roadbooks/${Date.now()}-cia`;
                      await supabase.storage.from('roadbook-docs').upload(filePath, file);
                      const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
                      setD({...d, logo_cia_override: data.publicUrl});
                    }} />
                  </label>
                  {d.logo_cia_override && <Button type="button" variant="ghost" size="sm" onClick={() => setD({...d, logo_cia_override: null})} className="text-red-500 h-6 text-xs">Remover Substituição</Button>}
                </div>
              </div>

              <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-sm text-slate-700">Logo da Produtora</h4>
                  <input type="checkbox" checked={d.exibir_logo_producao ?? true} onChange={e => setD({...d, exibir_logo_producao: e.target.checked})} className="size-4" />
                </div>
                <div className="flex flex-col gap-2">
                  {d.logo_producao_override && <img src={d.logo_producao_override} alt="Logo" className="h-12 object-contain bg-white rounded border" />}
                  <label className="text-xs font-semibold text-slate-600 bg-white border px-2 py-1 rounded cursor-pointer text-center hover:bg-slate-50">
                    Substituir Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]; if(!file) return;
                      const { data: user } = await supabase.auth.getUser();
                      const filePath = `${user?.user?.id}/roadbooks/${Date.now()}-prod`;
                      await supabase.storage.from('roadbook-docs').upload(filePath, file);
                      const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
                      setD({...d, logo_producao_override: data.publicUrl});
                    }} />
                  </label>
                  {d.logo_producao_override && <Button type="button" variant="ghost" size="sm" onClick={() => setD({...d, logo_producao_override: null})} className="text-red-500 h-6 text-xs">Remover Substituição</Button>}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
'''

c = c.replace('      <div className="grid lg:grid-cols-2 gap-8">', injection + '\n      <div className="grid lg:grid-cols-2 gap-8">')

with open('src/components/RoadbookForm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
