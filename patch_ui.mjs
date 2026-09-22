import fs from 'fs';

// --- Fix espetaculos.tsx ---
let esp = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

const oldEspCard = `<Card key={show.nome_espetaculo} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-white/10" onClick={() => { setCurrentShow(show); setView("dashboard"); }}>
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {show.logo_espetaculo_url ? (
                      <img src={show.logo_espetaculo_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Music className="size-8 text-slate-300 dark:text-slate-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-black text-white truncate shadow-black drop-shadow-md">{show.nome_espetaculo}</h3>
                      <p className="text-xs font-semibold text-white/90 truncate drop-shadow-md">{show.grupo_cia || "Sem companhia"}</p>
                    </div>
                  </div>
                </Card>`;

const newEspCard = `<Card key={show.nome_espetaculo} className="flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border-slate-200 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900/40" onClick={() => { setCurrentShow(show); setView("dashboard"); }}>
                  <div className="aspect-video w-full bg-slate-50 dark:bg-slate-900/60 p-6 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/60">
                    {show.logo_espetaculo_url ? (
                      <img src={show.logo_espetaculo_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Music className="size-12 text-slate-200 dark:text-slate-800" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">{show.nome_espetaculo}</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate mt-1">{show.grupo_cia || "Sem companhia"}</p>
                  </div>
                </Card>`;

esp = esp.replace(oldEspCard, newEspCard);
fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', esp);


// --- Fix eventos.tsx ---
let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

const oldEvtCardRegex = /<Card key=\{ev\.id\} className="p-5 flex flex-col md:flex-row md:items-center gap-5 justify-between group rounded-\[1\.5rem\]">.*?<\/Card>/s;

const newEvtCard = `<Card key={ev.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-6 justify-between group rounded-3xl hover:shadow-lg transition-all border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:-translate-y-0.5">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-black px-3 py-1">
              <Calendar className="size-3.5 mr-1.5" /> {fmtDate(ev.data)} às {ev.horario?.substring(0,5)}
            </Badge>
            {ev.turne_id && (
              <Badge variant="outline" className="text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 px-3 py-1">
                {getTourName(ev.turne_id)}
              </Badge>
            )}
          </div>
          <h3 className="font-black text-2xl sm:text-3xl tracking-tight text-slate-800 dark:text-white mb-3">{ev.espetaculo}</h3>
          <div className="flex flex-wrap items-center text-sm font-semibold text-slate-500 dark:text-slate-400 gap-x-6 gap-y-2">
            <span className="flex items-center"><MapPin className="size-4 mr-1.5 text-slate-400 dark:text-slate-500"/> {ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}</span>
            <span className="flex items-center"><Users className="size-4 mr-1.5 text-slate-400 dark:text-slate-500"/> {ev.equipe?.length || 0} membros na equipe</span>
          </div>
        </div>
  
        {canEdit && (
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800">
            {permitirSms && (
              <Button variant="outline" size="sm" onClick={() => notifyAll(ev)} className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 font-bold shadow-sm" title="Notificar Equipe via SMS">
                <Mic2 className="size-4 mr-1.5" /> Avisar via SMS
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleViewRider(ev)} className="rounded-xl border-slate-200 dark:border-slate-700 font-bold shadow-sm" title="Ver Riders de Palco">
              <Lightbulb className="size-4 mr-1.5" /> Riders
            </Button>
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ev)} className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10">
                <Edit className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>`;

evt = evt.replace(oldEvtCardRegex, newEvtCard);
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);

console.log("Done");
