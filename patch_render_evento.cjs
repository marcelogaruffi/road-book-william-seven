const fs = require('fs'); 
let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8'); 
const start = evt.indexOf('const renderEventoCard'); 
const end = evt.indexOf('return (', start); 
evt = evt.substring(0, start) + `  const renderEventoCard = (ev: Evento) => {
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
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
          
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
          <div onClick={() => { setViewMode(true); handleOpenEdit(ev); }} className="flex-1">
            <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={ev.espetaculo}>{ev.espetaculo}</h4>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={ev.cidade + (ev.local ? ' - ' + ev.local : '')}>
              📍 {ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}
            </p>
            
            <div className="flex flex-col gap-1 mt-2">
              {ev.apresentacoes && ev.apresentacoes.length > 0 ? (
                ev.apresentacoes.map((ap, i) => (
                  <p key={i} className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> {fmtDate(ap.data)} {ap.horario ? 'às ' + ap.horario.substring(0,5) : ''}
                  </p>
                ))
              ) : (
                <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> {fmtDate(ev.data)} {ev.horario ? 'às ' + ev.horario.substring(0,5) : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
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
                    <Mic2 className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { setViewMode(false); handleOpenEdit(ev); }} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" title="Editar">
                  <Edit className="size-4" />
                </Button>
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

  ` + evt.substring(end);
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
