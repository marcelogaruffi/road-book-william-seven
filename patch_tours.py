import sys

def patch_tour_new():
    with open('src/routes/_authenticated/tour.new.tsx', 'r', encoding='utf-8') as f:
        c = f.read()
    
    # State additions
    c = c.replace('const [uploading, setUploading] = useState(false);', 'const [uploading, setUploading] = useState(false);\n  const [exibirLogoEspetaculo, setExibirLogoEspetaculo] = useState(true);\n  const [exibirLogoCia, setExibirLogoCia] = useState(true);\n  const [exibirLogoProducao, setExibirLogoProducao] = useState(true);')
    
    # Payload addition
    c = c.replace('const { data, error } = await supabase.from("tours").insert({', 'const { data, error } = await supabase.from("tours").insert({\n        exibir_logo_espetaculo: exibirLogoEspetaculo,\n        exibir_logo_cia: exibirLogoCia,\n        exibir_logo_producao: exibirLogoProducao,')

    # UI addition
    injection = '''
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-bold text-slate-700">Visibilidade nos Guias de Viagem</h3>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="exibirLogoEspetaculo" checked={exibirLogoEspetaculo} onChange={e => setExibirLogoEspetaculo(e.target.checked)} />
                <label htmlFor="exibirLogoEspetaculo" className="text-sm">Exibir Logo do Espetáculo</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="exibirLogoCia" checked={exibirLogoCia} onChange={e => setExibirLogoCia(e.target.checked)} />
                <label htmlFor="exibirLogoCia" className="text-sm">Exibir Logo da Cia</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="exibirLogoProducao" checked={exibirLogoProducao} onChange={e => setExibirLogoProducao(e.target.checked)} />
                <label htmlFor="exibirLogoProducao" className="text-sm">Exibir Logo da Produção</label>
              </div>
            </div>
          </CardContent>'''
    
    c = c.replace('</CardContent>', injection)

    with open('src/routes/_authenticated/tour.new.tsx', 'w', encoding='utf-8') as f:
        f.write(c)

def patch_tour_id():
    with open('src/routes/_authenticated/tour.$id.tsx', 'r', encoding='utf-8') as f:
        c = f.read()

    # Type definition
    c = c.replace('logo_producao: string | null;', 'logo_producao: string | null;\n  exibir_logo_espetaculo?: boolean;\n  exibir_logo_cia?: boolean;\n  exibir_logo_producao?: boolean;')

    # Ensure defaults are pulled in, or just checked on the object directly.
    # In tour.$id.tsx we use the `tour` object directly.
    
    # Add to save function
    c = c.replace('producao: tour.producao,', 'producao: tour.producao,\n      exibir_logo_espetaculo: tour.exibir_logo_espetaculo ?? true,\n      exibir_logo_cia: tour.exibir_logo_cia ?? true,\n      exibir_logo_producao: tour.exibir_logo_producao ?? true,')
    
    # UI addition
    injection = '''
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-bold text-slate-700">Visibilidade nos Guias de Viagem</h3>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="exibirLogoEspetaculo" checked={tour.exibir_logo_espetaculo ?? true} onChange={e => setTour({...tour, exibir_logo_espetaculo: e.target.checked})} />
              <label htmlFor="exibirLogoEspetaculo" className="text-sm">Exibir Logo do Espetáculo</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="exibirLogoCia" checked={tour.exibir_logo_cia ?? true} onChange={e => setTour({...tour, exibir_logo_cia: e.target.checked})} />
              <label htmlFor="exibirLogoCia" className="text-sm">Exibir Logo da Cia</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="exibirLogoProducao" checked={tour.exibir_logo_producao ?? true} onChange={e => setTour({...tour, exibir_logo_producao: e.target.checked})} />
              <label htmlFor="exibirLogoProducao" className="text-sm">Exibir Logo da Produção</label>
            </div>
          </div>
          <div className="flex justify-end"><Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></div>'''

    c = c.replace('<div className="flex justify-end"><Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></div>', injection)

    with open('src/routes/_authenticated/tour.$id.tsx', 'w', encoding='utf-8') as f:
        f.write(c)

patch_tour_new()
patch_tour_id()
