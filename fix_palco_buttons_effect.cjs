const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/palco.index.tsx', 'utf8');

// Change the useEffect to switch selectedTipo instead of activeTab
content = content.replace(
    /useEffect\(\(\) => \{\s*if \(\(selectedTipo === 'conferencia' \|\| selectedTipo === 'infra'\) && activeTab !== 'evento'\) \{\s*setActiveTab\('evento'\);\s*\}\s*\}, \[selectedTipo, activeTab\]\);/g,
    `useEffect(() => {
      if ((selectedTipo === 'conferencia' || selectedTipo === 'infra') && activeTab === 'configuracao') {
        setSelectedTipo('props');
      }
    }, [activeTab]);`
);

// Remove the hide TabsList logic
content = content.replace(
    /\{\(\(activeTab === 'evento' && selectedEventoId\) \|\| activeTab !== 'evento'\) && selectedTipo !== 'conferencia' && selectedTipo !== 'infra' && \(\s*<TabsList/g,
    `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && (\n        <TabsList`
);

fs.writeFileSync('src/routes/_authenticated/palco.index.tsx', content, 'utf8');
