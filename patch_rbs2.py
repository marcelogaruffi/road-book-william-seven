import sys
import re

with open('src/routes/rb.$slug.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

logo_bar_old = '''              {/* Logo Bar */}
              <div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-white/10">
                <img src="/logo-seven.png" alt="Seven Produções" className="h-12 w-auto object-contain dark:brightness-200" />
                {r.espetaculo_logo_url && (
                  <>
                    <div className="w-px h-10 bg-slate-300 dark:bg-white/20"></div>
                    <img src={r.espetaculo_logo_url} alt={`${r.espetaculo} Logo`} className="h-12 w-auto object-contain dark:brightness-200" />
                  </>
                )}
              </div>'''

logo_bar_new = '''              {/* Logo Bar */}
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

if logo_bar_old in c:
    c = c.replace(logo_bar_old, logo_bar_new)
else:
    print('logo_bar_old not found in rb.$slug.tsx')

with open('src/routes/rb.$slug.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
