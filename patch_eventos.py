import sys

with open('src/routes/_authenticated/eventos.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('equipe: string[];\n};', 'equipe: string[];\n  produtora_nome?: string | null;\n  produtora_logo_url?: string | null;\n};')

c = c.replace('const [todasApresentacoes, setTodasApresentacoes] = useState<any[]>([]);', 'const [produtoraNome, setProdutoraNome] = useState(\'\');\n  const [produtoraLogoUrl, setProdutoraLogoUrl] = useState(\'\');\n  const [todasApresentacoes, setTodasApresentacoes] = useState<any[]>([]);')

c = c.replace('setEspetaculo(ev.espetaculo);', 'setEspetaculo(ev.espetaculo);\n    setProdutoraNome(ev.produtora_nome || \'\');\n    setProdutoraLogoUrl(ev.produtora_logo_url || \'\');')

c = c.replace('const payload = {\n      cidade,', 'const payload = {\n      cidade,\n      produtora_nome: produtoraNome || null,\n      produtora_logo_url: produtoraLogoUrl || null,')

c = c.replace('setCidade(\'\');\n    setTurneId(\'\');', 'setCidade(\'\');\n    setTurneId(\'\');\n    setProdutoraNome(\'\');\n    setProdutoraLogoUrl(\'\');')

injection = '''            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Produtora</Label>
              <Input value={produtoraNome} onChange={e => setProdutoraNome(e.target.value)} placeholder="Nome da Produtora" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Logo da Produtora</Label>
              <div className="flex items-center gap-2">
                {produtoraLogoUrl && <img src={produtoraLogoUrl} alt="Logo" className="h-10 object-contain rounded-md border p-1 bg-white" />}
                <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-accent h-12 w-full justify-center">
                  <Plus className="size-4" /> Anexar Logo
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if(!file) return;
                    const { data: user } = await supabase.auth.getUser();
                    const filePath = `${user?.user?.id}/produtoras/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    await supabase.storage.from('roadbook-docs').upload(filePath, file);
                    const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
                    setProdutoraLogoUrl(data.publicUrl);
                  }} />
                </label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Vincular à Turnê (Opcional)</Label>'''

c = c.replace('<div className="space-y-2 md:col-span-2">\n              <Label className="font-bold text-slate-700 dark:text-slate-300">Vincular à Turnê (Opcional)</Label>', injection)

with open('src/routes/_authenticated/eventos.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
