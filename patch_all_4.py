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

loader_new = '''const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);

    let logoEspetaculo = rb.logo_espetaculo_override || null;
    let logoCia = rb.logo_cia_override || null;
    let logoProducao = rb.logo_producao_override || null;

    if (!logoEspetaculo || !logoCia) {
      const { data: espData } = await supabase.from("templates_espetaculos").select("logo_espetaculo_url, logo_cia_url").eq("nome_espetaculo", rb.espetaculo).maybeSingle();
      if (espData) {
        if (!logoEspetaculo) logoEspetaculo = espData.logo_espetaculo_url;
        if (!logoCia) logoCia = espData.logo_cia_url;
      }
    }

    if (!logoProducao && rb.tour_id) {
      const { data: tourData } = await supabase.from("tours").select("logo_producao, exibir_logo_espetaculo, exibir_logo_cia, exibir_logo_producao").eq("id", rb.tour_id).maybeSingle();
      if (tourData) {
        logoProducao = tourData.logo_producao;
      }
    }
    
    // We attach them to the rb object to pass to the component
    (rb as any)._resolved_logos = { logoEspetaculo, logoCia, logoProducao };'''

modify_file('src/routes/rb.$slug.tsx', r'const \{ data, error \} = await supabase\.from\("roadbooks"\)\.select\("\*"\)\.eq\("slug", params\.slug\)\.maybeSingle\(\);\s*if \(error\) throw error;\s*if \(\!data\) throw notFound\(\);\s*const rb = rowToRoadbook\(data\);', loader_new)
modify_file('src/routes/_authenticated/print.$slug.tsx', r'const \{ data, error \} = await supabase\.from\("roadbooks"\)\.select\("\*"\)\.eq\("slug", params\.slug\)\.maybeSingle\(\);\s*if \(error\) throw error;\s*if \(\!data\) throw notFound\(\);\s*const rb = rowToRoadbook\(data\);', loader_new)

header_new = '''
            <div className="w-full max-w-3xl mx-auto space-y-4">
              {/* Logo Bar */}
              <div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-white/10">
                {(r as any)._resolved_logos?.logoEspetaculo && r.exibir_logo_espetaculo && (
                  <img src={(r as any)._resolved_logos.logoEspetaculo} alt="Espetáculo" className="h-12 w-auto object-contain dark:brightness-200" />
                )}
                {(r as any)._resolved_logos?.logoCia && r.exibir_logo_cia && (
                  <>
                    <div className="w-px h-10 bg-slate-300 dark:bg-white/20"></div>
                    <img src={(r as any)._resolved_logos.logoCia} alt="Cia" className="h-12 w-auto object-contain dark:brightness-200" />
                  </>
                )}
                {(r as any)._resolved_logos?.logoProducao && r.exibir_logo_producao && (
                  <>
                    <div className="w-px h-10 bg-slate-300 dark:bg-white/20"></div>
                    <img src={(r as any)._resolved_logos.logoProducao} alt="Produção" className="h-12 w-auto object-contain dark:brightness-200" />
                  </>
                )}
              </div>'''

modify_file('src/routes/rb.$slug.tsx', r'<div className="w-full max-w-3xl mx-auto space-y-4">\s*\{\/\* Logo Bar \*\/\}\s*<div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200\s*dark:border-white/10">\s*<img src="/logo-seven\.png".*?</div>', header_new)
modify_file('src/routes/_authenticated/print.$slug.tsx', r'<div className="w-full max-w-3xl mx-auto space-y-4">\s*\{\/\* Logo Bar \*\/\}\s*<div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200\s*dark:border-white/10">\s*<img src="/logo-seven\.png".*?</div>', header_new)

# Title change
modify_file('src/routes/rb.$slug.tsx', r'Road Book', 'Guia de Viagem')
modify_file('src/routes/_authenticated/print.$slug.tsx', r'Road Book', 'Guia de Viagem')
