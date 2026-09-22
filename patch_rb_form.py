import sys
import re

with open('src/components/RoadbookForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

injection = '''
          <Card className="rounded-3xl border-slate-200/60 dark:border-white/10 dark:bg-card/40 backdrop-blur-xl shadow-lg mt-6">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-6 mb-6">
              <CardTitle className="text-2xl font-black">Logos e Visibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-bold text-sm mb-2">Logo do Espetáculo</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="exibir_logo_espetaculo" checked={d.exibir_logo_espetaculo ?? true} onChange={e => up('exibir_logo_espetaculo', e.target.checked)} />
                    <label htmlFor="exibir_logo_espetaculo" className="text-sm">Exibir no Guia</label>
                  </div>
                  <Label className="text-xs">Substituir Logo (Opcional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {d.logo_espetaculo_override && <img src={d.logo_espetaculo_override} alt="Logo" className="h-8 object-contain" />}
                    <label className="cursor-pointer text-xs border p-1 rounded hover:bg-slate-50">
                      Enviar <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo_espetaculo_override')} />
                    </label>
                    {d.logo_espetaculo_override && <button type="button" onClick={() => up('logo_espetaculo_override', null)} className="text-xs text-red-500">Remover</button>}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2">Logo da Cia</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="exibir_logo_cia" checked={d.exibir_logo_cia ?? true} onChange={e => up('exibir_logo_cia', e.target.checked)} />
                    <label htmlFor="exibir_logo_cia" className="text-sm">Exibir no Guia</label>
                  </div>
                  <Label className="text-xs">Substituir Logo (Opcional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {d.logo_cia_override && <img src={d.logo_cia_override} alt="Logo" className="h-8 object-contain" />}
                    <label className="cursor-pointer text-xs border p-1 rounded hover:bg-slate-50">
                      Enviar <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo_cia_override')} />
                    </label>
                    {d.logo_cia_override && <button type="button" onClick={() => up('logo_cia_override', null)} className="text-xs text-red-500">Remover</button>}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2">Logo da Produção</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="exibir_logo_producao" checked={d.exibir_logo_producao ?? true} onChange={e => up('exibir_logo_producao', e.target.checked)} />
                    <label htmlFor="exibir_logo_producao" className="text-sm">Exibir no Guia</label>
                  </div>
                  <Label className="text-xs">Substituir Logo (Opcional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {d.logo_producao_override && <img src={d.logo_producao_override} alt="Logo" className="h-8 object-contain" />}
                    <label className="cursor-pointer text-xs border p-1 rounded hover:bg-slate-50">
                      Enviar <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo_producao_override')} />
                    </label>
                    {d.logo_producao_override && <button type="button" onClick={() => up('logo_producao_override', null)} className="text-xs text-red-500">Remover</button>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>'''

c = re.sub(r'</TabsContent>\s*<TabsContent value="hotel"', injection + '\n        </TabsContent>\n        <TabsContent value="hotel"', c)

with open('src/components/RoadbookForm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
