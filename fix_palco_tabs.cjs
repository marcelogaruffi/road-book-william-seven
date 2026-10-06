const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/palco.index.tsx', 'utf8');

// When selectedTipo changes to 'conferencia' or 'infra', switch activeTab to 'evento'
content = content.replace(
    /\]\);\s*\/\/\s*useEffect\(\(\) => \{\s*\/\/\s*if \(activeTab === 'configuracao' && selectedTipo === 'conferencia'\) \{\s*\/\/\s*setSelectedTipo\('props'\);\s*\/\/\s*\}\s*\/\/\s*\}, \[activeTab\]\);/g,
    `]);

    useEffect(() => {
      if ((selectedTipo === 'conferencia' || selectedTipo === 'infra') && activeTab !== 'evento') {
        setActiveTab('evento');
      }
    }, [selectedTipo, activeTab]);`
);

// Hide the Configuração Padrão tab completely when conferencia or infra
content = content.replace(
    /\{\(\(activeTab === 'evento' && selectedEventoId\) \|\| activeTab !== 'evento'\) && \(\s*<TabsList/g,
    `{((activeTab === 'evento' && selectedEventoId) || activeTab !== 'evento') && selectedTipo !== 'conferencia' && selectedTipo !== 'infra' && (
        <TabsList`
);

fs.writeFileSync('src/routes/_authenticated/palco.index.tsx', content, 'utf8');
