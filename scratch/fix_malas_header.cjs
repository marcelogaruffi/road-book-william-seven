const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

const targetStr = `      <div className="max-w-4xl mx-auto space-y-6 pb-20">\r
        <div className="flex items-center justify-between mb-4">\r
          <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-800 dark:hover:text-white">\r
            <Link to="/malas"><ChevronLeft className="size-4 mr-2" /> Voltar</Link>\r
          </Button>\r
          <Button onClick={saveChecklist} disabled={saving} className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl font-bold h-11 px-6 shadow-md">\r
            <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Checklist'}\r
          </Button>\r
        </div>`;

const replaceStr = `      <div className="max-w-4xl mx-auto space-y-6 pb-20">`;

const headerStr = `        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <Link to="/malas"><ChevronLeft className="size-4 mr-2" /> Voltar</Link>
          </Button>
          <Button onClick={saveChecklist} disabled={saving} className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl font-bold h-11 px-6 shadow-md">
            <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Checklist'}
          </Button>
        </div>`;

code = code.replace(targetStr, replaceStr);

const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
code = code.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-4xl mx-auto mb-6 mt-4">\n${headerStr}\n      </div>\n      ${tabsPrefix}`);

code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');

fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
console.log('Fixed malas header');
