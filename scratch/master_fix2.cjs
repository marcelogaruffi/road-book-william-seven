const fs = require('fs');

const { execSync } = require('child_process');

// 1. Restore all
execSync('git restore src/routes/_authenticated/som.$evento_id.tsx src/routes/_authenticated/video.$evento_id.tsx src/routes/_authenticated/iluminacao.$evento_id.tsx src/routes/_authenticated/som-operacao.$evento_id.tsx src/routes/_authenticated/malas.$evento_id.tsx');

// 2. Run previous fixes
execSync('node scratch/fix_eq.cjs');
execSync('node scratch/fix_single.cjs');
execSync('node scratch/refactor_tabs.cjs');
execSync('node scratch/inject_role.cjs');
execSync('node scratch/redirect_save_safe.cjs');
execSync('node scratch/replace_viewer.cjs');
execSync('node scratch/fix_malas_manual.cjs');

// 3. Fix headers via simple direct replacement
const fixes = [
  {
    f: 'som.$evento_id.tsx',
    headerStr: `        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 mr-4"
            onClick={async () => {
              if (confirm('Tem certeza que deseja apagar as edições e recomeçar este mapa do zero/modelo? Isso excluirá o mapa atual permanentemente.')) {
                await supabase.from('mapas_som').delete().eq('evento_id', evento_id);
                navigate({ to: '/som' });
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            Recomeçar / Trocar Modelo
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Técnico de Som</h1>
            <p className="text-slate-500 font-medium">Preencha as configurações de áudio do espetáculo</p>
          </div>
        </div>`
  },
  {
    f: 'video.$evento_id.tsx',
    headerStr: `        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/video' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 mr-4"
            onClick={async () => {
              if (confirm('Tem certeza que deseja apagar as edições e recomeçar este mapa do zero/modelo? Isso excluirá o mapa atual permanentemente.')) {
                await supabase.from('mapas_video').delete().eq('evento_id', evento_id);
                navigate({ to: '/video' });
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            Recomeçar / Trocar Modelo
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Técnico de Vídeo</h1>
            <p className="text-slate-500 font-medium">Preencha as configurações de vídeo/LED do espetáculo</p>
          </div>
        </div>`
  },
  {
    f: 'iluminacao.$evento_id.tsx',
    headerStr: `        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/iluminacao' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 mr-4"
            onClick={async () => {
              if (confirm('Tem certeza que deseja apagar as edições e recomeçar este mapa do zero/modelo? Isso excluirá o mapa atual permanentemente.')) {
                await supabase.from('mapas_luz').delete().eq('evento_id', evento_id);
                navigate({ to: '/iluminacao' });
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            Recomeçar / Trocar Modelo
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Técnico de Luz</h1>
            <p className="text-slate-500 font-medium">Preencha as configurações de iluminação do espetáculo</p>
          </div>
        </div>`
  },
  {
    f: 'som-operacao.$evento_id.tsx',
    headerStr: `        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som-operacao' })} className="rounded-full">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lista de Deixas (Cues)</h1>
              <p className="text-slate-500 font-medium">{mapa.espetaculo}</p>
            </div>
          </div>
          <Button onClick={startOperation} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-red-600/20 text-lg group">
            <Play className="size-5 mr-3 group-hover:scale-110 transition-transform" /> Iniciar Operação
          </Button>
        </div>`
  }
];

for (const {f, headerStr} of fixes) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  // Convert to utf8 strings matching the file perfectly, actually the file has 'utf8' with correct diacritics.
  // Wait! The file on disk might have different diacritics, let's normalize or just use simple indexOf!
  // I will just read the file, locate '<Button variant="ghost" size="icon" onClick={() => navigate({ to: '
  // and manually slice it based on a regex that isn't greedy.
  
  const extractRegex = /(<div className="flex items-center (?:gap-4|justify-between)">\s*<div.*?<Button variant="ghost" size="icon" onClick=\{.*?navigate[\s\S]*?<\/Button>\s*<div[\s\S]*?<\/div>\s*<\/div>|<div className="flex items-center (?:gap-4|justify-between)">\s*<Button variant="ghost" size="icon" onClick=\{.*?navigate[\s\S]*?<\/Button>[\s\S]*?<\/div>\s*<\/div>)/;

  const match = code.match(extractRegex);
  if (match) {
    const block = match[0];
    code = code.replace(block, "");
    const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
    code = code.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">\n${block}\n      </div>\n      ${tabsPrefix}`);

    if (!code.includes('return (\n    <>\n      <Tabs')) {
      code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
      code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
    }
    
    fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
    console.log('Fixed ' + f);
  } else {
    console.log('Regex did not match in ' + f);
  }
}
