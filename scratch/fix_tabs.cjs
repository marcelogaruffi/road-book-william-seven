const fs = require('fs');

function fixTabs(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Remove the toggle buttons block completely
  content = content.replace(/<div className="bg-slate-100\/50 dark:bg-slate-800\/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">[\s\S]*?<\/div>\s*<Tabs value={activeTab}/g, '<Tabs value={activeTab}');

  // Remove setSelectedTipo if it exists
  content = content.replace(/const \[selectedTipo, setSelectedTipo\] = [^\n]+\n/, '');

  fs.writeFileSync(filename, content, 'utf8');
}

fixTabs('src/routes/_authenticated/partituras.index.tsx');
fixTabs('src/routes/_authenticated/musicas.index.tsx');
