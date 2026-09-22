import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

const oldRenderRegex = /const renderEventoCard = \(ev: Evento\) => \(.*?<\/Card>\s*\);/s;

const newRender = `const renderEventoCard = (ev: Evento) => {
    let monthStr = '';
    let dayStr = '';
    if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    return (
      <Card key={ev.id} className="p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start md:items-center group rounded-3xl hover:shadow-lg transition-all border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:-translate-y-0.5">
        
        {/* Date Block */}
        <div className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-24 h-24 shrink-0 border border-indigo-100 dark:border-indigo-900/50 hidden sm:flex">
          <span className="text-sm font-bold uppercase tracking-wider">{monthStr}</span>
          <span className="text-4xl font-black">{dayStr}</span>
        </div>
        
        {/* Mobile Date Badge */}
        <div className="sm:hidden flex items-center gap-2 mb-[-10px] w-full">
           <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3 py-1">
             <Calendar className="size-3.5 mr-1.5" /> {dayStr} {monthStr.toUpperCase()}
           </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5 w-full">
          <h3 className="font-black text-2xl tracking-tight text-slate-800 dark:text-white truncate" title={ev.espetaculo}>
            {ev.espetaculo}
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate" title={\`\${ev.cidade} \${ev.local ? ' - ' + ev.local : ''}\`}>
            <MapPin className="size-4 shrink-0" /> {ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="size-4" /> {ev.horario ? ev.horario.substring(0,5) : 'A definir'}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="size-4" /> {ev.equipe?.length || 0} membros escalados
            </span>
            {ev.turne_id && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                {getTourName(ev.turne_id)}
              </span>
            )}
          </div>
        </div>
  
        {/* Actions */}
        {canEdit && (
          <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800">
            {permitirSms && (
              <Button variant="outline" size="sm" onClick={() => notifyAll(ev)} className="rounded-xl border-slate-200 dark:border-slate-700 font-bold shadow-sm md:hidden lg:flex" title="Notificar Equipe via SMS">
                <Mic2 className="size-4 mr-1.5" /> SMS
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleViewRider(ev)} className="rounded-xl border-slate-200 dark:border-slate-700 font-bold shadow-sm" title="Ver Riders de Palco">
              Riders
            </Button>
            <div className="flex gap-1 ml-auto md:ml-2">
              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ev)} className="rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <Edit className="size-4.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="size-4.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };`;

evt = evt.replace(oldRenderRegex, newRender);
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
