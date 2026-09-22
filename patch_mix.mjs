import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// 1. Add state for logos
evt = evt.replace(
  "const [templatesEspetaculos, setTemplatesEspetaculos] = useState<string[]>([]);",
  "const [templatesEspetaculos, setTemplatesEspetaculos] = useState<string[]>([]);\n  const [logosEspetaculos, setLogosEspetaculos] = useState<Record<string, string>>({});"
);

// 2. Fetch logos in loadData
const oldSelect = "supabase.from('templates_espetaculos').select('nome_espetaculo').neq('nome_espetaculo', 'ESTOQUE_GLOBAL')";
const newSelect = "supabase.from('templates_espetaculos').select('nome_espetaculo, logo_espetaculo_url').neq('nome_espetaculo', 'ESTOQUE_GLOBAL')";
evt = evt.replace(oldSelect, newSelect);

const oldSetTemp = "if (tempRes.data) setTemplatesEspetaculos(tempRes.data.map(t => t.nome_espetaculo));";
const newSetTemp = `if (tempRes.data) {
      setTemplatesEspetaculos(tempRes.data.map(t => t.nome_espetaculo));
      const logos: Record<string, string> = {};
      tempRes.data.forEach(t => {
        if (t.logo_espetaculo_url) logos[t.nome_espetaculo] = t.logo_espetaculo_url;
      });
      setLogosEspetaculos(logos);
    }`;
evt = evt.replace(oldSetTemp, newSetTemp);

// 3. Update the renderEventoCard function
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
                    <Mic2 className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleViewRider(ev)} className="h-8 w-8 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg" title="Ver Riders">
                  <Lightbulb className="size-4" />
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
  };`;

evt = evt.replace(oldRenderRegex, newRender);

// Also need to wrap the lists in a grid instead of a flex-col list!
// The lists are rendered like this:
// <div className="space-y-4">
//   {proximos.map(renderEventoCard)}
// </div>
// Let's change `space-y-4` to `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` for proximos and realizados.
evt = evt.replace(
  /<div className="space-y-4">\s*\{proximos\.map\(renderEventoCard\)\}\s*<\/div>/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">\n              {proximos.map(renderEventoCard)}\n            </div>'
);
evt = evt.replace(
  /<div className="space-y-4">\s*\{realizados\.map\(renderEventoCard\)\}\s*<\/div>/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">\n              {realizados.map(renderEventoCard)}\n            </div>'
);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
