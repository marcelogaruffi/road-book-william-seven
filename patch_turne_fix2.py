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
            
modify_file('src/routes/turne.$slug.tsx', r'\{tour\.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400\">\{tour\.espetaculo\}</p>\}.*?\{tour\.producao && <p className="text-sm font-semibold text-slate-400">Produ.{1,3}o: \{tour\.producao\}</p>\}', turne_header)
