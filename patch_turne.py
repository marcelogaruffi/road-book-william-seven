import sys
import re

with open('src/routes/turne.$slug.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

loader_old = '''const { data, error } = await supabase.from('tours').select('*').eq('slug', params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const tour = data as Tour;'''

loader_new = '''const { data, error } = await supabase.from('tours').select('*').eq('slug', params.slug).maybeSingle();
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

if loader_old in c:
    c = c.replace(loader_old, loader_new)

header_new = '''
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

c = re.sub(r'\{tour\.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400\">\{tour\.espetaculo\}</p>\}.*?\) : null\}', header_new, c, flags=re.DOTALL)

with open('src/routes/turne.$slug.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
