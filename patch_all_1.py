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

# 2. Tela eventos
# Find `const [escalas, setEscalas] = useState<any[]>([]);`
eventos_effect = '''const [escalas, setEscalas] = useState<any[]>([]);

  useEffect(() => {
    if (turneId && turneId !== 'none') {
      const t = tours.find(x => x.id === turneId);
      if (t) {
        if (t.produtora_nome) setProdutoraNome(t.produtora_nome);
        if (t.logo_producao) setProdutoraLogoUrl(t.logo_producao);
      }
    }
  }, [turneId, tours]);'''
modify_file('src/routes/_authenticated/eventos.tsx', r'const \[escalas, setEscalas\] = useState<any\[\]>\(\[\]\);', eventos_effect)

# 3. Turnê page logo
turne_loader_new = '''const { data, error } = await supabase.from('tours').select('*').eq('slug', params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const tour = data as Tour;
    
    let logoEspetaculo = null;
    let logoCia = null;
    if (tour.espetaculo) {
        const { data: espData } = await supabase.from('templates_espetaculos').select('logo_espetaculo_url, logo_cia_url').eq('nome_espetaculo', tour.espetaculo).maybeSingle();
        if (espData) {
            logoEspetaculo = espData.logo_espetaculo_url;
            logoCia = espData.logo_cia_url;
        }
    }
    (tour as any)._resolved_logos = { logoEspetaculo, logoCia };'''
modify_file('src/routes/turne.$slug.tsx', r"const \{ data, error \} = await supabase.from\('tours'\).select\('\*'\).eq\('slug', params.slug\).maybeSingle\(\);\s*if \(error\) throw error;\s*if \(\!data\) throw notFound\(\);\s*const tour = data as Tour;", turne_loader_new)

turne_header = '''
            <div className="flex flex-wrap justify-center items-center gap-6 mt-4 mb-2">
              {(tour as any)._resolved_logos?.logoEspetaculo && (tour.exibir_logo_espetaculo ?? true) && (
                <img src={(tour as any)._resolved_logos.logoEspetaculo} alt="Espetáculo" className="h-14 object-contain" />
              )}
              {(tour as any)._resolved_logos?.logoCia && (tour.exibir_logo_cia ?? true) && (
                <img src={(tour as any)._resolved_logos.logoCia} alt="Cia" className="h-14 object-contain" />
              )}
              {tour.logo_producao && (tour.exibir_logo_producao ?? true) && (
                <img src={tour.logo_producao} alt="Produção" className="h-14 object-contain" />
              )}
            </div>
            {tour.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{tour.espetaculo}</p>}
            {!tour.logo_producao && tour.producao && (tour.exibir_logo_producao ?? true) && (
                <p className="text-sm font-semibold text-slate-400 mt-2">Produção: {tour.producao}</p>
            )}'''
modify_file('src/routes/turne.$slug.tsx', r'\{tour\.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400\">\{tour\.espetaculo\}</p>\}.*?\) : null\}', turne_header)

# 4. RoadbookForm UI (visibilidade logos)
# Since RoadbookForm was reverted, I need to add `handleImageUpload` and the logos section.
# I'll just run my previous python scripts for RoadbookForm, but wait, `patch_rb_form2.py` might be easier to just execute!
