const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/figurinos.index.tsx', 'utf8');

content = content.replace(
    /\]\);\s*\/\/\s*useEffect\(\(\) => \{\s*\/\/\s*if \(activeTab === 'configuracao' && selectedTipo === 'conferencia'\) \{\s*\/\/\s*setSelectedTipo\('lista'\);\s*\/\/\s*\}\s*\/\/\s*\}, \[activeTab\]\);/g,
    `]);

    useEffect(() => {
      if (selectedTipo === 'conferencia' && activeTab !== 'evento') {
        setActiveTab('evento');
      }
    }, [selectedTipo, activeTab]);`
);

content = content.replace(
    /\{\(\(activeTab === 'evento' && selectedEventoId\) \|\| activeTab !== 'evento'\) && \(\s*<TabsList/g,
    `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && selectedTipo !== 'conferencia' && (
        <TabsList`
);

fs.writeFileSync('src/routes/_authenticated/figurinos.index.tsx', content, 'utf8');
