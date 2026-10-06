const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/figurinos.index.tsx', 'utf8');

// Change the useEffect to switch selectedTipo instead of activeTab
content = content.replace(
    /useEffect\(\(\) => \{\s*if \(selectedTipo === 'conferencia' && activeTab !== 'evento'\) \{\s*setActiveTab\('evento'\);\s*\}\s*\}, \[selectedTipo, activeTab\]\);/g,
    `useEffect(() => {
      if (selectedTipo === 'conferencia' && activeTab === 'configuracao') {
        setSelectedTipo('lista');
      }
    }, [activeTab]);`
);

// Hide the Conferencia button when activeTab is configuracao
content = content.replace(
    /<button onClick=\{\(\) => setSelectedTipo\("conferencia"\)\}/g,
    `{activeTab === 'evento' && <button onClick={() => setSelectedTipo("conferencia")}`
);
content = content.replace(
    /ConferÃªncia\s*<\/button>/g,
    `Conferência\n          </button>}`
);

// We still want the tabs to always show, so revert the hide TabsList logic
content = content.replace(
    /\{\(\(activeTab === 'evento' && selectedEventoId\) \|\| activeTab !== 'evento'\) && selectedTipo !== 'conferencia' && \(\s*<TabsList/g,
    `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && (\n        <TabsList`
);

fs.writeFileSync('src/routes/_authenticated/figurinos.index.tsx', content, 'utf8');
