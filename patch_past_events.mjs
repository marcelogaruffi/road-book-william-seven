import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// 1. Update renderEventoCard (Proximos)
const oldRenderRegex = /const renderEventoCard = \(ev: Evento\) => \{.*?^\s*\}\s*;\s*$/ms;
const newRender = `  const renderEventoCard = (ev: Evento) => {
    let monthStr = '';
    let dayStr = '';
    if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    const logoUrl = logosEspetaculos[ev.espetaculo];

    return (
      <Card key={ev.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
        
        {/* Banner with overlapping Date Square */}
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => handleOpenEdit(ev)}>
          
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {ev.espetaculo?.toUpperCase() || 'EVENTO'}
            </span>
          )}

          {/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center w-14 h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{dayStr}</span>
          </div>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1">
          <div onClick={() => handleOpenEdit(ev)} className="flex-1">
            <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={ev.espetaculo}>{ev.espetaculo}</h4>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={ev.cidade + (ev.local ? ' - ' + ev.local : '')}>
              📍 {ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 flex items-center gap-1.5">
              <Clock className="size-3.5" /> {ev.horario ? ev.horario.substring(0,5) : 'A definir'}
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-2">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                <Users className="size-3" /> {ev.equipe?.length || 0}
              </span>
              {ev.turne_id && (
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[120px]">
                  {getTourName(ev.turne_id)}
                </span>
              )}
            </div>
            
            {canEdit && (
              <div className="flex gap-1">
                {permitirSms && (
                  <Button variant="ghost" size="icon" onClick={() => notifyAll(ev)} className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Notificar via SMS">
                    <MessageSquareText className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPastEventoCard = (ev: Evento) => {
    let monthStr = '';
    let dayStr = '';
    if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }
    return (
      <Card key={ev.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex items-center p-3 gap-3 cursor-pointer opacity-80 hover:opacity-100">
        <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg w-12 h-12 shrink-0" onClick={() => handleOpenEdit(ev)}>
          <span className="text-[9px] font-bold uppercase tracking-wider">{monthStr}</span>
          <span className="text-lg font-black leading-none">{dayStr}</span>
        </div>
        <div className="flex-1 min-w-0" onClick={() => handleOpenEdit(ev)}>
          <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{ev.espetaculo}</h4>
          <p className="text-xs text-[var(--muted-foreground)] truncate">{ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}</p>
        </div>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            {permitirSms && (
              <Button variant="ghost" size="icon" onClick={() => notifyAll(ev)} className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Notificar via SMS">
                <MessageSquareText className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </Card>
    );
  };`;

evt = evt.replace(oldRenderRegex, newRender);

// 2. Change the render in realizados
const oldRealizados = /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">\s*\{realizados\.map\(renderEventoCard\)\}\s*<\/div>/g;
const newRealizados = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">\n              {realizados.map(renderPastEventoCard)}\n            </div>`;

evt = evt.replace(oldRealizados, newRealizados);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
