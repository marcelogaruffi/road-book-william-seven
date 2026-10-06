const fs = require('fs');

function hideMenuBeforeSelect(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // In files that use GridEventos and have TabsList:
  // Hide TabsList unless (activeTab !== 'evento' || selectedEventoId)
  // Wait, in some files it's `selectedEventoId`, in others it's `evento_id` (via params)
  
  if (content.includes('selectedEventoId')) {
    // Wrap TabsList
    content = content.replace(/<TabsList(?![\s\S]*?<TabsList)[^>]*>[\s\S]*?<\/TabsList>/, match => {
      if (match.includes('selectedEventoId')) return match; // already wrapped or has logic
      return `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && (\n${match}\n)}`;
    });
    
    // Wrap the top menu buttons if they exist (like in figurinos)
    content = content.replace(/<div className="bg-slate-100\/50 dark:bg-slate-800\/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">[\s\S]*?<\/div>\s*(?=<Tabs)/, match => {
      return `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && (\n${match}\n)}`;
    });
  }

  fs.writeFileSync(filename, content, 'utf8');
}

hideMenuBeforeSelect('src/routes/_authenticated/camarins.index.tsx');
hideMenuBeforeSelect('src/routes/_authenticated/figurinos.index.tsx');
hideMenuBeforeSelect('src/routes/_authenticated/palco.index.tsx');
hideMenuBeforeSelect('src/routes/_authenticated/partituras.index.tsx');
hideMenuBeforeSelect('src/routes/_authenticated/musicas.index.tsx');
