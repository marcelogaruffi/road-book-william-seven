import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// The first replacements succeeded (state + renderEventoCard).
// Just to be sure we do it properly:
if (!evt.includes('viewMode')) {
  evt = evt.replace(
    "const [openDialog, setOpenDialog] = useState(false);",
    "const [openDialog, setOpenDialog] = useState(false);\n  const [viewMode, setViewMode] = useState(false);"
  );

  evt = evt.replace(
    "const handleOpenNew = () => {",
    "const handleOpenNew = () => {\n    setViewMode(false);"
  );
}

// Ensure the Megaphone import
if (!evt.includes('Megaphone }')) {
  evt = evt.replace(
    "MessageSquareText, Loader2 }",
    "MessageSquareText, Loader2, Megaphone }"
  );
}

// 2. Overwrite renderEventoCard again in case it got messed up
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
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {ev.espetaculo?.toUpperCase() || 'EVENTO'}
            </span>
          )}
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
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 flex items-center gap-1.5">
              <Clock className="size-3.5" /> {ev.horario ? ev.horario.substring(0,5) : 'A definir'}
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-2" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
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
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {permitirSms && (
                  <Button variant="ghost" size="icon" onClick={() => notifyAll(ev)} className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Notificar via SMS">
                    <Megaphone className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { setViewMode(false); handleOpenEdit(ev); }} className="h-8 w-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Editar">
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
  };`;

evt = evt.replace(/const renderEventoCard = \(ev: Evento\) => \{[\s\S]*?^\s*\};\n/ms, newRender + "\n");

// Also remove renderPastEventoCard if it's there
evt = evt.replace(/const renderPastEventoCard = \(ev: Evento\) => \{[\s\S]*?^\s*\};\n/ms, "");

// Use renderEventoCard in realizados
evt = evt.replace(/realizados\.map\(renderPastEventoCard\)/g, "realizados.map(renderEventoCard)");

// Disable inputs safely: replace the start tag of <Input, <Textarea, <select and file inputs, but only if not already disabled
if(!evt.includes('disabled={viewMode}')) {
  evt = evt.replace(/<Input\b(?!.*disabled=)/g, "<Input disabled={viewMode} ");
  evt = evt.replace(/<Textarea\b(?!.*disabled=)/g, "<Textarea disabled={viewMode} ");
  evt = evt.replace(/<select\b(?!.*disabled=)/g, "<select disabled={viewMode} ");
  evt = evt.replace(/<input type="file"/g, '<input type="file" disabled={viewMode}');
}

// Disable Team adding dropdown
evt = evt.replace(
  /onClick=\{\(\) => setShowDropdown\(!showDropdown\)\}/g,
  'onClick={() => !viewMode && setShowDropdown(!showDropdown)}'
);

// Disable the "Remove Team Member" button
evt = evt.replace(
  /<button \s*onClick=\{\(\) => toggleEquipe\(esc\.usuario_id, esc\.funcao\)\}/g,
  '{!viewMode && <button onClick={() => toggleEquipe(esc.usuario_id, esc.funcao)}'
);
evt = evt.replace(
  /<X className="size-4" \/>\s*<\/button>/g,
  '<X className="size-4" />\n                            </button>}'
);

// Finally, update the Footer!
const footerMatch = evt.match(/<DialogFooter className="mt-4 gap-2">[\s\S]*?<\/DialogFooter>/);
if (footerMatch) {
  const newFooter = `<DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowCachǦǦesDialog(true)} className="rounded-xl h-12 px-6 font-bold mr-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
                💰 Cachês da Equipe
              </Button>
              <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">
                {viewMode ? 'Fechar' : 'Cancelar'}
              </Button>
              {viewMode ? (
                <Button onClick={() => setViewMode(false)} className="rounded-xl h-12 px-8 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Edit className="size-4 mr-2"/> Editar Evento
                </Button>
              ) : (
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md">
                  <Save className="size-4 mr-2"/> Salvar Evento
                </Button>
              )}
            </DialogFooter>`;
  evt = evt.replace(footerMatch[0], newFooter);
}

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
