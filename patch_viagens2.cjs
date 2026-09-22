const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/viagens.tsx', 'utf-8').replace(/\r\n/g, '\n');

// Replace the grid class
content = content.replace(
  'className="grid xl:grid-cols-3 md:grid-cols-2 gap-6"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"'
);
content = content.replace(
  'className="grid grid-cols-1 gap-4"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"'
);

// We need to replace renderRoadbookCard again
const startIdx = content.indexOf('const renderRoadbookCard =');
const endMarker = '</Card>\n    );\n  };\n\n  ';
const mainReturnMatch = content.match(/return\s*\(\s*<div className="max-w-7xl mx-auto space-y-12">/);
let endIdx;
if (mainReturnMatch) {
  endIdx = mainReturnMatch.index;
}

if (startIdx !== -1 && endIdx > startIdx) {
  const newCard = `const renderRoadbookCard = (r: Roadbook, index: number) => {
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
      <Card key={r.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative h-full">
        {/* Banner with overlapping Date Square */}
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Logo" />
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

          <a href={profile?.role === 'motorista' ? \`/versao-motorista/\${r.slug}\` : \`/rb/\${r.slug}\`} target="_blank" rel="noreferrer" className="absolute inset-0 z-0"></a>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1 bg-white dark:bg-slate-900/50">
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

            <a href={profile?.role === 'motorista' ? \`/versao-motorista/\${r.slug}\` : \`/rb/\${r.slug}\`} target="_blank" rel="noreferrer">
              <h4 className="text-lg font-black text-[var(--foreground)] leading-tight truncate pr-16 hover:text-indigo-600 transition-colors" title={r.cidade + (r.estado ? ' - ' + r.estado : '')}>
                {r.cidade} {r.estado ? \`- \${r.estado}\` : ''}
              </h4>
            </a>
            
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 truncate" title={r.festival || ''}>
              📍 {r.festival ? r.festival : (r.cidade + (r.estado ? \` - \${r.estado}\` : ''))}
            </p>
            
            <div className="flex flex-col gap-1 mt-3 mb-2">
              <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" /> {fmtDate(r.data_inicial)}
                {r.data_final && r.data_final !== r.data_inicial ? \` até \${fmtDate(r.data_final)}\` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              {r.tour_id && tours.find(t => t.id === r.tour_id) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[100px]">
                  {tours.find(t => t.id === r.tour_id)?.nome || ''}
                </span>
              )}
            </div>
            
            <div className="flex gap-1">
              {profile?.role !== 'motorista' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" asChild title="Abrir Guia">
                  <a href={\`/rb/\${r.slug}\`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
              {(isAdminRole || profile?.role === 'motorista') && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" asChild title="Acessar Roteiro (Motorista)">
                  <a href={\`/versao-motorista/\${r.slug}\`} target="_blank" rel="noreferrer">
                    <Bus className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };\n\n  `;

  content = content.substring(0, startIdx) + newCard + content.substring(endIdx);
  fs.writeFileSync('src/routes/_authenticated/viagens.tsx', content);
}
