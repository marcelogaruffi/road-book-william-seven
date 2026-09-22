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

# 3. Turnê page logo
turne_loader_new = '''const { data: tour, error } = await supabase.from("tours").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!tour) throw notFound();

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
modify_file('src/routes/turne.$slug.tsx', r'const \{ data: tour, error \} = await supabase\.from\("tours"\)\.select\("\*"\)\.eq\("slug", params\.slug\)\.maybeSingle\(\);\s*if \(error\) throw error;\s*if \(\!tour\) throw notFound\(\);', turne_loader_new)

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
modify_file('src/routes/turne.$slug.tsx', r'\{tour\.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400\">\{tour\.espetaculo\}</p>\}.*?\{tour\.producao && \(\s*<p className="text-sm font-semibold text-slate-400 mt-2">Produção: \{tour\.producao\}</p>\s*\)\}', turne_header)
