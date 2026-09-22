import re

with open('src/routes/_authenticated/viagens.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_card = """const renderRoadbookCard = (r: Roadbook, index: number) => {
    const isPast = getRoadbookEndDateTime(r) < now;
    let monthStr = '';
    let dayStr = '';
    if (r.data_inicial) {
      const dt = new Date(r.data_inicial + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    const logoUrl = logosEspetaculos[r.espetaculo];

    return (
      <Card key={r.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative">
        {/* Banner with overlapping Date Square */}
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {r.espetaculo?.toUpperCase() || 'ROADBOOK'}
            </span>
          )}

          {/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center w-14 h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{dayStr}</span>
          </div>

          <a href={profile?.role === 'motorista' ? `/versao-motorista/${r.slug}` : `/rb/${r.slug}`} target="_blank" rel="noreferrer" className="absolute inset-0 z-0"></a>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1">
          <div className="flex-1 relative z-10">
            {isAdminRole && (
              <div className="absolute -top-3 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-1 shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" asChild title="Editar">
                  <Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setDup(r)} title="Duplicar">
                  <Copy className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeleteRbId(r.id)} title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}

            <a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer">
              <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={r.cidade + (r.estado ? ' - ' + r.estado : '')}>
                {r.cidade} {r.estado ? `- ${r.estado}` : ''}
              </h4>
            </a>
            
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={r.festival || ''}>
              📍 {r.festival ? r.festival : (r.cidade + (r.estado ? ` - ${r.estado}` : ''))}
            </p>
            
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5" /> {fmtDate(r.data_inicial)}
                {r.data_final && r.data_final !== r.data_inicial ? ` até ${fmtDate(r.data_final)}` : ''}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 relative z-10">
            {profile?.role !== 'motorista' && (
              <Button className="w-full font-bold h-11 rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4 mr-2" /> Abrir Guia
                </a>
              </Button>
            )}
            {(isAdminRole || profile?.role === 'motorista') && (
              <Button variant="outline" className={`w-full font-bold h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:text-white ${profile?.role === 'motorista' ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-none' : ''}`} asChild>
                <a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer">
                  <Bus className={`size-4 mr-2 ${profile?.role === 'motorista' ? 'text-white/80' : 'text-slate-400'}`} /> Acessar Roteiro
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };"""

start_idx = content.find('const renderRoadbookCard =')
end_idx = content.find('return (', start_idx + 100)
end_idx = content.find('return (', end_idx + 10)  # skip the return of Card
end_idx = content.find('return (', end_idx) # wait, where is the component return?

# A more robust way: find the end of `renderRoadbookCard`
# we can just use regex:
content = re.sub(r'const renderRoadbookCard =.*?</Card>\s*\n\s*};\s*', new_card + '\n\n  ', content, flags=re.DOTALL)

with open('src/routes/_authenticated/viagens.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
