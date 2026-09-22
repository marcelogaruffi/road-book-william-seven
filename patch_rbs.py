import sys

def process_file(filename, is_print=False):
    with open(filename, 'r', encoding='utf-8') as f:
        c = f.read()

    # Change browser title
    c = c.replace('Road Book', 'Guia de Viagem')

    # Update loader
    loader_old = '''const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);'''

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
    (rb as any)._resolved_logos = { logoEspetaculo, logoCia, logoProducao };
'''
    if loader_old in c:
        c = c.replace(loader_old, loader_new)

    # UI updates
    # We find the header
    header_old = '''<div className="bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-sm border border-white/20">
            <RouteIcon className="w-4 h-4" />
            Guia de Viagem
          </div>'''
          
    header_new = '''<div className="bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          
          <div className="flex flex-wrap justify-center items-center gap-6 mb-6">
            {(r as any)._resolved_logos?.logoEspetaculo && r.exibir_logo_espetaculo && (
              <img src={(r as any)._resolved_logos.logoEspetaculo} alt="Espetáculo" className="h-20 object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/20" />
            )}
            {(r as any)._resolved_logos?.logoCia && r.exibir_logo_cia && (
              <img src={(r as any)._resolved_logos.logoCia} alt="Cia" className="h-20 object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/20" />
            )}
            {(r as any)._resolved_logos?.logoProducao && r.exibir_logo_producao && (
              <img src={(r as any)._resolved_logos.logoProducao} alt="Produção" className="h-20 object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/20" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-sm border border-white/20">
            <RouteIcon className="w-4 h-4" />
            Guia de Viagem
          </div>'''
    
    if header_old in c:
        c = c.replace(header_old, header_new)
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(c)

process_file('src/routes/rb.$slug.tsx')
process_file('src/routes/_authenticated/print.$slug.tsx', True)
